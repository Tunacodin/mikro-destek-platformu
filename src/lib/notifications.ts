import { prisma } from "./prisma"

export async function createNotification({
  userId,
  title,
  message,
  link,
}: {
  userId: string
  title: string
  message: string
  link?: string
}) {
  return prisma.notification.create({
    data: { userId, title, message, link },
  })
}

export async function notifyAdmins({
  title,
  message,
  link,
}: {
  title: string
  message: string
  link?: string
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  })
  await Promise.all(
    admins.map((a) => createNotification({ userId: a.id, title, message, link }))
  )
}

// Durum değişikliğine göre standart bildirim mesajları
export const STATUS_NOTIFICATION: Record<
  string,
  { title: string; message: string }
> = {
  IN_REVIEW: {
    title: "Başvurunuz incelemeye alındı",
    message: "Program ekibi başvurunuzu incelemeye aldı. Değerlendirme sürecini takip edebilirsiniz.",
  },
  EVALUATED: {
    title: "Başvurunuz değerlendirildi",
    message: "Jüri değerlendirmesi tamamlandı. Program yöneticisi destek kararını yakında açıklayacak.",
  },
  SUPPORTED: {
    title: "Tebrikler! Başvurunuz desteklendi 🎉",
    message: "Projeniz mikro destek almaya hak kazandı. Proje takip sayfasından süreci yönetebilirsiniz.",
  },
  REJECTED: {
    title: "Başvurunuz kabul edilmedi",
    message: "Bu dönem için başvurunuz değerlendirme sonucunda reddedildi. Sonraki dönemde tekrar başvurabilirsiniz.",
  },
  DRAFT: {
    title: "Başvurunuz düzeltme için geri gönderildi",
    message: "Program yöneticisi bazı bilgilerin güncellenmesini istedi. Lütfen başvurunuzu düzenleyip tekrar gönderin.",
  },
}
