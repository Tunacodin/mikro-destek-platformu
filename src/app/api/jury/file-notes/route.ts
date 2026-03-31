import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  fileId: z.string().min(1),
  note: z.string().min(1, "Not boş olamaz."),
})

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

  // Dosyanın ait olduğu başvuruya jüri atanmış olmalı
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { applicationId: true },
  })
  if (!file?.applicationId) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 })
  }

  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId: file.applicationId } },
  })
  if (!assignment) {
    return NextResponse.json({ error: "Bu dosyaya erişim yetkiniz yok." }, { status: 403 })
  }

  const fileNote = await prisma.fileNote.create({
    data: { fileId, userId: juryId, note },
  })

  return NextResponse.json(fileNote, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "JURY") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get("fileId")

  if (!fileId) {
    return NextResponse.json({ error: "fileId gerekli." }, { status: 400 })
  }

  const juryId = session.user.id

  // Erişim kontrolü
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { applicationId: true },
  })
  if (!file?.applicationId) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 })
  }

  const assignment = await prisma.juryAssignment.findUnique({
    where: { juryId_applicationId: { juryId, applicationId: file.applicationId } },
  })
  if (!assignment) {
    return NextResponse.json({ error: "Bu dosyaya erişim yetkiniz yok." }, { status: 403 })
  }

  const notes = await prisma.fileNote.findMany({
    where: { fileId, userId: juryId },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(notes)
}
