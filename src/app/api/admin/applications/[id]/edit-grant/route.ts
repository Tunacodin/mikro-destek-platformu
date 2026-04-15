import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// PATCH /api/admin/applications/[id]/edit-grant
// Body: { granted: boolean }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  const { id } = await params
  const { granted } = await req.json()

  const application = await prisma.application.findUnique({ where: { id } })
  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 })
  }

  const grantedBool = Boolean(granted)
  await prisma.$executeRaw`UPDATE "Application" SET "editGranted" = ${grantedBool} WHERE id = ${id}`

  return NextResponse.json({ editGranted: grantedBool })
}
