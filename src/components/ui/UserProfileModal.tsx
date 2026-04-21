"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, User, Lock, Check, Eye, EyeOff } from "lucide-react"

const inputCls =
  "w-full px-3.5 py-2.5 bg-[#f5f5f5] border border-transparent rounded-xl text-[14px] text-[#1c1c1c] placeholder:text-[#c7c7cc] focus:outline-none focus:ring-2 focus:ring-[#fab758]/50 focus:bg-white focus:border-[#fab758]/30 transition-all"

type Tab = "profile" | "password"

export function UserProfileModal({
  isOpen,
  onClose,
  userName,
  userEmail,
}: {
  isOpen: boolean
  onClose: () => void
  userName: string
  userEmail: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("profile")

  // Profil
  const [name, setName] = useState(userName)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Şifre
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(userName)
      setTab("profile")
      setProfileError("")
      setProfileSuccess(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordError("")
      setPasswordSuccess(false)
    }
  }, [isOpen, userName])

  async function handleProfileSave() {
    setProfileError("")
    setProfileSuccess(false)
    if (!name.trim() || name.trim().length < 2) {
      setProfileError("Ad soyad en az 2 karakter olmalı.")
      return
    }
    setProfileSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) setProfileError(data.error ?? "Kaydedilemedi.")
      else { setProfileSuccess(true); router.refresh() }
    } catch {
      setProfileError("Beklenmedik hata.")
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSave() {
    setPasswordError("")
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError("Yeni şifreler eşleşmiyor.")
      return
    }
    setPasswordSaving(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) setPasswordError(data.error ?? "Kaydedilemedi.")
      else {
        setPasswordSuccess(true)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      setPasswordError("Beklenmedik hata.")
    } finally {
      setPasswordSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col mx-4 max-h-[90vh]">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <p className="text-[15px] font-semibold text-[#1c1c1c]">Hesap Ayarları</p>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#aeaeb2] hover:text-[#1c1c1c] hover:bg-[#f0f0f0] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[#e8e8e8]">
          {([
            { id: "profile" as Tab, label: "Profil", icon: User },
            { id: "password" as Tab, label: "Şifre", icon: Lock },
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                tab === id
                  ? "border-[#fab758] text-[#1c1c1c]"
                  : "border-transparent text-[#6e6e73] hover:text-[#1c1c1c]"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {tab === "profile" && (
            <>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Ad Soyad</label>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setProfileError(""); setProfileSuccess(false) }}
                  placeholder="Ad Soyad"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">E-posta</label>
                <input value={userEmail} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
              </div>
              {profileError && (
                <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{profileError}</p>
              )}
              {profileSuccess && (
                <div className="flex items-center gap-2 text-[12px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                  <Check className="w-3.5 h-3.5" /> Ad soyad güncellendi.
                </div>
              )}
            </>
          )}

          {tab === "password" && (
            <>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Mevcut Şifre</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false) }}
                    placeholder="••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aeaeb2] hover:text-[#6e6e73] transition-colors cursor-pointer">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Yeni Şifre</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false) }}
                    placeholder="En az 6 karakter"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aeaeb2] hover:text-[#6e6e73] transition-colors cursor-pointer">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73] mb-1.5">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false) }}
                  placeholder="••••••"
                  className={inputCls}
                />
              </div>
              {passwordError && (
                <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{passwordError}</p>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 text-[12px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                  <Check className="w-3.5 h-3.5" /> Şifre güncellendi.
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-[#e8e8e8]">
          <button onClick={onClose}
            className="px-4 py-2.5 text-[13px] font-medium text-[#6e6e73] rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer">
            Kapat
          </button>
          {tab === "profile" && (
            <button onClick={handleProfileSave} disabled={profileSaving}
              className="px-5 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              {profileSaving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          )}
          {tab === "password" && (
            <button
              onClick={handlePasswordSave}
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              className="px-5 py-2.5 bg-[#1c1c1c] text-white text-[13px] font-semibold rounded-xl hover:bg-[#383838] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              {passwordSaving ? "Kaydediliyor…" : "Şifreyi Güncelle"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
