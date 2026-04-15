import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  fileId: z.string().min(1),
  note: z.string().min(1, "Not boş olamaz."),
})

async function resolveApplicationId(fileId: string): Promise<string | null> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      applicationId: true,
      project: { select: { applicationId: true } },
    },
  })
  if (!file) return null
  return file.applicationId ?? file.project?.applicationId ?? null
}

async function checkJuryAccess(juryId: string, fileId: string): Promise<boolean> {
  const applicationId = await resolveApplicationId(fileId)
  if (!applicationId) return false
  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId } },
  })
  return !!assignment
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { fileId, note } = parsed.data
  const juryId = session.user.id

  const hasAccess = await checkJuryAccess(juryId, fileId)
  if (!hasAccess) {
    return NextResponse.json({ error: "Bu dosyaya erişim yetkiniz yok." }, { status: 403 })
  }

  const fileNote = await prisma.fileNote.create({
    data: { fileId, userId: juryId, note },
  })

  return NextResponse.json(fileNote, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user.role !== "JURY" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get("fileId")

  if (!fileId) {
    return NextResponse.json({ error: "fileId gerekli." }, { status: 400 })
  }

  // Admin: tüm notları yazar bilgisiyle döndür
  if (session.user.role === "ADMIN") {
    const notes = await prisma.fileNote.findMany({
      where: { fileId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, email: true } } },
    })
    return NextResponse.json(notes)
  }

  // Jüri: yalnızca kendi notları, erişim kontrolü ile
  const juryId = session.user.id
  const hasAccess = await checkJuryAccess(juryId, fileId)
  if (!hasAccess) {
    return NextResponse.json({ error: "Bu dosyaya erişim yetkiniz yok." }, { status: 403 })
  }

  const notes = await prisma.fileNote.findMany({
    where: { fileId, userId: juryId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(notes)
}
