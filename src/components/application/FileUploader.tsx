"use client"

import { useState, useRef } from "react"
import { Upload, X, FileText, Loader2, ExternalLink, Link2, Plus } from "lucide-react"

type UploadedFile = { id: string; name: string; size: number; mimeType: string; type?: string; url?: string }

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

  // Link form state
  const [linkUrl, setLinkUrl] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const [addingLink, setAddingLink] = useState(false)

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
          setError(data.error ?? `${file.name} yuklenemedi.`)
          continue
        }

        newFiles.push({ id: data.id, name: data.name, size: data.size, mimeType: data.mimeType, type: "FILE" })
      } catch {
        setError(`${file.name} yuklenirken hata olustu.`)
      }
    }

    setFiles(newFiles)
    onFilesChange(newFiles)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleAddLink() {
    if (!linkUrl.trim() || !linkTitle.trim()) return
    setError("")
    setAddingLink(true)

    try {
      const res = await fetch("/api/files/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: linkUrl.trim(),
          name: linkTitle.trim(),
          applicationId,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Link eklenemedi.")
        setAddingLink(false)
        return
      }

      const newFiles = [...files, { id: data.id, name: data.name, size: 0, mimeType: data.mimeType, type: "LINK", url: data.url }]
      setFiles(newFiles)
      onFilesChange(newFiles)
      setLinkUrl("")
      setLinkTitle("")
    } catch {
      setError("Link eklenirken hata olustu.")
    }

    setAddingLink(false)
  }

  function removeFile(id: string) {
    const updated = files.filter((f) => f.id !== id)
    setFiles(updated)
    onFilesChange(updated)
  }

  function formatSize(bytes: number) {
    if (bytes === 0) return ""
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
        className="rounded-2xl border-2 border-dashed border-[#e0e0e0] bg-[#f5f5f5] p-6 sm:p-8 text-center cursor-pointer hover:border-[#fab758]/50 hover:bg-[#f4f4f4] transition-colors"
      >
        {uploading ? (
          <Loader2 className="w-7 h-7 animate-spin text-[#aeaeb2] mx-auto" />
        ) : (
          <Upload className="w-7 h-7 text-[#c7c7cc] mx-auto" />
        )}
        <p className="text-[13px] font-semibold text-[#6e6e73] mt-2.5">
          {uploading ? "Yukleniyor..." : "Tiklayın veya surukleyin"}
        </p>
        <p className="text-[11px] text-[#aeaeb2] mt-0.5">PDF, Word, Excel - maks. 10 MB</p>
        <input
          ref={inputRef} type="file" multiple className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* External link section */}
      <div className="rounded-2xl border border-[#e8e8e8] bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#aeaeb2]" />
          <p className="text-[13px] font-semibold text-[#1c1c1c]">Harici Link Ekle</p>
        </div>
        <p className="text-[11px] text-[#aeaeb2]">Google Drive, Dropbox veya diger platformlardan link ekleyebilirsiniz.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Link basligi"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-[#f5f5f5] border-0 rounded-xl text-[13px] text-[#1c1c1c] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-1 focus:ring-[#fab758]/40 focus:bg-white transition-all"
          />
          <input
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-[2] px-3 py-2.5 bg-[#f5f5f5] border-0 rounded-xl text-[13px] text-[#1c1c1c] placeholder:text-[#aeaeb2] focus:outline-none focus:ring-1 focus:ring-[#fab758]/40 focus:bg-white transition-all"
          />
          <button
            onClick={handleAddLink}
            disabled={!linkUrl.trim() || !linkTitle.trim() || addingLink}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl shadow-sm hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
          >
            {addingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Ekle
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 rounded-xl px-4 py-2.5">
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      )}

      {/* Yuklenen dosyalar ve linkler */}
      {files.length > 0 && (
        <ul className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden divide-y divide-black/[0.04]">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] border border-black/[0.05] flex items-center justify-center shrink-0">
                {f.type === "LINK" ? (
                  <ExternalLink className="w-4 h-4 text-[#6e6e73]" />
                ) : (
                  <FileText className="w-4 h-4 text-[#aeaeb2]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {f.type === "LINK" ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-medium text-[#1c1c1c] truncate block hover:text-[#fab758] transition-colors"
                  >
                    {f.name}
                  </a>
                ) : (
                  <p className="text-[13px] font-medium text-[#1c1c1c] truncate">{f.name}</p>
                )}
                <p className="text-[11px] text-[#aeaeb2]">
                  {f.type === "LINK" ? "Harici link" : formatSize(f.size)}
                </p>
              </div>
              <button
                onClick={() => removeFile(f.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:bg-red-100 hover:text-red-400 transition-colors cursor-pointer"
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
