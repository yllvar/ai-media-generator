// This utility helps capture and analyze API requests and responses
export interface ApiDebugInfo {
  url: string
  method: string
  requestHeaders: Record<string, string>
  requestBody?: any
  responseStatus?: number
  responseHeaders?: Record<string, string>
  responseBody?: any
  error?: any
  timing: {
    start: number
    end?: number
    duration?: number
  }
}

class ApiDebugger {
  private debugInfo: Record<string, ApiDebugInfo> = {}
  private listeners: Set<(id: string, info: ApiDebugInfo) => void> = new Set()

  startRequest(id: string, url: string, method: string, headers: Record<string, string>, body?: any): void {
    this.debugInfo[id] = {
      url,
      method,
      requestHeaders: headers,
      requestBody: body,
      timing: {
        start: Date.now(),
      },
    }
    this.notifyListeners(id)
  }

  completeRequest(id: string, status: number, headers: Record<string, string>, body?: any, error?: any): void {
    if (!this.debugInfo[id]) {
      this.startRequest(id, "unknown", "unknown", {})
    }

    const now = Date.now()
    const info = this.debugInfo[id]

    this.debugInfo[id] = {
      ...info,
      responseStatus: status,
      responseHeaders: headers,
      responseBody: body,
      error,
      timing: {
        ...info.timing,
        end: now,
        duration: now - info.timing.start,
      },
    }

    this.notifyListeners(id)
  }

  getDebugInfo(id: string): ApiDebugInfo | undefined {
    return this.debugInfo[id]
  }

  getAllDebugInfo(): Record<string, ApiDebugInfo> {
    return { ...this.debugInfo }
  }

  subscribe(callback: (id: string, info: ApiDebugInfo) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  clear(): void {
    this.debugInfo = {}
    for (const id in this.debugInfo) {
      this.notifyListeners(id)
    }
  }

  private notifyListeners(id: string): void {
    const info = this.debugInfo[id]
    if (info) {
      this.listeners.forEach((listener) => listener(id, info))
    }
  }
}

export const apiDebugger = new ApiDebugger()
