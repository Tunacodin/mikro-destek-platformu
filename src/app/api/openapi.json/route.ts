import { NextResponse } from "next/server"

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Mikro Destek Fonu API",
    version: "0.1.0",
    description:
      "Divizyon inovasyon ekosistemi mikro destek programı yönetim platformu API'si.\n\n" +
      "**Roller:** `ADMIN` · `APPLICANT` · `JURY`\n\n" +
      "Tüm korumalı endpoint'ler NextAuth oturumu (session cookie) gerektirir.",
  },
  tags: [
    { name: "Auth", description: "Kayıt, giriş ve magic link işlemleri" },
    { name: "Applications", description: "Başvuru oluşturma ve yönetimi" },
    { name: "Admin › Periods", description: "Başvuru dönemlerini yönetme (ADMIN)" },
    { name: "Admin › Applications", description: "Başvuru durum geçişleri (ADMIN)" },
    { name: "Admin › Jury", description: "Jüri davet ve atama (ADMIN)" },
    { name: "Jury", description: "Değerlendirme ve dosya notları (JURY)" },
    { name: "Files", description: "Dosya yükleme ve indirme" },
  ],
  paths: {
    // ─── AUTH ───────────────────────────────────────────────────────────────
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Kullanıcı kaydı",
        description:
          "Yeni APPLICANT hesabı oluşturur. E-posta, Circle topluluğunda kayıtlı olmalıdır.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", minLength: 2, example: "Ahmet Yılmaz" },
                  email: {
                    type: "string",
                    format: "email",
                    example: "ahmet@example.com",
                  },
                  password: { type: "string", minLength: 8, example: "gizli1234" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Kayıt başarılı",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
                example: { message: "Kayıt başarılı. Giriş yapabilirsiniz." },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": {
            description: "Circle üyesi değil",
            content: {
              "application/json": {
                example: {
                  error:
                    "Bu e-posta adresi Circle topluluğumuzda kayıtlı değil.",
                },
              },
            },
          },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    "/api/auth/magic-link/validate": {
      post: {
        tags: ["Auth"],
        summary: "Magic link token doğrulama",
        description:
          "Tek kullanımlık jüri davet token'ını doğrular. Geçerliyse JURY kullanıcısı oluşturulur veya güncellenir.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: {
                    type: "string",
                    example: "550e8400-e29b-41d4-a716-446655440000",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token geçerli, kullanıcı bilgisi döner",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string" },
                    userId: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { description: "Token bulunamadı" },
          "410": { description: "Token kullanılmış veya süresi dolmuş" },
        },
      },
    },

    // ─── APPLICATIONS ────────────────────────────────────────────────────────
    "/api/applications": {
      get: {
        tags: ["Applications"],
        summary: "Başvuruları listele",
        description:
          "Rol bazlı: APPLICANT → kendi başvuruları, ADMIN → hepsi, JURY → atanan başvurular.",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Başvuru listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Application" },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Applications"],
        summary: "Yeni başvuru oluştur (DRAFT)",
        description:
          "Yalnızca APPLICANT rolü. Dönem ACTIVE olmalı ve bitimine 48 saatten fazla kalmış olmalı.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["periodId", "title", "description"],
                properties: {
                  periodId: { type: "string", example: "clxyz..." },
                  title: { type: "string", minLength: 1, maxLength: 30, example: "AI Destekli Tarım Projesi" },
                  description: {
                    type: "string",
                    minLength: 50,
                    example: "Bu proje yapay zeka kullanarak...",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Başvuru oluşturuldu (DRAFT)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Application" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/applications/{id}/submit": {
      post: {
        tags: ["Applications"],
        summary: "Başvuruyu gönder (DRAFT → SUBMITTED)",
        description:
          "Yalnızca APPLICANT. En az 1 dosya olmalı, dönem ACTIVE ve bitimine 48 saatten fazla kalmış olmalı.",
        security: [{ sessionCookie: [] }],
        parameters: [
          { $ref: "#/components/parameters/IdParam" },
        ],
        responses: {
          "200": {
            description: "Başvuru gönderildi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Application" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ─── ADMIN › PERIODS ─────────────────────────────────────────────────────
    "/api/admin/periods": {
      get: {
        tags: ["Admin › Periods"],
        summary: "Dönemleri listele",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Dönem listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ApplicationPeriod" },
                },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Admin › Periods"],
        summary: "Yeni dönem oluştur",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "startDate", "endDate"],
                properties: {
                  title: { type: "string", example: "2025 Q2 Mikro Destek Dönemi" },
                  startDate: {
                    type: "string",
                    format: "date-time",
                    example: "2025-04-01T09:00:00.000Z",
                  },
                  endDate: {
                    type: "string",
                    format: "date-time",
                    example: "2025-04-30T23:59:59.000Z",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Dönem oluşturuldu (DRAFT)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApplicationPeriod" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/admin/periods/{id}/status": {
      patch: {
        tags: ["Admin › Periods"],
        summary: "Dönem durumunu güncelle",
        description:
          "Geçerli geçişler: `DRAFT → ACTIVE`, `ACTIVE → CLOSED`. CLOSED geri alınamaz.",
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["DRAFT", "ACTIVE", "CLOSED"],
                  },
                },
              },
              example: { status: "ACTIVE" },
            },
          },
        },
        responses: {
          "200": {
            description: "Güncellendi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApplicationPeriod" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ─── ADMIN › APPLICATIONS ────────────────────────────────────────────────
    "/api/admin/applications/{id}/status": {
      patch: {
        tags: ["Admin › Applications"],
        summary: "Başvuru durumunu güncelle",
        description:
          "Geçerli geçişler: `SUBMITTED → IN_REVIEW`, `IN_REVIEW → EVALUATED`, `EVALUATED → SUPPORTED | REJECTED`.",
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["IN_REVIEW", "EVALUATED", "SUPPORTED", "REJECTED"],
                  },
                },
              },
              example: { status: "IN_REVIEW" },
            },
          },
        },
        responses: {
          "200": {
            description: "Durum güncellendi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Application" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ─── ADMIN › JURY ────────────────────────────────────────────────────────
    "/api/admin/jury/invite": {
      post: {
        tags: ["Admin › Jury"],
        summary: "Jüri üyesi davet et",
        description:
          "Belirtilen e-postaya magic link (7 gün geçerli) içeren davet e-postası gönderir. " +
          "Geliştirme ortamında e-posta gönderilmez, link response'da döner (`devLink`).",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "jury@example.com",
                  },
                  name: { type: "string", example: "Dr. Fatma Kaya" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Davet gönderildi",
            content: {
              "application/json": {
                example: {
                  message: "Davet gönderildi.",
                  devLink: "http://localhost:3000/auth/magic-link?token=...",
                },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    "/api/admin/jury/assign": {
      post: {
        tags: ["Admin › Jury"],
        summary: "Jüriyi başvuruya ata",
        description: "Başvuru `IN_REVIEW` durumunda olmalı. Kullanıcı `JURY` rolünde olmalı.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["applicationId", "juryId"],
                properties: {
                  applicationId: { type: "string", example: "clxyz..." },
                  juryId: { type: "string", example: "clxyz..." },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Atama oluşturuldu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/JuryAssignment" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
      delete: {
        tags: ["Admin › Jury"],
        summary: "Jüri atamasını kaldır",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["applicationId", "juryId"],
                properties: {
                  applicationId: { type: "string" },
                  juryId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Atama kaldırıldı",
            content: {
              "application/json": {
                example: { message: "Atama kaldırıldı." },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    // ─── JURY ────────────────────────────────────────────────────────────────
    "/api/jury/evaluations": {
      get: {
        tags: ["Jury"],
        summary: "Değerlendirmeyi getir",
        description: "Jürinin belirli bir başvuru için yaptığı değerlendirmeyi getirir.",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "applicationId",
            in: "query",
            required: true,
            schema: { type: "string" },
            example: "clxyz...",
          },
        ],
        responses: {
          "200": {
            description: "Değerlendirme (henüz yapılmadıysa null)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Evaluation" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Jury"],
        summary: "Değerlendirme gönder / güncelle",
        description:
          "Kriter bazlı puan (1–5) ve zorunlu metin gerekçe. Daha önce değerlendirme yapıldıysa günceller. " +
          "İlk değerlendirmede başvuru `EVALUATED` durumuna geçer.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["applicationId", "scores"],
                properties: {
                  applicationId: { type: "string" },
                  comment: { type: "string", description: "Genel yorum (opsiyonel)" },
                  scores: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      required: ["criteria", "score"],
                      properties: {
                        criteria: { type: "string", example: "Yenilikçilik" },
                        score: { type: "integer", minimum: 1, maximum: 5, example: 4 },
                        justification: {
                          type: "string",
                          example: "Proje mevcut çözümlere kıyasla özgün bir yaklaşım sunuyor.",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Değerlendirme güncellendi" },
          "201": { description: "Değerlendirme oluşturuldu" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/api/jury/file-notes": {
      get: {
        tags: ["Jury"],
        summary: "Dosya notlarını getir",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "fileId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Not listesi",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/FileNote" },
                },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      post: {
        tags: ["Jury"],
        summary: "Dosyaya not ekle",
        description: "Jürinin belirli bir başvuru dosyasına not eklemesi (FileNote tablosu).",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fileId", "note"],
                properties: {
                  fileId: { type: "string" },
                  note: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Not oluşturuldu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FileNote" },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ─── FILES ───────────────────────────────────────────────────────────────
    "/api/upload": {
      post: {
        tags: ["Files"],
        summary: "Dosya yükle (MinIO)",
        description:
          "Multipart form-data ile dosya yükler. " +
          "İzin verilen tipler: PDF, PNG, JPEG, Word, Excel. Maksimum boyut: 10 MB.",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                  applicationId: {
                    type: "string",
                    description: "Dosyanın bağlanacağı başvuru ID'si (opsiyonel)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Yüklendi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FileResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    "/api/files/{id}": {
      get: {
        tags: ["Files"],
        summary: "Dosyayı indir (presigned URL ile)",
        description:
          "MinIO'dan presigned URL üretir ve yönlendirir (302 redirect). " +
          "APPLICANT yalnızca kendi başvurusunun dosyalarına, JURY yalnızca atandığı başvuruların dosyalarına erişir.",
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          "302": { description: "MinIO presigned URL'ye yönlendir" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description: "NextAuth session cookie (otomatik tarayıcıda yönetilir)",
      },
    },

    parameters: {
      IdParam: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Kayıt ID'si (cuid)",
      },
    },

    responses: {
      BadRequest: {
        description: "Geçersiz istek",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Unauthorized: {
        description: "Oturum açılmamış",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: "Oturum açılmamış." },
          },
        },
      },
      Forbidden: {
        description: "Yetkisiz erişim",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: "Yetkisiz." },
          },
        },
      },
      NotFound: {
        description: "Kayıt bulunamadı",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: "Bulunamadı." },
          },
        },
      },
      Conflict: {
        description: "Çakışma — kayıt zaten mevcut",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },

    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },

      ApplicationPeriod: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["DRAFT", "ACTIVE", "CLOSED"] },
          createdAt: { type: "string", format: "date-time" },
          _count: {
            type: "object",
            properties: { applications: { type: "integer" } },
          },
        },
      },

      Application: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: [
              "DRAFT",
              "SUBMITTED",
              "IN_REVIEW",
              "EVALUATED",
              "SUPPORTED",
              "REJECTED",
            ],
          },
          userId: { type: "string" },
          periodId: { type: "string" },
          submittedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          period: {
            type: "object",
            properties: {
              title: { type: "string" },
              endDate: { type: "string", format: "date-time" },
            },
          },
          _count: {
            type: "object",
            properties: { files: { type: "integer" } },
          },
        },
      },

      JuryAssignment: {
        type: "object",
        properties: {
          id: { type: "string" },
          juryId: { type: "string" },
          applicationId: { type: "string" },
          assignedAt: { type: "string", format: "date-time" },
          jury: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },

      Evaluation: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "string" },
          juryId: { type: "string" },
          applicationId: { type: "string" },
          comment: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          scores: {
            type: "array",
            items: { $ref: "#/components/schemas/EvaluationScore" },
          },
        },
      },

      EvaluationScore: {
        type: "object",
        properties: {
          id: { type: "string" },
          criteria: { type: "string" },
          score: { type: "integer", minimum: 1, maximum: 5 },
          justification: { type: "string" },
        },
      },

      FileNote: {
        type: "object",
        properties: {
          id: { type: "string" },
          fileId: { type: "string" },
          userId: { type: "string" },
          note: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      FileResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          size: { type: "integer" },
          mimeType: { type: "string" },
          url: { type: "string" },
        },
      },
    },
  },
}

export function GET() {
  return NextResponse.json(spec)
}
