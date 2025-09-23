export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    } else if (!timeout) {
      // Schedule a call at the next allowed time
      timeout = setTimeout(() => {
        lastCall = Date.now()
        func(...args)
        timeout = null
      }, delay - (now - lastCall))
    }
  }
}