import { useEffect, useRef, useState, useCallback } from 'react'
import { RendererAPI, PerformanceMetrics } from '../renderer/types'

interface PerformanceData {
  current: PerformanceMetrics
  average: {
    fps: number
    frameTime: number
    nodeRenderTime: number
  }
  peak: {
    fps: number
    frameTime: number
    nodeCount: number
    memoryUsage: number
  }
  history: PerformanceMetrics[]
}

export function usePerformanceMonitoring() {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    current: {
      fps: 60,
      frameTime: 16.67,
      drawCalls: 0,
      nodeCount: 0,
      visibleNodeCount: 0,
      memoryUsage: 0
    },
    average: {
      fps: 60,
      frameTime: 16.67,
      nodeRenderTime: 0
    },
    peak: {
      fps: 60,
      frameTime: 16.67,
      nodeCount: 0,
      memoryUsage: 0
    },
    history: []
  })
  
  const intervalRef = useRef<number>()
  const rendererRef = useRef<RendererAPI | null>(null)
  const historyRef = useRef<PerformanceMetrics[]>([])
  const maxHistorySize = 300 // 5 minutes at 1 sample/second
  
  // Start monitoring
  const startMonitoring = useCallback((renderer: RendererAPI) => {
    rendererRef.current = renderer
    historyRef.current = []
    
    // Set up monitoring interval
    intervalRef.current = window.setInterval(() => {
      if (!rendererRef.current) return
      
      const metrics = rendererRef.current.getPerformanceMetrics()
      
      // Update history
      historyRef.current.push(metrics)
      if (historyRef.current.length > maxHistorySize) {
        historyRef.current.shift()
      }
      
      // Calculate averages
      const avgFps = historyRef.current.reduce((sum, m) => sum + m.fps, 0) / historyRef.current.length
      const avgFrameTime = historyRef.current.reduce((sum, m) => sum + m.frameTime, 0) / historyRef.current.length
      
      // Update peak values
      const peakFps = Math.max(...historyRef.current.map(m => m.fps))
      const peakFrameTime = Math.min(...historyRef.current.map(m => m.frameTime))
      const peakNodeCount = Math.max(...historyRef.current.map(m => m.nodeCount))
      const peakMemory = Math.max(...historyRef.current.map(m => m.memoryUsage))
      
      setPerformanceData({
        current: metrics,
        average: {
          fps: Math.round(avgFps),
          frameTime: avgFrameTime,
          nodeRenderTime: avgFrameTime / Math.max(1, metrics.visibleNodeCount)
        },
        peak: {
          fps: peakFps,
          frameTime: peakFrameTime,
          nodeCount: peakNodeCount,
          memoryUsage: peakMemory
        },
        history: [...historyRef.current]
      })
    }, 1000) // Update every second
    
    // Log initial report
    console.log('Performance monitoring started')
  }, [])
  
  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    rendererRef.current = null
    
    // Generate final report
    if (historyRef.current.length > 0) {
      generatePerformanceReport()
    }
  }, [])
  
  // Generate performance report
  const generatePerformanceReport = useCallback(() => {
    const history = historyRef.current
    if (history.length === 0) return
    
    const report = {
      duration: history.length,
      averageFPS: Math.round(history.reduce((sum, m) => sum + m.fps, 0) / history.length),
      minFPS: Math.min(...history.map(m => m.fps)),
      maxFPS: Math.max(...history.map(m => m.fps)),
      frameDrops: history.filter(m => m.fps < 30).length,
      severeFrameDrops: history.filter(m => m.fps < 20).length,
      averageFrameTime: history.reduce((sum, m) => sum + m.frameTime, 0) / history.length,
      averageDrawCalls: Math.round(history.reduce((sum, m) => sum + m.drawCalls, 0) / history.length),
      maxNodeCount: Math.max(...history.map(m => m.nodeCount)),
      averageMemory: Math.round(history.reduce((sum, m) => sum + m.memoryUsage, 0) / history.length),
      peakMemory: Math.max(...history.map(m => m.memoryUsage))
    }
    
    console.log('=== Performance Report ===')
    console.log(`Duration: ${report.duration}s`)
    console.log(`Average FPS: ${report.averageFPS} (min: ${report.minFPS}, max: ${report.maxFPS})`)
    console.log(`Frame drops (<30 FPS): ${report.frameDrops}`)
    console.log(`Severe drops (<20 FPS): ${report.severeFrameDrops}`)
    console.log(`Average frame time: ${report.averageFrameTime.toFixed(2)}ms`)
    console.log(`Average draw calls: ${report.averageDrawCalls}`)
    console.log(`Max node count: ${report.maxNodeCount}`)
    console.log(`Memory usage: avg ${report.averageMemory}MB, peak ${report.peakMemory}MB`)
    console.log('========================')
    
    return report
  }, [])
  
  // Export performance data
  const exportPerformanceData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      report: generatePerformanceReport(),
      history: historyRef.current
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [generatePerformanceReport])
  
  // Check for performance issues
  const checkPerformanceIssues = useCallback(() => {
    const issues: string[] = []
    const current = performanceData.current
    
    if (current.fps < 60) {
      issues.push(`Low FPS: ${current.fps}`)
    }
    if (current.frameTime > 20) {
      issues.push(`High frame time: ${current.frameTime.toFixed(1)}ms`)
    }
    if (current.memoryUsage > 100) {
      issues.push(`High memory usage: ${current.memoryUsage}MB`)
    }
    if (current.drawCalls > current.nodeCount * 2) {
      issues.push(`Excessive draw calls: ${current.drawCalls} for ${current.nodeCount} nodes`)
    }
    
    return issues
  }, [performanceData])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])
  
  return {
    performanceData,
    startMonitoring,
    stopMonitoring,
    generatePerformanceReport,
    exportPerformanceData,
    checkPerformanceIssues
  }
}