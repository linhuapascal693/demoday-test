'use client'

import { useEffect, useRef } from 'react'

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let stars: Star[] = []

    class Star {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      twinkleSpeed: number
      twinklePhase: number

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth
        this.y = Math.random() * canvasHeight
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.2
        this.speedY = (Math.random() - 0.5) * 0.2
        this.opacity = Math.random() * 0.8 + 0.2
        this.twinkleSpeed = Math.random() * 0.02 + 0.01
        this.twinklePhase = Math.random() * Math.PI * 2
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.speedX
        this.y += this.speedY
        this.twinklePhase += this.twinkleSpeed

        // Wrap around screen
        if (this.x < 0) this.x = canvasWidth
        if (this.x > canvasWidth) this.x = 0
        if (this.y < 0) this.y = canvasHeight
        if (this.y > canvasHeight) this.y = 0
      }

      draw(ctx: CanvasRenderingContext2D) {
        const twinkleOpacity = this.opacity * (0.5 + 0.5 * Math.sin(this.twinklePhase))
        
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`
        ctx.fill()

        // Add glow effect for larger stars
        if (this.size > 1.5) {
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity * 0.3})`
          ctx.fill()
        }
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Reinitialize stars
      stars = []
      const starCount = Math.floor((canvas.width * canvas.height) / 8000)
      for (let i = 0; i < starCount; i++) {
        stars.push(new Star(canvas.width, canvas.height))
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#0a0a0f')
      gradient.addColorStop(0.5, '#1a1a2e')
      gradient.addColorStop(1, '#16213e')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw nebula effect
      const nebulaGradient = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.3, 0,
        canvas.width * 0.3, canvas.height * 0.3, canvas.width * 0.5
      )
      nebulaGradient.addColorStop(0, 'rgba(45, 27, 78, 0.3)')
      nebulaGradient.addColorStop(1, 'rgba(45, 27, 78, 0)')
      ctx.fillStyle = nebulaGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw stars
      stars.forEach(star => {
        star.update(canvas.width, canvas.height)
        star.draw(ctx)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  )
}
