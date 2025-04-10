type LogLevel = "info" | "warn" | "error" | "success"

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  details?: any
  duration?: number
}

export interface RequestMetrics {
  requestId: string
  prompt: string
  startTime: Date
  endTime?: Date
  duration?: number
  status: "pending" | "success" | "error"
  response?: any
  error?: any
  imageUrl?: string
  mediaType?: "image" | "video"
}

class MonitoringService {
  private logs: LogEntry[] = []
  private requests: Map<string, RequestMetrics> = new Map()
  private listeners: Set<() => void> = new Set()

  // Add a log entry
  log(level: LogLevel, message: string, details?: any): string {
    const id = crypto.randomUUID()
    const entry: LogEntry = {
      id,
      timestamp: new Date(),
      level,
      message,
      details,
    }

    this.logs.push(entry)
    this.notifyListeners()
    return id
  }

  // Start tracking a request
  trackRequest(requestId: string, prompt: string, mediaType?: "image" | "video"): void {
    this.requests.set(requestId, {
      requestId,
      prompt,
      startTime: new Date(),
      status: "pending",
      mediaType,
    })

    this.log("info", `Starting ${mediaType || "media"} generation request: ${requestId}`, { prompt })
    this.notifyListeners()
  }

  // Update a request with success
  completeRequest(requestId: string, mediaUrl: string, response?: any): void {
    const request = this.requests.get(requestId)
    if (!request) return

    const endTime = new Date()
    const duration = endTime.getTime() - request.startTime.getTime()

    // Determine media type from URL if not already set
    let mediaType = request.mediaType
    if (!mediaType) {
      mediaType = mediaUrl.includes("video/") ? "video" : "image"
    }

    this.requests.set(requestId, {
      ...request,
      endTime,
      duration,
      status: "success",
      response,
      imageUrl: mediaUrl,
      mediaType,
    })

    this.log("success", `${mediaType === "video" ? "Video" : "Image"} generation successful: ${requestId}`, {
      duration: `${duration}ms`,
      prompt: request.prompt,
    })
    this.notifyListeners()
  }

  // Update a request with error
  failRequest(requestId: string, error: any): void {
    const request = this.requests.get(requestId)
    if (!request) return

    const endTime = new Date()
    const duration = endTime.getTime() - request.startTime.getTime()

    this.requests.set(requestId, {
      ...request,
      endTime,
      duration,
      status: "error",
      error,
    })

    this.log("error", `${request.mediaType === "video" ? "Video" : "Image"} generation failed: ${requestId}`, {
      error,
      duration: `${duration}ms`,
      prompt: request.prompt,
    })
    this.notifyListeners()
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Get all request metrics
  getRequests(): RequestMetrics[] {
    return Array.from(this.requests.values())
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
    this.notifyListeners()
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }
}

// Create a singleton instance
export const monitoringService = new MonitoringService()
