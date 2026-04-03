"use client"

import { useState, useRef } from "react"
import { Upload, X, FileText, Loader2 } from "lucide-react"

type UploadedFile = { id: string; name: string; size: number; mimeType: string }

export function FileUploader({
  applicationId,
  onFilesChange,
}: {
  applicationId: string
  onFilesChange: (files: UploadedFile[]) => void
}) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return
    setError("")
    setUploading(true)

    const newFiles: UploadedFile[] = [...files]

    for (const file of Array.from(selected)) {
      const form = new FormData()
      form.append("file", file)
      form.append("applicationId", applicationId)

      try {
        const res = await fetch("/api/upload", { method: "POST", body: form })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? `${file.name} yüklenemedi.`)
          continue
        }

        newFiles.push({ id: data.id, name: data.name, size: data.size, mimeType: data.mimeType })
      } catch {
        setError(`${file.name} yüklenirken hata oluştu.`)
      }
    }

    setFiles(newFiles)
    onFilesChange(newFiles)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  function removeFile(id: string) {
    const updated = files.filter((f) => f.id !== id)
    setFiles(updated)
    onFilesChange(updated)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-2.5">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className="rounded-2xl border-2 border-dashed border-[#e0e0e0] bg-[#f5f5f5] p-8 text-center cursor-pointer hover:border-[#aeaeb2] hover:bg-[#efefef] transition-colors"
      >
        {uploading ? (
          <Loader2 className="w-7 h-7 animate-spin text-[#aeaeb2] mx-auto" />
        ) : (
          <Upload className="w-7 h-7 text-[#c7c7cc] mx-auto" />
        )}
        <p className="text-[13px] font-semibold text-[#6e6e73] mt-2.5">
          {uploading ? "Yükleniyor…" : "Tıklayın veya sürükleyin"}
        </p>
        <p className="text-[11px] text-[#aeaeb2] mt-0.5">PDF, Word, Excel · maks. 10 MB</p>
        <input
          ref={inputRef} type="file" multiple className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="bg-red-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      {/* Yüklenen dosyalar */}
      {files.length > 0 && (
        <ul className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden divide-y divide-black/[0.04]">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] border border-black/[0.05] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-[#aeaeb2]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                <p className="text-[11px] text-[#aeaeb2]">{formatSize(f.size)}</p>
              </div>
              <button
                onClick={() => removeFile(f.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:bg-red-50 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
