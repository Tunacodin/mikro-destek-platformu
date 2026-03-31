# Mikro Destek Fonu — Geliştirici Kılavuzu

Yeni bir geliştirici olarak projeye başlamak için ihtiyacın olan her şey burada.

---

## İçindekiler

1. [Proje Nedir?](#1-proje-nedir)
2. [Teknoloji Stack](#2-teknoloji-stack)
3. [Klasör Yapısı](#3-klasör-yapısı)
4. [Geliştirme Ortamını Ayağa Kaldırma](#4-geliştirme-ortamını-ayağa-kaldırma)
5. [Servisler ve Portlar](#5-servisler-ve-portlar)
6. [Ortam Değişkenleri (.env)](#6-ortam-değişkenleri-env)
7. [Veri Modeli](#7-veri-modeli)
8. [Uygulama Akışları](#8-uygulama-akışları)
9. [Kimlik Doğrulama ve Yetkilendirme](#9-kimlik-doğrulama-ve-yetkilendirme)
10. [API Yapısı](#10-api-yapısı)
11. [Dosya Depolama (MinIO)](#11-dosya-depolama-minio)
12. [Docker Mimarisi](#12-docker-mimarisi)
13. [Kritik İş Kuralları](#13-kritik-iş-kuralları)
14. [Sık Kullanılan Komutlar](#14-sık-kullanılan-komutlar)

---

## 1. Proje Nedir?

Mikro Destek Fonu (MDF), Divizyon inovasyon ekosistemindeki mikro destek programlarını yöneten bir web platformudur.

**Süreç özeti:**
```
Başvuru Sahibi başvurur
    → Admin incelemeye alır
        → Jüri kriter bazlı puanlar
            → Admin destek kararı verir
                → Proje takip başlar
```

**Üç kullanıcı rolü vardır:**

| Rol | Sorumluluk |
|-----|-----------|
| `ADMIN` | Dönem açar, jüri atar, destek kararı verir |
| `APPLICANT` | Başvuru yapar, dosya yükler, ilerleme raporu gönderir |
| `JURY` | Atandığı başvuruları kriter bazlı puanlar |

---

## 2. Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| ORM | Prisma |
| Veritabanı | PostgreSQL 16 |
| Auth | NextAuth.js v5 — JWT strategy (adapter yok) |
| Dosya Depolama | MinIO (S3-uyumlu) |
| UI | Tailwind CSS + shadcn/ui |
| Validasyon | Zod |
| E-posta | Resend |
| Reverse Proxy | Caddy (SSL otomatik) |

---

## 3. Klasör Yapısı

```
mikro-destek-fonu/
├── prisma/
│   ├── schema.prisma        # Veri modeli
│   └── seed.ts              # Admin kullanıcı seed
├── scripts/
│   └── entrypoint.sh        # Production container başlangıç scripti
├── caddy/
│   └── Caddyfile            # Reverse proxy yapılandırması
├── public/
│   ├── logo-light.png       # Koyu arka plan için logo
│   └── logo-dark.png        # Açık arka plan için logo
└── src/
    ├── app/
    │   ├── (admin)/         # Admin paneli (route group)
    │   │   └── admin/
    │   │       ├── dashboard/
    │   │       ├── applications/[id]/
    │   │       ├── periods/
    │   │       ├── jury/
    │   │       └── projects/
    │   ├── (applicant)/     # Başvuru sahibi paneli
    │   │   └── dashboard/
    │   │       ├── apply/
    │   │       └── applications/
    │   ├── (jury)/          # Jüri paneli
    │   │   └── jury/
    │   │       ├── dashboard/
    │   │       ├── assignments/
    │   │       └── evaluate/[id]/
    │   ├── (auth)/          # Giriş / Kayıt sayfaları
    │   │   ├── login/
    │   │   ├── register/
    │   │   └── magic-link/
    │   ├── api/             # API route'ları
    │   │   ├── admin/       # Admin işlemleri
    │   │   ├── applications/
    │   │   ├── jury/
    │   │   ├── files/
    │   │   ├── upload/
    │   │   └── openapi.json/  # API dokümantasyon spec
    │   ├── dev/             # Geliştirici portalı (sadece dev)
    │   └── onboarding/      # İlk giriş akışı
    ├── components/
    │   ├── admin/
    │   ├── application/
    │   ├── auth/
    │   ├── jury/
    │   └── layout/
    ├── lib/
    │   ├── prisma.ts        # Prisma singleton
    │   ├── minio.ts         # MinIO client
    │   ├── email.ts         # Resend e-posta gönderimi
    │   └── validations/
    ├── auth.ts              # NextAuth yapılandırması
    └── proxy.ts             # Middleware (RBAC + route koruması)
```

> **Route grupları** `(admin)`, `(applicant)`, `(jury)`: URL'e yansımaz, sadece layout paylaşımı için kullanılır.

---

## 4. Geliştirme Ortamını Ayağa Kaldırma

### Ön koşullar
- Docker Desktop
- Node.js 20+

### Adım adım

**1. Repoyu klonla**
```bash
git clone <repo-url>
cd mikro-destek-fonu
git checkout dev   # geliştirme branch'i
```

**2. Ortam değişkenlerini hazırla**
```bash
cp .env.example .env
```
`.env` dosyasını aç ve aşağıdaki alanları doldur:
```
AUTH_SECRET=          # openssl rand -base64 32 ile üret
CIRCLE_API_TOKEN=     # Circle platform API anahtarı
RESEND_API_KEY=       # E-posta gönderimi için (opsiyonel, dev'de mock'lanır)
```
Diğer değerlerin varsayılanları geliştirme için çalışır.

**3. Containerları başlat**
```bash
docker compose up -d
```
İlk başlatmada şunlar otomatik olur:
- PostgreSQL ve MinIO ayağa kalkar
- MinIO bucket'ları oluşturulur (`mdf-applications`, `mdf-projects`)
- Next.js bağımlılıkları kurulur, Prisma client üretilir
- Migration'lar çalışır, admin seed atılır

**4. Geliştirici portalını aç**
```
http://localhost/dev
```
Buradan tüm servislere erişebilirsin.

**5. Admin paneline gir**
```
http://localhost/admin/dashboard
E-posta: admin@mikrodestekfonu.com
Şifre:   Admin1234!
```

---

## 5. Servisler ve Portlar

| Servis | URL | Kullanım |
|--------|-----|---------|
| MDF Uygulaması | http://localhost | Ana uygulama |
| pgAdmin | http://localhost:5050 | Veritabanı yönetim arayüzü |
| MinIO Console | http://localhost:9001 | Dosya depolama arayüzü |
| Prisma Studio | http://localhost:5555 | DB içeriğini görsel incele |
| API Docs | http://localhost/api/reference | Scalar API dokümantasyonu |

**pgAdmin giriş:** `admin@mikrodestekfonu.com` / `Admin1234!`
**MinIO giriş:** `mdfminio` / `mdfminio123`

> Production'da Caddy reverse proxy çalışır, sadece 80/443 portu açıktır.

---

## 6. Ortam Değişkenleri (.env)

```bash
# NextAuth — JWT imzalama anahtarı (zorunlu)
AUTH_SECRET=
AUTH_URL=http://localhost          # Production'da domain adresin

# Veritabanı
DATABASE_URL=postgresql://mdfuser:mdfpass123@postgres:5432/mikro_destek

# MinIO dosya depolama
MINIO_ENDPOINT=minio               # Container adı (production'da IP/domain)
MINIO_PORT=9000
MINIO_ACCESS_KEY=mdfminio
MINIO_SECRET_KEY=mdfminio123
MINIO_USE_SSL=false
MINIO_BUCKET_APPLICATIONS=mdf-applications
MINIO_BUCKET_PROJECTS=mdf-projects

# Circle Platform — üyelik doğrulaması için
CIRCLE_API_TOKEN=
CIRCLE_COMMUNITY_ID=

# Resend — magic link e-postaları için
RESEND_API_KEY=
EMAIL_FROM=noreply@mikrodestekfonu.com

# Docker Compose için ayrı değişkenler
POSTGRES_DB=mikro_destek
POSTGRES_USER=mdfuser
POSTGRES_PASSWORD=mdfpass123
MINIO_ROOT_USER=mdfminio
MINIO_ROOT_PASSWORD=mdfminio123
```

---

## 7. Veri Modeli

### Temel tablolar ve ilişkiler

```
User (ADMIN | APPLICANT | JURY)
 │
 ├── Application (başvuru)
 │    ├── ApplicationPeriod  (hangi döneme ait)
 │    ├── File[]             (yüklenen belgeler)
 │    ├── JuryAssignment[]   (atanan jüriler)
 │    ├── Evaluation         (jüri değerlendirmesi)
 │    │    └── EvaluationScore[]  (kriter bazlı puanlar + gerekçe)
 │    ├── SupportDecision    (admin destek kararı)
 │    └── Project            (destek alırsa oluşur)
 │         └── ProjectReport[]
 │
 ├── MagicLinkToken         (jüri davet linkleri)
 ├── Notification
 └── AuditLog
```

### Başvuru durum makinesi

```
DRAFT → SUBMITTED → IN_REVIEW → EVALUATED → SUPPORTED
                                           → REJECTED
```

| Durum | Tetikleyen |
|-------|-----------|
| `DRAFT` | Başvuru kaydedildi ama gönderilmedi |
| `SUBMITTED` | Başvuru sahibi formu tamamlayıp gönderdi |
| `IN_REVIEW` | Admin "İncelemeye Al" butonuna bastı |
| `EVALUATED` | Jüri değerlendirmesini tamamladı |
| `SUPPORTED` / `REJECTED` | Admin destek kararı verdi |

---

## 8. Uygulama Akışları

### Admin akışı
1. `/admin/periods` → Başvuru dönemi oluştur (tarih aralığı + aktifleştir)
2. `/admin/jury` → Jüri üyelerini magic link ile davet et
3. `/admin/applications` → Gönderilen başvuruları "İncelemeye Al"
4. `/admin/applications/[id]` → Jüri ata (yalnızca `IN_REVIEW` durumunda)
5. `/admin/applications/[id]` → Jüri değerlendirince "Destekle" / "Reddet" kararı ver
6. `/admin/projects` → Aktif projeleri takip et

### Başvuru sahibi akışı
1. Kayıt ol (Circle platformundaki e-posta ile eşleşme zorunlu)
2. Onboarding tamamla (tek seferlik)
3. `/dashboard/apply` → Başvuru formu doldur, dosya yükle, protokolü onayla
4. Başvuruyu gönder
5. Durum güncellemelerini dashboard'dan takip et

### Jüri akışı
1. Admin'in gönderdiği magic link ile sisteme gir (şifre gerekmez)
2. Onboarding tamamla
3. `/jury/assignments` → Atanan başvuruları gör
4. `/jury/evaluate/[id]` → Split view: sol dosyalar, sağ puanlama cetveli
5. Her kriter için 1–5 puan + zorunlu gerekçe yaz
6. Değerlendirmeyi tamamla

### Jüri davet akışı (magic link)
```
Admin → POST /api/admin/jury/invite (email)
     → MagicLinkToken DB'ye yazılır
     → Resend ile e-posta gönderilir
     → Jüri linke tıklar: /auth/magic-link?token=...
     → GET /api/auth/magic-link/validate token doğrular, usedAt işaretler
     → signIn() çağrılır, JWT oluşur
     → Onboarding → /jury/dashboard
```

---

## 9. Kimlik Doğrulama ve Yetkilendirme

**NextAuth v5, JWT strategy** — veritabanı session'ı yoktur, adapter kullanılmaz.

### Token içeriği
```typescript
{
  id: string
  email: string
  role: "ADMIN" | "APPLICANT" | "JURY"
  onboardingCompleted: boolean
}
```

### Route koruması (`src/proxy.ts`)

Next.js `middleware.ts` yerine `proxy.ts` kullanılır (v16 yeniden adlandırması).

Koruma sırası:
1. Public path'ler (`/login`, `/register`, `/api/auth`, `/auth/magic-link`) → serbest geç
2. Oturum yok → `/login`'e yönlendir
3. `onboardingCompleted: false` → `/onboarding`'e yönlendir
4. `/admin/*` için `ADMIN` rolü zorunlu
5. `/jury/*` için `JURY` rolü zorunlu

### Kayıt kısıtlaması

Yalnızca Circle platformunda üye olan e-postalar kayıt olabilir. `POST /api/auth/register` endpoint'i Circle API'yi çağırarak doğrular. `CIRCLE_API_TOKEN` ve `CIRCLE_COMMUNITY_ID` olmadan kayıt çalışmaz.

---

## 10. API Yapısı

Tüm endpoint'ler `src/app/api/` altında Next.js Route Handler'larıdır.

```
POST   /api/auth/register              Yeni kullanıcı kaydı (Circle doğrulamalı)
GET    /api/auth/magic-link/validate   Magic link token doğrulama

GET    /api/applications               Başvuru sahibinin başvuruları
POST   /api/applications               Yeni başvuru oluştur
POST   /api/applications/[id]/submit   Başvuruyu gönder

POST   /api/upload                     MinIO'ya dosya yükle
GET    /api/files/[id]                 Dosya indir (imzalı URL)

POST   /api/admin/periods              Dönem oluştur
PATCH  /api/admin/periods/[id]/status  Dönem durumu güncelle
PATCH  /api/admin/applications/[id]/status   Başvuru durumu güncelle
POST   /api/admin/jury/invite          Jüri daveti gönder
POST   /api/admin/jury/assign          Jüriye başvuru ata
DELETE /api/admin/jury/assign          Jüri atamasını kaldır

POST   /api/jury/evaluations           Değerlendirme kaydet
POST   /api/jury/file-notes            Dosyaya not ekle

GET    /api/openapi.json               OpenAPI 3.1 spec
GET    /api/reference                  Scalar API dokümantasyon UI
```

---

## 11. Dosya Depolama (MinIO)

MinIO, Amazon S3 ile uyumlu açık kaynak bir nesne depolama sistemidir.

**Bucket'lar:**
- `mdf-applications` — başvuru dosyaları
- `mdf-projects` — proje raporları ve ekleri

**Akış:**
```
Client → POST /api/upload
       → src/lib/minio.ts putObject()
       → MinIO bucket'a kaydedilir
       → File kaydı DB'ye yazılır (bucket + key + metadata)
       → Dosyaya erişim: GET /api/files/[id] → imzalı URL (presigned URL)
```

İmzalı URL geçici erişim sağlar; dosyalar doğrudan public erişime açık değildir.

---

## 12. Docker Mimarisi

### Geliştirme (`docker-compose.yml` + `docker-compose.override.yml`)

Override dosyası otomatik birleştirilir, `docker compose up` ikisini birlikte kullanır.

```
┌─────────────────────────────────────────────┐
│  docker-compose.yml (base)                  │
│  + docker-compose.override.yml (dev ekler)  │
│                                             │
│  ┌──────────┐   ┌──────────┐               │
│  │ postgres │   │  minio   │               │
│  │  :5432   │   │  :9000   │               │
│  └────┬─────┘   └────┬─────┘               │
│       │              │                      │
│  ┌────┴──────────────┴──┐                  │
│  │     next-app          │  :3000           │
│  │  (hot reload, dev)    │                  │
│  └──────────────────────┘                  │
│                                             │
│  ┌──────────────┐  ┌──────────┐            │
│  │ prisma-studio│  │ pgadmin  │            │
│  │    :5555     │  │  :5050   │            │
│  └──────────────┘  └──────────┘            │
└─────────────────────────────────────────────┘
```

**Hot reload:** `src/`, `prisma/`, `public/` dizinleri container'a volume olarak bağlanır. Dosya kaydettiğinde Next.js otomatik yenilenir.

**Prisma generate:** Container başlarken `npx prisma generate` otomatik çalışır. Schema değiştirince container'ı yeniden başlatmana gerek yok, sadece `docker compose restart next-app`.

### Dockerfile aşamaları

```
deps (node:20-alpine)
  └── npm ci + prisma generate
        │
        ├── dev (geliştirme)
        │   └── hot reload, source volume mount
        │
        └── builder (production build)
              └── next build
                    │
                    └── runner (production)
                          └── standalone output + entrypoint.sh
```

### Production başlangıç (`scripts/entrypoint.sh`)

```bash
prisma migrate deploy   # Migration'ları uygula
prisma db seed          # Admin seed (yoksa oluştur)
node server.js          # Next.js standalone başlat
```

### Production deployment

```bash
# VPS'de
cp .env.example .env
# .env'i doldur (AUTH_SECRET, CIRCLE_*, RESEND_*, domain bilgileri)
docker compose up -d    # override.yml olmadan sadece base compose çalışır
```

Caddy otomatik olarak Let's Encrypt SSL sertifikası alır.

---

## 13. Kritik İş Kuralları

Bunlar pazarlıksızdır, değiştirmeden önce dikkatli ol:

| Kural | Detay |
|-------|-------|
| **Kayıt kısıtlaması** | Yalnızca Circle komünite üyeleri kayıt olabilir |
| **Protokol onayı** | Belge sonuna scroll etmeden onay butonu aktif olmaz; onay `AuditLog`'a yazılır |
| **Puanlama** | Her kriter için metin gerekçe zorunlu; gerekçesiz form gönderilemez |
| **48 saat kuralı** | Deadline'dan 48 saat önce düzenleme yetkisi otomatik kapanır |
| **Jüri erişimi** | Jüri yalnızca kendisine atanan başvuruları görür |
| **Onboarding** | `User.onboardingCompleted` false ise her girişte onboarding'e yönlendirilir |
| **Magic link** | Tek kullanımlık; `MagicLinkToken.usedAt` dolduktan sonra geçersizdir |

---

## 14. Sık Kullanılan Komutlar

```bash
# Containerları başlat / durdur
docker compose up -d
docker compose down

# Logları izle
docker compose logs -f next-app
docker compose logs -f postgres

# Next.js container'ı yeniden başlat (config değişikliği sonrası)
docker compose restart next-app

# Turbopack cache temizle (build hataları sonrası)
docker exec mdf-app rm -rf /app/.next
docker compose restart next-app

# Yeni migration oluştur (schema.prisma değişikliği sonrası)
docker exec mdf-app npx prisma migrate dev --name aciklayici_isim

# Seed'i tekrar çalıştır
docker exec mdf-app npx prisma db seed

# Prisma Studio (ayrı container olarak zaten çalışıyor)
open http://localhost:5555

# Container içinde shell
docker exec -it mdf-app sh
```

---

## Git Branch Stratejisi

| Branch | Kullanım |
|--------|---------|
| `main` | Production — doğrudan commit atılmaz |
| `dev` | Aktif geliştirme — buraya commit at |

Yeni özellik için: `dev`'den branch aç → PR ile `dev`'e merge et → `dev`'den `main`'e PR.
