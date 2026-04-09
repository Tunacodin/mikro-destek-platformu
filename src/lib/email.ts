import { Resend } from "resend"

const FROM = process.env.EMAIL_FROM ?? "noreply@mikrodestekfonu.com"

export async function sendJuryInviteEmail({
  to,
  name,
  magicLink,
  expiresInDays = 7,
}: {
  to: string
  name?: string
  magicLink: string
  expiresInDays?: number
}) {
  const greeting = name ? `Merhaba ${name},` : "Merhaba,"

  // Lazy init: build time'da API key zorunlu olmamalı
  const resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder")
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Mikro Destek Fonu — Jüri Üyeliği Daveti",
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="font-size: 20px; margin-bottom: 8px;">Mikro Destek Fonu</h2>
        <p>${greeting}</p>
        <p>
          Mikro Destek Fonu değerlendirme sürecine jüri üyesi olarak davet edildiniz.
          Aşağıdaki butona tıklayarak sisteme giriş yapabilirsiniz.
        </p>
        <p>
          Bu bağlantı <strong>${expiresInDays} gün</strong> geçerlidir ve
          <strong>yalnızca bir kez</strong> kullanılabilir.
        </p>
        <div style="margin: 32px 0;">
          <a href="${magicLink}"
             style="display: inline-block; background: #0f172a; color: white;
                    padding: 12px 24px; border-radius: 8px; text-decoration: none;
                    font-weight: 600; font-size: 14px;">
            Jüri Paneline Giriş Yap
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b;">
          Butona tıklayamıyorsanız şu bağlantıyı tarayıcınıza kopyalayın:<br/>
          <a href="${magicLink}" style="color: #64748b;">${magicLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">
          Bu e-postayı siz istemediyseniz güvenle görmezden gelebilirsiniz.
        </p>
      </body>
      </html>
    `,
  })

  if (error) {
    console.error("[resend] Hata detayı:", JSON.stringify(error))
    throw new Error(`E-posta gönderilemedi: ${JSON.stringify(error)}`)
  }
}
