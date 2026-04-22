"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Upload, X, FileSpreadsheet, CheckCircle2,
  AlertCircle, ChevronDown, Info, Copy, Check,
} from "lucide-react"

type CreatedUser = { email: string; name: string | null; password: string }

type ImportResult = {
  created:    number
  failed:     number
  noTeamName: number
  users:      CreatedUser[]
  errors:     { row: number; message: string }[]
}

type Status = "idle" | "uploading" | "done" | "error"
type Period = { id: string; title: string }

export function ExcelImportButton({ periods }: { periods: Period[] }) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [open,     setOpen]     = useState(false)
  const [file,     setFile]     = useState<File | null>(null)
  const [periodId, setPeriodId] = useState("")
  const [status,   setStatus]   = useState<Status>("idle")
  const [result,   setResult]   = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [copied,   setCopied]   = useState(false)

  function openModal() {
    setFile(null); setPeriodId(""); setStatus("idle")
    setResult(null); setErrorMsg(""); setCopied(false)
    setOpen(true)
  }

  function closeModal() {
    if (status === "uploading") return
    setOpen(false)
    if (result && result.created > 0) router.refresh()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setStatus("idle"); setResult(null); setErrorMsg("")
    e.target.value = ""
  }

  async function handleImport() {
    if (!file || status === "uploading") return
    setStatus("uploading"); setResult(null); setErrorMsg("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (periodId) fd.append("periodId", periodId)
      const res  = await fetch("/api/admin/applications/import", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error ?? "Sunucu hatası"); setStatus("error"); return }
      setResult(data as ImportResult)
      setStatus("done")
    } catch {
      setErrorMsg("Ağ hatası, lütfen tekrar deneyin.")
      setStatus("error")
    }
  }

  function copyAll() {
    if (!result?.users.length) return
    const text = result.users
      .map((u) => `${u.name ?? u.email}\t${u.email}\t${u.password}`)
      .join("\n")
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium bg-white border border-black/[0.08] rounded-xl text-[#1c1c1c] hover:border-black/[0.15] hover:bg-[#f9f9f9] transition-all cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-[#34c759]" />
        Excelden Aktar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.06] w-full max-w-lg">

            {/* Başlık */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f0faf3] flex items-center justify-center shrink-0">
                  <FileSpreadsheet style={{ width: 18, height: 18 }} className="text-[#34c759]" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#1c1c1c]">Form CSV'sinden Aktar</p>
                  <p className="text-[11px] text-[#aeaeb2] mt-0.5">Başvuru formu çıktısı (.csv)</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={status === "uploading"}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f5f5f5] transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">

              {/* Dönem seçimi */}
              {status !== "done" && (
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-[#6e6e73]">Dönem</label>
                  <div className="relative">
                    <select
                      value={periodId}
                      onChange={(e) => setPeriodId(e.target.value)}
                      disabled={status === "uploading"}
                      className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-[13px] bg-white border border-black/[0.08] rounded-xl text-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#34c759]/30 focus:border-[#34c759]/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Dönemsiz bırak</option>
                      {periods.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aeaeb2] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Dosya seç */}
              {status !== "done" && (
                <div
                  onClick={() => inputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    file
                      ? "border-[#34c759]/40 bg-[#f0faf3]"
                      : "border-black/[0.1] bg-[#fafafa] hover:border-black/[0.2] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
                  <Upload className={`w-5 h-5 ${file ? "text-[#34c759]" : "text-[#aeaeb2]"}`} />
                  {file ? (
                    <>
                      <p className="text-[13px] font-semibold text-[#1c1c1c]">{file.name}</p>
                      <p className="text-[11px] text-[#aeaeb2]">{(file.size / 1024).toFixed(1)} KB · Değiştirmek için tıkla</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] font-medium text-[#6e6e73]">CSV dosyası seç</p>
                      <p className="text-[11px] text-[#aeaeb2]">.csv · Tıkla veya sürükle</p>
                    </>
                  )}
                </div>
              )}

              {/* Hata */}
              {status === "error" && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-red-600">{errorMsg}</p>
                </div>
              )}

              {/* Sonuç */}
              {status === "done" && result && (
                <div className="space-y-3">

                  {/* Özet */}
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f0faf3] border border-[#34c759]/20 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0" />
                    <p className="text-[13px] font-semibold text-[#1c1c1c]">
                      {result.created} başvuru aktarıldı
                      {result.failed > 0 && (
                        <span className="font-normal text-[#6e6e73]">, {result.failed} atlandı</span>
                      )}
                    </p>
                  </div>

                  {/* Kullanıcı şifreleri */}
                  {result.users.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-semibold text-[#1c1c1c]">
                          Oluşturulan kullanıcı şifreleri
                        </p>
                        <button
                          onClick={copyAll}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#6e6e73] border border-black/[0.08] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                        >
                          {copied
                            ? <><Check className="w-3 h-3 text-[#34c759]" />Kopyalandı</>
                            : <><Copy className="w-3 h-3" />Tümünü Kopyala</>
                          }
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-black/[0.06] divide-y divide-black/[0.04]">
                        {result.users.map((u, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 bg-white hover:bg-[#fafafa]">
                            <div className="min-w-0 flex-1">
                              {u.name && (
                                <p className="text-[12px] font-medium text-[#1c1c1c] truncate">{u.name}</p>
                              )}
                              <p className="text-[11px] text-[#6e6e73] truncate">{u.email}</p>
                            </div>
                            <code className="ml-3 shrink-0 text-[12px] font-mono font-semibold text-[#1c1c1c] bg-[#f5f5f5] px-2 py-0.5 rounded-md">
                              {u.password}
                            </code>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#aeaeb2]">
                        Bu şifreler bir daha gösterilmeyecek. Kopyalayıp kullanıcılara iletin.
                      </p>
                    </div>
                  )}

                  {/* Takım adı uyarısı */}
                  {result.noTeamName > 0 && (
                    <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-xl">
                      <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[12px] font-semibold text-amber-800">
                          {result.noTeamName} başvuruda takım adı boş
                        </p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Her başvuruyu açarak Takım Adı alanını doldurabilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Satır hataları */}
                  {result.errors.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {result.errors.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 bg-red-50 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-red-600">
                            <span className="font-semibold">Satır {e.row}:</span> {e.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-2 px-5 pb-5">
              {status === "done" ? (
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-[#1c1c1c] rounded-xl hover:bg-[#383838] transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              ) : (
                <>
                  <button
                    onClick={closeModal}
                    disabled={status === "uploading"}
                    className="flex-1 py-2.5 text-[13px] font-medium text-[#6e6e73] border border-black/[0.08] rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!file || status === "uploading"}
                    className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-[#1c1c1c] rounded-xl hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {status === "uploading" ? "Aktarılıyor…" : "Aktar"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
