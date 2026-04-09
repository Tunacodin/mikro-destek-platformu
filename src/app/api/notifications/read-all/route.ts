import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 })
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}
