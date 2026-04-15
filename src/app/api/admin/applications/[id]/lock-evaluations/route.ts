import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { id } = await params
  const { locked } = await req.json() as { locked: boolean }

  const application = await prisma.application.findUnique({ where: { id } })
  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 })
  }

  await prisma.$executeRaw`UPDATE "Application" SET "evaluationsLocked" = ${locked} WHERE id = ${id}`

  return NextResponse.json({ id, evaluationsLocked: locked })
}
