import { useEffect, useRef } from 'react'

type SparklineProps = {
    data: number[]
    width?: number
    height?: number
    color?: string
    className?: string
}

export default function Sparkline({
    data,
    width = 60,
    height = 24,
    color = 'rgb(99, 102, 241)',
    className = ''
}: SparklineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasRef.current || data.length < 2) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        canvas.width = width
        canvas.height = height

        // Clear canvas
        ctx.clearRect(0, 0, width, height)

        // Find min and max
        const min = Math.min(...data)
        const max = Math.max(...data)
        const range = max - min || 1

        // Calculate points
        const points = data.map((value, index) => ({
            x: (index / (data.length - 1)) * width,
            y: height - ((value - min) / range) * height
        }))

        // Draw line
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
        }

        ctx.stroke()

    }, [data, width, height, color])

    if (data.length < 2) {
        return <div className={className} style={{ width, height }} />
    }

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ width, height }}
        />
    )
}
