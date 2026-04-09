"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, FileText, Loader2 } from "lucide-react"

type UploadedFile = { id: string; name: string; size: number }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ProjectFileUpload({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [staged, setStaged] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0 || uploading) return
    setError("")
    setUploading(true)

    const newFiles: UploadedFile[] = [...staged]

    for (const file of Array.from(selected)) {
      const form = new FormData()
      form.append("file", file)
      form.append("projectId", projectId)

      try {
        const res = await fetch("/api/upload", { method: "POST", body: form })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? `${file.name} yüklenemedi.`); continue }
        newFiles.push({ id: data.id, name: data.name, size: data.size })
      } catch {
        setError(`${file.name} yüklenirken hata oluştu.`)
      }
    }

    setStaged(newFiles)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
    router.refresh()
  }

  return (
    <div className="space-y-2.5">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className={`rounded-xl border-2 border-dashed border-[#e0e0e0] bg-[#f9f9f9] p-5 text-center transition-colors ${uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[#fab758]/50 hover:bg-[#fafafa]"}`}
      >
        {uploading
          ? <Loader2 className="w-5 h-5 animate-spin text-[#aeaeb2] mx-auto" />
          : <Upload className="w-5 h-5 text-[#c7c7cc] mx-auto" />}
        <p className="text-[12px] font-semibold text-[#6e6e73] mt-2">
          {uploading ? "Yükleniyor…" : "Tıklayın veya dosya sürükleyin"}
        </p>
        <p className="text-[11px] text-[#aeaeb2] mt-0.5">PDF, Word, Excel, Görsel · maks. 10 MB</p>
        <input
          ref={inputRef} type="file" multiple className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}

      {staged.length > 0 && (
        <ul className="space-y-1.5">
          {staged.map((f) => (
            <li key={f.id} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-[12px] font-medium text-emerald-700 truncate flex-1">{f.name}</span>
              <span className="text-[11px] text-emerald-500 shrink-0">{formatSize(f.size)}</span>
              <button
                onClick={() => setStaged((p) => p.filter((x) => x.id !== f.id))}
                className="text-emerald-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
