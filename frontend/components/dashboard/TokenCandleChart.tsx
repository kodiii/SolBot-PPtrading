'use client'

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'

interface TokenCandleChartProps {
  tokenName: string
  data: {
    time: string
    open: number
    high: number
    low: number
    close: number
  }[]
  isLoading?: boolean
}

export function TokenCandleChart({ 
  tokenName, 
  data, 
  isLoading
}: TokenCandleChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Function to draw the chart
  const drawChart = () => {
    if (!canvasRef.current || !data.length) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Chart margins
    const margin = { top: 20, right: 60, bottom: 30, left: 50 }
    const chartWidth = canvas.width - margin.left - margin.right
    const chartHeight = canvas.height - margin.top - margin.bottom
    
    // Calculate min and max values for scaling
    const minPrice = Math.min(...data.map(d => d.low))
    const maxPrice = Math.max(...data.map(d => d.high))
    const priceRange = maxPrice - minPrice
    const padding = priceRange * 0.1 // 10% padding
    const yMin = minPrice - padding
    const yMax = maxPrice + padding

    // Calculate bar width
    const barWidth = chartWidth / data.length
    const barPadding = barWidth * 0.2
    
    // Draw grid
    ctx.strokeStyle = 'rgba(42, 46, 57, 0.3)'
    ctx.lineWidth = 0.5
    
    // Horizontal grid lines (5 lines)
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (chartHeight / 5) * i
      const price = yMax - (i / 5) * (yMax - yMin)
      
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(canvas.width - margin.right, y)
      ctx.stroke()
      
      // Price labels
      ctx.fillStyle = '#999'
      ctx.font = '10px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(price.toFixed(8), canvas.width - margin.right + 5, y + 3)
    }

    // Draw time labels (x-axis)
    ctx.textAlign = 'center'
    const step = Math.max(1, Math.floor(data.length / 5)) // Show at most 5 labels
    for (let i = 0; i < data.length; i += step) {
      const x = margin.left + i * barWidth + barWidth / 2
      const date = new Date(data[i].time)
      ctx.fillText(date.toLocaleDateString(), x, canvas.height - margin.bottom + 15)
    }
    
    // Draw candles
    data.forEach((candle, i) => {
      const x = margin.left + i * barWidth
      const open = scaleY(candle.open, yMin, yMax, chartHeight, margin.top)
      const close = scaleY(candle.close, yMin, yMax, chartHeight, margin.top)
      const high = scaleY(candle.high, yMin, yMax, chartHeight, margin.top)
      const low = scaleY(candle.low, yMin, yMax, chartHeight, margin.top)

      // Draw wick
      ctx.beginPath()
      ctx.moveTo(x + barWidth / 2, high)
      ctx.lineTo(x + barWidth / 2, low)
      ctx.strokeStyle = candle.close >= candle.open ? '#26a69a' : '#ef5350'
      ctx.stroke()

      // Draw body
      ctx.fillStyle = candle.close >= candle.open ? '#26a69a' : '#ef5350'
      const bodyHeight = Math.abs(close - open)
      const y = Math.min(open, close)
      ctx.fillRect(x + barPadding, y, barWidth - 2 * barPadding, bodyHeight)
    })

    // Draw price line for most recent price
    const lastPrice = data[data.length - 1].close
    const lastPriceY = scaleY(lastPrice, yMin, yMax, chartHeight, margin.top)
    
    ctx.beginPath()
    ctx.moveTo(margin.left, lastPriceY)
    ctx.lineTo(canvas.width - margin.right, lastPriceY)
    ctx.strokeStyle = '#2196F3'
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])

    // Draw price label
    ctx.fillStyle = '#2196F3'
    ctx.fillRect(canvas.width - margin.right + 5, lastPriceY - 10, 50, 20)
    ctx.fillStyle = 'white'
    ctx.font = '10px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(lastPrice.toFixed(8), canvas.width - margin.right + 10, lastPriceY + 4)
  }

  // Handle resize
  useEffect(() => {
    function handleResize() {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.clientWidth
        canvasRef.current.height = canvasRef.current.clientHeight
        drawChart()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Draw the candle chart
  useEffect(() => {
    if (!canvasRef.current || !data.length) return
    
    // Initialize canvas
    const canvas = canvasRef.current
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    
    // Draw the chart
    drawChart()
    
    // Setup tooltip
    const tooltipCleanup = setupTooltip()
    
    return tooltipCleanup
  }, [data])
  
  // Setup tooltip functionality
  const setupTooltip = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const tooltipEl = document.createElement('div')
    tooltipEl.className = 'fixed hidden z-50 bg-background border rounded p-2 text-xs shadow-lg'
    document.body.appendChild(tooltipEl)
    
    // Mouse move handler
    const mouseMoveHandler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      
      // Chart margins
      const margin = { top: 20, right: 60, bottom: 30, left: 50 }
      const chartWidth = canvas.width - margin.left - margin.right
      
      // Calculate which candle the mouse is over
      if (x < margin.left || x > canvas.width - margin.right) {
        tooltipEl.classList.add('hidden')
        return
      }
      
      const barWidth = chartWidth / data.length
      const index = Math.floor((x - margin.left) / barWidth)
      
      if (index >= 0 && index < data.length) {
        const candle = data[index]
        tooltipEl.classList.remove('hidden')
        tooltipEl.style.left = `${e.clientX + 10}px`
        tooltipEl.style.top = `${e.clientY - 100}px`
        tooltipEl.innerHTML = `
          <div class="mb-1">${new Date(candle.time).toLocaleString()}</div>
          <div>Open: <span class="text-primary">${candle.open.toFixed(8)}</span></div>
          <div>High: <span class="text-primary">${candle.high.toFixed(8)}</span></div>
          <div>Low: <span class="text-primary">${candle.low.toFixed(8)}</span></div>
          <div>Close: <span class="text-primary">${candle.close.toFixed(8)}</span></div>
        `
      } else {
        tooltipEl.classList.add('hidden')
      }
    }
    
    // Mouse leave handler
    const mouseLeaveHandler = () => {
      tooltipEl.classList.add('hidden')
    }
    
    // Add event listeners
    canvas.addEventListener('mousemove', mouseMoveHandler)
    canvas.addEventListener('mouseleave', mouseLeaveHandler)
    
    // Cleanup function
    return () => {
      canvas.removeEventListener('mousemove', mouseMoveHandler)
      canvas.removeEventListener('mouseleave', mouseLeaveHandler)
      if (document.body.contains(tooltipEl)) {
        document.body.removeChild(tooltipEl)
      }
    }
  }

  // Helper function to scale Y values
  function scaleY(price: number, min: number, max: number, height: number, offset: number = 0): number {
    return offset + height - ((price - min) / (max - min)) * height
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="font-semibold mb-2 w-24 h-4 animate-pulse bg-muted rounded"></div>
        <div className="h-[400px] animate-pulse bg-muted rounded"></div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="font-semibold mb-4">{tokenName}</div>
      <canvas ref={canvasRef} className="w-full h-[400px]" />
    </Card>
  )
}
