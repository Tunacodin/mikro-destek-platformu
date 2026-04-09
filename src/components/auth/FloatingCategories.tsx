"use client"

import { useEffect, useState, useCallback } from "react"

const CATEGORIES = [
  "Yazılım ve Teknik Araç Desteği",
  "Üretim ve Altyapı Desteği",
  "Mentorluk ve Uzmanlık Desteği",
  "Materyal ve Envanter Desteği",
  "Görünürlük ve Ağ Desteği",
  "Akademik Üretim Desteği",
  "Dış Temsil ve Seyahat Desteği",
  "Telif, Hak ve Yayıncılık Desteği",
]

// Logo + alt başlık ekranın merkezinde, dikeyde %38 civarında
const LOGO_X = 50  // vw
const LOGO_Y = 38  // vh

let nextId = 0

interface Particle {
  id: number
  text: string
  x: number        // başlangıç pozisyonu (vw)
  y: number        // başlangıç pozisyonu (vh)
  tx: string       // logo'ya translate (vw)
  ty: string       // logo'ya translate (vh)
  duration: number // saniye
  fontSize: number
  peakOpacity: number
  amber: boolean
}

function createParticle(): Particle {
  const x = 5 + Math.random() * 90   // ekranın %5-%95'i arası
  const y = 5 + Math.random() * 90

  const tx = LOGO_X - x
  const ty = LOGO_Y - y

  return {
    id: nextId++,
    text: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    x,
    y,
    tx: `${tx}vw`,
    ty: `${ty}vh`,
    duration: 3.5 + Math.random() * 2.5,   // 3.5 – 6 sn
    fontSize: 10 + Math.random() * 3,       // 10 – 13 px
    peakOpacity: 0.22 + Math.random() * 0.22, // 0.22 – 0.44
    amber: Math.random() < 0.2,             // %20 amber, %80 gri
  }
}

export function FloatingCategories() {
  const [particles, setParticles] = useState<Particle[]>([])

  const spawn = useCallback(() => {
    const p = createParticle()
    setParticles((prev) => [...prev.slice(-24), p])
    setTimeout(() => {
      setParticles((prev) => prev.filter((q) => q.id !== p.id))
    }, (p.duration + 0.3) * 1000)
  }, [])

  useEffect(() => {
    // İlk yüklemede 7 parçacık art arda çıkar
    for (let i = 0; i < 7; i++) {
      setTimeout(spawn, i * 250)
    }
    const interval = setInterval(spawn, 900)
    return () => clearInterval(interval)
  }, [spawn])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute whitespace-nowrap font-medium select-none"
          style={{
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            fontSize: p.fontSize,
            color: p.amber ? "#fab758" : "#6e6e73",
            "--tx": p.tx,
            "--ty": p.ty,
            "--peak-opacity": p.peakOpacity,
            animation: `floatToLogo ${p.duration}s ease-in forwards`,
          } as React.CSSProperties}
        >
          {p.text}
        </span>
      ))}
    </div>
  )
}
