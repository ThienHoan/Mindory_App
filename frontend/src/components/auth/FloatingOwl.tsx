'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function FloatingOwl() {
  const [owlPos, setOwlPos] = useState({ x: 16, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const owlSizeRef = useRef(110)

  useEffect(() => {
    const initialY = Math.max(16, window.innerHeight - 170)
    setOwlPos({ x: 16, y: initialY })
  }, [])

  useEffect(() => {
    if (!dragging) return

    const onMove = (event: PointerEvent) => {
      const size = owlSizeRef.current
      const x = Math.min(Math.max(8, event.clientX - dragOffsetRef.current.x), window.innerWidth - size - 8)
      const y = Math.min(Math.max(8, event.clientY - dragOffsetRef.current.y), window.innerHeight - size - 8)
      setOwlPos({ x, y })
    }

    const onUp = () => setDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging])

  return (
    <div
      className={`fixed z-50 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ left: owlPos.x, top: owlPos.y, userSelect: 'none', touchAction: 'none' }}
      onPointerDown={(event) => {
        const target = event.currentTarget.getBoundingClientRect()
        dragOffsetRef.current = {
          x: event.clientX - target.left,
          y: event.clientY - target.top,
        }
        owlSizeRef.current = target.width
        setDragging(true)
      }}
    >
      <div className="relative h-20 w-20 transition-transform duration-300 md:h-32 md:w-32">
        <Image
          src="https://assets.cuthongminh.com/assets/own-learning.webp"
          alt="Owl Companion"
          fill
          draggable={false}
          sizes="(max-width: 768px) 80px, 128px"
          className="object-contain"
        />
      </div>
    </div>
  )
}
