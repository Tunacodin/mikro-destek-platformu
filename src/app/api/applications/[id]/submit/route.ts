import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// DRAFT → SUBMITTED
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 })
  }

  const { id } = await params
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      files:   { select: { id: true } },
      period:  { select: { endDate: true, status: true } },
      program: { select: { endDate: true, status: true } },
    },
  })

  if (!application) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  if (application.userId !== session.user.id) {
    return NextResponse.json({ error: "Erişim reddedildi." }, { status: 403 })
  }
  if (application.status !== "DRAFT") {
    return NextResponse.json({ error: "Başvuru zaten gönderilmiş." }, { status: 400 })
  }

  // Dönem veya program aktif olmalı
  if (application.period && application.period.status !== "ACTIVE") {
    return NextResponse.json({ error: "Dönem aktif değil." }, { status: 400 })
  }
  if (application.program && application.program.status !== "ACTIVE") {
    return NextResponse.json({ error: "Program aktif değil." }, { status: 400 })
  }

  // 48 saat kuralı yalnızca dönem için
  if (application.period) {
    const hoursLeft = (application.period.endDate.getTime() - Date.now()) / 3_600_000
    if (hoursLeft < 48) {
      return NextResponse.json(
        { error: "Dönem bitimine 48 saatten az kaldığı için başvuru gönderilemez." },
        { status: 400 }
      )
    }
  }

  if (application.files.length === 0) {
    return NextResponse.json(
      { error: "En az bir dosya yüklemeniz gerekiyor." },
      { status: 400 }
    )
  }

  const updated = await prisma.application.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  })

  // Protokol onayını audit log'a kaydet (İş Kuralı #2)
  await prisma.auditLog.create({
    data: {
      action: "PROTOCOL_ACCEPTED",
      metadata: {
        applicationId: id,
        title: application.title,
        protocolAccepted: true,
        submittedAt: new Date().toISOString(),
      },
      userId: session.user.id,
    },
  })

  return NextResponse.json(updated)
}
