import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserManageClient } from "./UserManageClient"

export const metadata = { title: "Kullanıcı Yönetimi — Mikro Destek Fonu" }

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          applications:    true,
          juryAssignments: true,
        },
      },
    },
  })

  const serialized = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="pb-5 border-b border-black/[0.06]">
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#1c1c1c] leading-none">
          Kullanıcılar
        </h1>
        <p className="text-[13px] text-[#6e6e73] mt-2">
          {users.length} kullanıcı
        </p>
      </div>

      <UserManageClient
        users={serialized}
        currentUserId={session.user.id}
      />
    </div>
  )
}
