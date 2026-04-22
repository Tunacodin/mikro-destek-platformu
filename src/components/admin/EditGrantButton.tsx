"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PencilLine } from "lucide-react"

export function EditGrantButton({
  applicationId,
  editGranted,
}: {
  applicationId: string
  editGranted: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/admin/applications/${applicationId}/edit-grant`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ granted: !editGranted }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        editGranted
          ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          : "bg-white border-black/[0.07] text-[#1c1c1c] hover:bg-[#f4f4f4]"
      }`}
    >
      <PencilLine className="w-4 h-4" />
      {loading
        ? "Kaydediliyor…"
        : editGranted
        ? "Başvuru Düzenleme Yetkisini Geri Al"
        : "Kullanıcıya Başvuru Düzenleme Yetkisi Ver"}
    </button>
  )
}
