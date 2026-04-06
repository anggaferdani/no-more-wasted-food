"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Banner } from "@/db/schema"

interface Props {
  banners: Banner[]
}

export default function BannerSlider({ banners }: Props) {
  const [active, setActive] = useState(0)

  const next = useCallback(() => {
    setActive((i) => (i === banners.length - 1 ? 0 : i + 1))
  }, [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [next, banners.length])

  if (!banners.length) return null

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <div className="aspect-video w-full">
        {banners[active].linkUrl ? (
          <a href={banners[active].linkUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={banners[active].imageUrl}
              alt={banners[active].name}
              className="h-full w-full object-cover"
            />
          </a>
        ) : (
          <img
            src={banners[active].imageUrl}
            alt={banners[active].name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setActive((i) => (i === 0 ? banners.length - 1 : i - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-neutral-700"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-neutral-700"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  active === i ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}