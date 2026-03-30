# Mikro Destek Fonu Yönetim Platformu

Divizyon inovasyon ekosistemindeki mikro destek programlarını yönetmek için web tabanlı panel.
Başvuru toplama → jüri değerlendirme → destek kararı → proje takibi süreçlerini tek sistemde yürütür.

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend + API | Next.js 14+ (App Router, TypeScript) |
| ORM | Prisma |
| Veritabanı | PostgreSQL 16 |
| Auth | NextAuth.js v5 (Credentials + Magic Link) |
| Dosya Depolama | MinIO (S3-compatible) |
| UI | Tailwind CSS + shadcn/ui |
| Validasyon | Zod |

## Deployment (Docker Compose)

| Container | Görev | Port |
|-----------|-------|------|
| next-app | Next.js uygulaması | 3000 (internal) |
| postgres | Veritabanı | 5432 (internal) |
| minio | Dosya depolama | 9000 (internal) |
| caddy | Reverse proxy + SSL | 80/443 (public) |

Min. VPS: 4 GB RAM, 2 vCPU, 40 GB SSD, Ubuntu 22/24 LTS (Türkiye)

---

## Kullanıcı Rolleri

| Rol | DB Değeri | Sorumluluk |
|-----|-----------|------------|
| Program Yöneticisi | ADMIN | Dönem açar, jüri atar, destek kararı verir, projeleri takip eder |
| Başvuru Sahibi | APPLICANT | Başvuru yapar, dosya yükler, ilerleme raporu gönderir |
| Jüri Üyesi | JURY | Atanan başvuruları kriter bazlı puanlar, yorum yazar |

---

## Kritik İş Kuralları (PAZARLIKSIZdır)

1. **Kayıt:** Yalnızca Circle platformundaki e-posta ile eşleşen komünite üyeleri kayıt olabilir.
2. **Protokol Onayı:** Belge sonuna scroll etmeden onay butonu aktif olmaz. Onay audit log'a yazılır.
3. **Puanlama:** Her kriter (1–5) için metin gerekçe zorunlu. Gerekçesiz form gönderilemez.
4. **48 Saat Kuralı:** Düzenleme yetkisi ve arşiv erişimi deadline'dan 48 saat önce otomatik kapanır.
5. **Jüri Erişimi:** Jüri yalnızca kendisine atanan başvuruları görür.
6. **Değerlendirme Ekranı:** Split view — sol panel dosyalar, sağ panel puanlama cetveli.
7. **Dosya Notu:** Jüri, başvuru dosyasına özel değerlendirici notu düşebilmeli (FileNote tablosu).
8. **Puan Aralıkları:** Desteklenemez / Sınırlı / Genişletilmiş / Öncelikli — progress bar ile anlık gösterilmeli.
9. **Jüri Daveti:** Magic link (tek kullanımlık) ile sisteme giriş; ayrı hesap oluşturma gerekmez.
10. **Onboarding — Tek Seferlik:** Onboarding yalnızca ilk girişte gösterilir. Sonraki girişlerde atlanır, doğrudan dashboard açılır. `User.onboardingCompleted` flag'i ile kontrol edilir.

---

## Veri Modeli (Özet)

| Tablo | Açıklama |
|-------|----------|
| User | role: ADMIN \| APPLICANT \| JURY; `onboardingCompleted: Boolean` flag'i ile onboarding takibi |
| ApplicationPeriod | Başvuru dönemleri (tarih, durum) |
| Application | Durum makinesi: DRAFT → SUBMITTED → IN_REVIEW → EVALUATED → SUPPORTED/REJECTED |
| File | Application/Project'e bağlı, MinIO'da saklanır |
| JuryAssignment | Jüri ↔ Application eşleştirme |
| Evaluation + EvaluationScore | Kriter bazlı puan + zorunlu gerekçe |
| FileNote | Jüri'nin dosya bazlı notu |
| SupportDecision | Destek kararı ve kapsamı |
| Project | Destek alan aktif projeler |
| Notification | In-app bildirimler |
| AuditLog | Kritik işlem kayıtları (protokol onayı dahil) |

---

## Modüller ve Öncelikler

| Modül | Öncelik |
|-------|---------|
| Auth & Kayıt (Circle eşleşme, magic link, RBAC) | P0 |
| Başvuru Yönetimi (form, dosya, protokol, revize) | P0 |
| Değerlendirme (jüri atama, split-view, kriter+gerekçe) | P0 |
| Destek & Proje Takip (karar, arşiv, rapor) | P1 |
| Dashboard & Bildirim (rol bazlı, geri sayım, e-posta) | P1 |
| Raporlama (istatistikler, proje durumları) | P2 |

## Sprint Planı

- **Sprint 0:** Docker Compose + Prisma + Auth + Layout
- **Sprint 1:** Kayıt akışları + Jüri davet
- **Sprint 2:** Başvuru modülü + dosya yükleme
- **Sprint 3:** Değerlendirme modülü + split view
- **Sprint 4:** Destek kararı + proje takip
- **Sprint 5:** Dashboardlar + bildirimler + raporlama

---

## UX Prensipleri (PRD'den, tasarım kararlarında referans al)

1. **Scroll-to-Approve:** Belge sonuna ulaşmadan onay aktif olmaz; onay audit log'a kaydedilir.
2. **Kullanım Akışı Odaklı UI:** Her rol için "Platformu Nasıl Kullanır?" akışı tasarım referansıdır.
3. **Navigasyon Sadeligi:** Ana akıştan kopmadan bilgiye erişim; gereksiz sayfa geçişi yok.
4. **Rol Bazlı Ekran Odağı:** Admin → görünürlük/kontrol; Başvuru sahibi → yönlendirme/tarih; Jüri → sade/kriter bazlı.
5. **Süreç Görünürlüğü:** Durum etiketleri, geri sayım sayaçları, bekleyen işlemler zorunlu UX öğesi.
6. **Bağlamsal Dokümantasyon:** Yönergeler/kriterler erişilebilir ama ana akışı boğmaz.
7. **Operasyonel Yük Azaltma:** Her özellik için → "Bu mevcut işi kolaylaştırıyor mu? Yeni yük yaratıyor mu?"

---

## Kapsam Dışı

- Finansal ödeme / para transferi (destek ayni destektir, nakdi değil)
- Muhasebe sistemleri
- Harici proje geliştirme araçları
- Kullanıcılar arası mesajlaşma (Slack/Discord kullanılmaya devam eder)

---

## Referans Dokümanlar

- `MikroDestekFonu_TeknikBrief.pdf` — Stack, deployment, iş kuralları, veri modeli, sprint planı
- `Mikro Destek Fonu Yönetim Platformu Amaç ve Kapsam.pdf` — PRD: amaç, kapsam, persona, UX prensipleri
- `Mikrodestek Fonu - Yönetim Paneli.pdf` — UI/UX mockup'ları (görsel referans)
