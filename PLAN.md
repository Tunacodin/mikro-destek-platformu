# Mikro Destek Fonu — Geliştirme Planı

---

## 0. Klasör Yapısı

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── magic-link/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── periods/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── applications/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── jury/
│   │       │   ├── page.tsx
│   │       │   └── invite/page.tsx
│   │       └── projects/
│   │           ├── page.tsx
│   │           └── [id]/page.tsx
│   ├── (applicant)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── applications/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── projects/
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── reports/new/page.tsx
│   ├── (jury)/
│   │   ├── layout.tsx
│   │   └── jury/
│   │       ├── dashboard/page.tsx
│   │       └── evaluate/[appId]/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts
│       │   ├── register/route.ts
│       │   └── magic-link/route.ts
│       ├── periods/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── applications/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── submit/route.ts
│       ├── files/
│       │   ├── upload/route.ts
│       │   └── [id]/route.ts
│       ├── jury/
│       │   ├── assignments/route.ts
│       │   ├── assign/route.ts
│       │   └── invite/route.ts
│       ├── evaluations/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── file-notes/route.ts
│       ├── decisions/route.ts
│       ├── projects/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/reports/route.ts
│       └── notifications/route.ts
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── layout/
│   │   ├── AdminSidebar.tsx
│   │   ├── ApplicantNav.tsx
│   │   ├── JuryNav.tsx
│   │   └── NotificationBell.tsx
│   ├── auth/
│   │   ├── RegisterForm.tsx
│   │   ├── LoginForm.tsx
│   │   ├── ProtocolViewer.tsx
│   │   └── MagicLinkHandler.tsx
│   ├── application/
│   │   ├── ApplicationForm.tsx
│   │   ├── FileUploadZone.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── DeadlineCountdown.tsx
│   │   └── ApplicationTable.tsx
│   ├── evaluation/
│   │   ├── SplitView.tsx
│   │   ├── FilePanel.tsx
│   │   ├── ScoringPanel.tsx
│   │   ├── CriterionRow.tsx
│   │   ├── ScoreBandProgress.tsx
│   │   └── FileNoteDrawer.tsx
│   ├── decision/
│   │   ├── DecisionForm.tsx
│   │   └── DecisionBadge.tsx
│   └── project/
│       ├── ProjectCard.tsx
│       └── ReportForm.tsx
├── lib/
│   ├── auth/
│   │   ├── auth.ts
│   │   ├── circle-verify.ts
│   │   └── magic-link.ts
│   ├── db/
│   │   └── prisma.ts
│   ├── minio/
│   │   ├── client.ts
│   │   ├── upload.ts
│   │   └── presigned.ts
│   ├── validations/
│   │   ├── auth.schema.ts
│   │   ├── application.schema.ts
│   │   ├── evaluation.schema.ts
│   │   ├── period.schema.ts
│   │   └── decision.schema.ts
│   ├── hooks/
│   │   ├── useCountdown.ts
│   │   ├── useScrollEnd.ts
│   │   └── useScoreBand.ts
│   └── utils/
│       ├── deadline.ts
│       ├── score-band.ts
│       └── audit.ts
├── middleware.ts
└── types/
    ├── next-auth.d.ts
    └── index.ts
```

---

## 1. Kritik İş Kuralları

| # | Kural | Nerede Enforce Edilir |
|---|-------|-----------------------|
| 1 | Kayıt: yalnızca Circle üyesi | `POST /api/auth/register` → Circle API kontrolü |
| 2 | Protokol onayı: scroll-to-end zorunlu | `ProtocolViewer.tsx` (UX) + `POST /api/audit/protocol-accept` (AuditLog) |
| 3 | Puanlama: gerekçe zorunlu (min 10 karakter) | `CriterionRow.tsx` (UX) + Zod şeması + `POST /api/evaluations` |
| 4 | 48 saat kuralı: düzenleme + arşiv kapanır | `deadline.ts` util → upload, edit, file GET API'larında |
| 5 | Jüri: yalnızca atanan başvuruları görür | `GET /api/jury/assignments` where juryId filtresi |
| 6 | Split view değerlendirme | `/jury/evaluate/[appId]` iki panel layout |
| 7 | Dosya notu (FileNote) | `FileNoteDrawer.tsx` + `POST /api/evaluations/file-notes` |
| 8 | Puan aralığı progress bar | `ScoreBandProgress.tsx` + `useScoreBand` hook |
| 9 | Magic link tek kullanımlık | `MagicLink.used = true` sonra token geçersiz |
| 10 | Onboarding tek seferlik | Middleware: `onboardingCompleted === false` → redirect `/onboarding` |

---

## 2. Puan Aralıkları

```
< 2.0   → UNSUPPORTED  (Desteklenemez)  → kırmızı
2.0–3.0 → LIMITED      (Sınırlı)        → turuncu
3.0–4.0 → EXTENDED     (Genişletilmiş)  → sarı
>= 4.0  → PRIORITY     (Öncelikli)      → yeşil
```

---

## 3. Application Durum Makinesi

```
DRAFT
  ↓ (Applicant: submit, min 1 dosya zorunlu)
SUBMITTED
  ↓ (Admin: jüri atar)
IN_REVIEW
  ↓ (Tüm jüriler tamamlayınca otomatik)
EVALUATED
  ↓ (Admin: destek kararı)
SUPPORTED / REJECTED
```

---

## 4. Uygulama Katmanı Kararları

### Server vs Client Component

| Bileşen | Tip | Neden |
|---------|-----|-------|
| Tüm `page.tsx` (liste/detay) | Server | Veri fetch, auth kontrolü |
| `SplitView.tsx` | Client | Reaktif skor hesaplama |
| `ApplicationForm.tsx` | Client | Multi-step form, auto-save |
| `ProtocolViewer.tsx` | Client | Scroll event listener |
| `DeadlineCountdown.tsx` | Client | setInterval timer |
| `ScoreBandProgress.tsx` | Client | Anlık hesaplama |
| `NotificationBell.tsx` | Client | Polling, state |
| `FileUploadZone.tsx` | Client | Drag-drop, preview |

### Route Handler vs Server Action
Route Handler tercih edilir — net RBAC, büyük dosya yükleme, reusable API.
Server Action yalnızca basit state değişimlerinde: bildirim okundu, onboarding tamamlandı.

### API Hata Formatı

```typescript
// Hata: { error: string, code?: string }
// Başarı: { data: T, meta?: PaginationMeta }

// HTTP kodları:
// 400 — validasyon hatası
// 401 — oturum yok
// 403 — yetki yok veya 48h kuralı
// 404 — bulunamadı
// 409 — çakışma
// 503 — Circle API unavailable
```

---

## 5. MinIO Bucket Yapısı

```
mdf-applications/
  {applicationId}/
    {fileId}-{originalName}

mdf-projects/
  {projectId}/
    reports/
      {reportId}-{originalName}

mdf-protocols/
  protocol-v{version}.pdf

mdf-temp/               ← 24 saat TTL, cron ile temizlenir
  {uploadSessionId}/
    {fileId}
```

---

## 6. API Endpoint Tablosu

| Method | Path | Rol | Kritik Kural |
|--------|------|-----|--------------|
| POST | `/api/auth/register` | Public | #1 |
| POST | `/api/auth/magic-link` | ADMIN | #9 |
| GET | `/api/periods` | Auth | — |
| POST | `/api/periods` | ADMIN | — |
| PUT | `/api/periods/[id]` | ADMIN | — |
| DELETE | `/api/periods/[id]` | ADMIN | — |
| GET | `/api/applications` | Auth | #5 |
| POST | `/api/applications` | APPLICANT | — |
| GET | `/api/applications/[id]` | Auth | #5 |
| PUT | `/api/applications/[id]` | APPLICANT | #4 |
| POST | `/api/applications/[id]/submit` | APPLICANT | — |
| POST | `/api/files/upload` | Auth | #4 |
| GET | `/api/files/[id]` | Auth | #4 |
| DELETE | `/api/files/[id]` | APPLICANT | #4 |
| GET | `/api/jury/assignments` | JURY/ADMIN | #5 |
| POST | `/api/jury/assign` | ADMIN | — |
| POST | `/api/jury/invite` | ADMIN | #9 |
| POST | `/api/evaluations` | JURY | #3 |
| PUT | `/api/evaluations/[id]` | JURY | #3 |
| POST | `/api/evaluations/file-notes` | JURY | #7 |
| POST | `/api/decisions` | ADMIN | — |
| GET | `/api/projects` | Auth | — |
| POST | `/api/projects/[id]/reports` | APPLICANT | — |
| GET | `/api/notifications` | Auth | — |
| PUT | `/api/notifications/[id]/read` | Auth | — |

---

## 7. Sprint Planı

### Sprint 0 — Altyapı (P0)

| Branch | Ne Yapılır |
|--------|-----------|
| `chore/docker-compose-setup` | Docker Compose, Dockerfile, Caddyfile |
| `chore/db-prisma-init` | Prisma schema + ilk migration |
| `feat/auth-nextauth-setup` | NextAuth v5, JWT/session callback, tip genişletme |
| `feat/auth-rbac-middleware` | Middleware: route guard + onboarding redirect |
| `chore/layout-base-setup` | Tailwind, shadcn/ui, rol bazlı layout wrapper'lar |

**Bağımlılık:** Yok. Her branch sırayla develop'a merge edilir.

---

### Sprint 1 — Auth Akışları (P0)

| Branch | Ne Yapılır | Kritik Kural |
|--------|-----------|--------------|
| `feat/auth-circle-register` | Kayıt formu + Circle API doğrulama | #1 |
| `feat/auth-login-page` | Login formu, hata yönetimi | — |
| `feat/auth-onboarding` | Onboarding sayfası, flag güncelleme | #10 |
| `feat/jury-magic-link-invite` | Token üretimi, e-posta, token doğrulama | #9 |
| `feat/auth-protocol-viewer` | Scroll-to-approve bileşeni, AuditLog | #2 |

**Circle Verify Akışı:**
```
POST /api/auth/register
  → Circle API: GET /community/members?email={email}
  → Sonuç boşsa 403 dön
  → Başarılıysa User kaydı oluştur
  → Circle unavailable ise 503 dön (fail-safe)
```

**Magic Link Akışı:**
```
ADMIN → POST /api/jury/invite { email }
  → MagicLink { token, expiresAt: +15dk, used: false }
  → E-posta: /auth/magic-link?token=xxx
  → Jüri linke tıklar
  → Token: used=false + expiresAt > now kontrolü
  → used=true yap, session başlat
  → onboardingCompleted=false → /onboarding
  → true → /jury/dashboard
```

---

### Sprint 2 — Başvuru Modülü (P0)

| Branch | Ne Yapılır | Kritik Kural |
|--------|-----------|--------------|
| `feat/admin-periods` | Dönem CRUD, durum makinesi | — |
| `feat/application-form` | Çok adımlı form, auto-save (2sn debounce) | — |
| `feat/application-status-machine` | Durum geçiş kuralları, StatusBadge | — |
| `feat/application-file-upload` | MinIO entegrasyonu, FileUploadZone | #4 |
| `feat/application-revision` | Revizyon isteme akışı | — |

**Period Durum Makinesi:**
```
DRAFT → OPEN (Admin "Başvuruya Aç")
OPEN → CLOSED (endDate geçince otomatik veya Admin manüel)
CLOSED → ARCHIVED (Admin "Arşivle")
```

**Dosya Yükleme:**
```
client → POST /api/files/upload (multipart)
  → isWithin48Hours kontrolü → 403 veya devam
  → MinIO'ya stream (presigned URL yok, güvenli)
  → File kaydı DB'ye yaz
  → { fileId, fileName, size } dön
```

---

### Sprint 3 — Değerlendirme Modülü (P0)

| Branch | Ne Yapılır | Kritik Kural |
|--------|-----------|--------------|
| `feat/jury-assignment` | Jüri atama, IN_REVIEW tetikle, bildirim | #5 |
| `feat/evaluation-split-view` | Split view layout, FilePanel + ScoringPanel | #6 |
| `feat/evaluation-scoring` | CriterionRow, gerekçe zorunlu, submit guard | #3 |
| `feat/evaluation-file-notes` | FileNoteDrawer, POST/GET file-notes | #7 |
| `feat/evaluation-aggregate` | Ortalama hesaplama, EVALUATED status tetikle | #8 |

**Split View Layout:**
```
/jury/evaluate/[appId]
┌──────────────────┬──────────────────┐
│   FilePanel      │  ScoringPanel    │
│   (w-1/2)        │  (w-1/2)         │
│                  │                  │
│  Dosya listesi   │  Kriter listesi  │
│  PDF viewer      │  1-5 puan        │
│  Dosya notu      │  Gerekçe         │
│                  │  ScoreBandBar    │
│                  │  Submit butonu   │
└──────────────────┴──────────────────┘
```

**Submit Guard:**
```
scores.every(s => s.score >= 1 && s.rationale.trim().length >= 10)
→ false ise submit disabled
→ Zod şeması da aynı kuralı enforce eder (server)
```

---

### Sprint 4 — Destek Kararı + Proje Takip (P1)

| Branch | Ne Yapılır |
|--------|-----------|
| `feat/decision-support` | DecisionForm, SupportLevel seçimi, otomatik Project oluşturma |
| `feat/project-management` | Proje detay sayfaları (admin + applicant) |
| `feat/project-reports` | İlerleme raporu formu, rapor listesi |
| `feat/application-archive-access` | 48h arşiv erişim kısıtlaması |

**Karar Akışı:**
```
Admin → DecisionForm → POST /api/decisions
  → SupportDecision kaydı
  → level != UNSUPPORTED → Project otomatik oluşur
  → Application.status → SUPPORTED veya REJECTED
  → APPLICANT'a bildirim
```

---

### Sprint 5 — Dashboard + Bildirim + Raporlama (P1/P2)

| Branch | Öncelik |
|--------|---------|
| `feat/admin-dashboard` | P1 |
| `feat/applicant-dashboard` | P1 |
| `feat/jury-dashboard` | P1 |
| `feat/notification-system` | P1 |
| `feat/reporting` | P2 |

**Bildirim Tetikleyiciler:**

| Olay | Alıcı |
|------|-------|
| Jüri atandı | JURY |
| Başvuru değerlendirmeye alındı | APPLICANT |
| Destek kararı verildi | APPLICANT |
| Yeni ilerleme raporu | ADMIN |
| Dönem açıldı | Tüm APPLICANT'lar |

---

## 8. Branch Stratejisi

```
main                    → production, direkt commit yok
  └── develop           → aktif geliştirme
       ├── chore/*      → config, tooling, altyapı
       ├── feat/*       → yeni özellik
       ├── fix/*        → hata düzeltme
       └── release/*    → sprint tamamlanınca main'e
```

**Merge Stratejisi:**
- `feat/*` → `develop`: Squash and merge (temiz history)
- `develop` → `main`: Merge commit (release noktası net görünür)

**Her Sprint Sonunda:**
```bash
git checkout develop
git checkout -b release/v0.x.0
# test et
git checkout main
git merge release/v0.x.0 --no-ff
git tag v0.x.0
```

---

## 9. Commit Formatı

```
<type>(<scope>): <kısa açıklama>

type: feat | fix | chore | refactor | style | test | docs
scope: auth | application | jury | evaluation | decision | project | notification | db | docker

Örnekler:
  feat(auth): add circle email validation on register
  fix(jury): prevent score submission without justification
  chore(docker): add multi-stage dockerfile
  feat(evaluation): add split view with file and scoring panels
  fix(application): enforce 48h deadline check on file upload
```

---

## 10. Bağımlılık Sırası

```
Sprint 0 (altyapı)
  → Sprint 1 (auth)
    → Sprint 2 (başvuru)
      → Sprint 3 (değerlendirme)
        → Sprint 4 (karar + proje)
          → Sprint 5 (dashboard + bildirim)

Sprint 2.1 (dönemler) → Sprint 2.2 (başvuru formu)
Sprint 3.1 (jüri atama) → Sprint 3.2 (split view)
Sprint 4.1 (karar) → Sprint 4.2 (proje yönetimi)
```

---

## 11. Ortam Değişkenleri

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:password@postgres:5432/mikro_destek

# NextAuth
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=http://localhost

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=
MINIO_USE_SSL=false

# Circle
CIRCLE_API_KEY=
CIRCLE_COMMUNITY_ID=

# E-posta
RESEND_API_KEY=
EMAIL_FROM=noreply@mikrodestekfonu.com

# App
NEXT_PUBLIC_APP_URL=http://localhost
```
