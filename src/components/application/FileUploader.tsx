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
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
        ) : (
          <Upload className="w-8 h-8 text-slate-300 mx-auto" />
        )}
        <p className="text-sm font-medium mt-2">
          {uploading ? "Yükleniyor…" : "Tıklayın veya dosyayı buraya sürükleyin"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel · maks. 10 MB</p>
        <input
          ref={inputRef} type="file" multiple className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
      )}

      {/* Yüklenen dosyalar */}
      {files.length > 0 && (
        <ul className="divide-y border rounded-lg overflow-hidden">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3 bg-white">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(f.size)}</p>
              </div>
              <button
                onClick={() => removeFile(f.id)}
                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
