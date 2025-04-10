"use client"

import { useState, useEffect, useCallback } from "react"
import { monitoringService, type LogEntry, type RequestMetrics } from "@/lib/monitoring-service"
import { apiDebugger, type ApiDebugInfo } from "@/lib/api-debugger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
  Wifi,
  WifiOff,
  Loader2,
  FileJson,
  ImageIcon,
  Video,
} from "lucide-react"
import { ApiResponseViewer } from "./api-response-viewer"
import { VideoPlayer } from "@/components/ui/video-player"

export function DevToolsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [requests, setRequests] = useState<RequestMetrics[]>([])
  const [expanded, setExpanded] = useState(false)
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("requests")
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionDebugInfo, setConnectionDebugInfo] = useState<Record<string, ApiDebugInfo>>({})
  const [apiDebugInfo, setApiDebugInfo] = useState<Record<string, ApiDebugInfo>>({})

  useEffect(() => {
    // Initial load
    setLogs(monitoringService.getLogs())
    setRequests(monitoringService.getRequests())
    setApiDebugInfo(apiDebugger.getAllDebugInfo())

    // Subscribe to updates
    const unsubscribeMonitoring = monitoringService.subscribe(() => {
      setLogs(monitoringService.getLogs())
      setRequests(monitoringService.getRequests())
    })

    const unsubscribeDebugger = apiDebugger.subscribe(() => {
      setApiDebugInfo(apiDebugger.getAllDebugInfo())
    })

    return () => {
      unsubscribeMonitoring()
      unsubscribeDebugger()
    }
  }, [])

  const testConnection = useCallback(async () => {
    setTestingConnection(true)
    setConnectionError(null)
    setConnectionDebugInfo({})

    try {
      const response = await fetch("/api/test-connection")
      const data = await response.json()

      if (response.ok && data.success) {
        setConnectionStatus("connected")
        monitoringService.log("success", "Connection test successful", data)
      } else {
        setConnectionStatus("disconnected")
        setConnectionError(data.error || `Failed at stage: ${data.stage}`)
        monitoringService.log("error", "Connection test failed", data)
      }

      // Store debug info if available
      if (data.debug) {
        setConnectionDebugInfo(data.debug)
      }
    } catch (error) {
      setConnectionStatus("disconnected")
      setConnectionError(error instanceof Error ? error.message : String(error))
      monitoringService.log("error", "Connection test error", { error })
    } finally {
      setTestingConnection(false)
    }
  }, [])

  useEffect(() => {
    // Test connection on initial load
    testConnection()
  }, [testConnection])

  const toggleRequestExpand = (requestId: string) => {
    setExpandedRequests((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(requestId)) {
        newSet.delete(requestId)
      } else {
        newSet.add(requestId)
      }
      return newSet
    })
  }

  const clearLogs = () => {
    monitoringService.clearLogs()
  }

  const getStatusIcon = (status: "pending" | "success" | "error") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warn":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  // Helper to determine if a request is for video generation
  const isVideoRequest = (request: RequestMetrics) => {
    // Check if the URL in the API debug info contains "generate-video"
    const debugInfo = apiDebugInfo[request.requestId]
    if (debugInfo && debugInfo.url.includes("generate-video")) {
      return true
    }

    // Check if the imageUrl contains video mime type
    if (request.imageUrl && request.imageUrl.includes("video/")) {
      return true
    }

    // Check if the prompt contains video-related keywords
    const videoKeywords = ["video", "animation", "moving", "motion"]
    return videoKeywords.some((keyword) => request.prompt.toLowerCase().includes(keyword))
  }

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          className="bg-white shadow-lg"
          onClick={() => setExpanded(true)}
          data-dev-tools-toggle
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Open Dev Tools
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg max-h-[60vh] overflow-hidden flex flex-col">
      <div className="p-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium">AI Media Generation Dev Tools</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={clearLogs}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Logs
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            <ChevronDown className="h-4 w-4" />
            Minimize
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="requests">
            Requests
            <Badge variant="outline" className="ml-2">
              {requests.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="logs">
            Logs
            <Badge variant="outline" className="ml-2">
              {logs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
          <TabsTrigger value="raw-api">Raw API</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="flex-1 overflow-auto p-4">
          {requests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No media generation requests yet</div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const isVideo = isVideoRequest(request)
                return (
                  <Card key={request.requestId} className="overflow-hidden">
                    <CardHeader
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => toggleRequestExpand(request.requestId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <div className="flex items-center">
                            {isVideo ? (
                              <Video className="h-4 w-4 mr-2 text-purple-500" />
                            ) : (
                              <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
                            )}
                            <CardTitle className="text-base">
                              {request.prompt.length > 50 ? `${request.prompt.substring(0, 50)}...` : request.prompt}
                            </CardTitle>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {request.duration && <span className="text-sm text-gray-500">{request.duration}ms</span>}
                          {expandedRequests.has(request.requestId) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {expandedRequests.has(request.requestId) && (
                      <CardContent className="pb-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium">Request ID:</span>
                                <span className="text-sm ml-2 text-gray-600">{request.requestId}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Type:</span>
                                <span className="text-sm ml-2 text-gray-600">{isVideo ? "Video" : "Image"}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Status:</span>
                                <span className="text-sm ml-2 text-gray-600">{request.status}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Started:</span>
                                <span className="text-sm ml-2 text-gray-600">
                                  {request.startTime.toLocaleTimeString()}
                                </span>
                              </div>
                              {request.endTime && (
                                <div>
                                  <span className="text-sm font-medium">Completed:</span>
                                  <span className="text-sm ml-2 text-gray-600">
                                    {request.endTime.toLocaleTimeString()}
                                  </span>
                                </div>
                              )}
                              {request.duration && (
                                <div>
                                  <span className="text-sm font-medium">Duration:</span>
                                  <span className="text-sm ml-2 text-gray-600">{request.duration}ms</span>
                                </div>
                              )}
                              <div>
                                <span className="text-sm font-medium">Prompt:</span>
                                <p className="text-sm text-gray-600 mt-1">{request.prompt}</p>
                              </div>
                              {request.error && (
                                <div>
                                  <span className="text-sm font-medium text-red-500">Error:</span>
                                  <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto max-h-32">
                                    {JSON.stringify(request.error, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {request.imageUrl && (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium mb-2">
                                  Generated {isVideo ? "Video" : "Image"}:
                                </span>
                                {isVideo ? (
                                  <VideoPlayer
                                    src={request.imageUrl}
                                    className="w-full aspect-video max-h-64 rounded-lg border bg-gray-100"
                                  />
                                ) : (
                                  <div className="relative aspect-square max-h-64 overflow-hidden rounded-lg border bg-gray-100">
                                    <img
                                      src={request.imageUrl || "/placeholder.svg"}
                                      alt={request.prompt}
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Add API debug info if available */}
                          {apiDebugInfo[request.requestId] && (
                            <ApiResponseViewer
                              debugInfo={apiDebugInfo[request.requestId]}
                              title="API Request Details"
                            />
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="flex-1 overflow-auto p-4">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No logs yet</div>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start p-2 rounded text-sm ${
                    log.level === "error"
                      ? "bg-red-50"
                      : log.level === "warn"
                        ? "bg-yellow-50"
                        : log.level === "success"
                          ? "bg-green-50"
                          : "bg-blue-50"
                  }`}
                >
                  <div className="mr-2 mt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{log.message}</span>
                      <span className="text-xs text-gray-500">{log.timestamp.toLocaleTimeString()}</span>
                    </div>
                    {log.details && (
                      <pre className="text-xs mt-1 overflow-auto max-h-32">
                        {typeof log.details === "object" ? JSON.stringify(log.details, null, 2) : log.details}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connectivity" className="flex-1 overflow-auto p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">API Connectivity</h3>
                    <Button variant="outline" size="sm" onClick={testConnection} disabled={testingConnection}>
                      {testingConnection ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {connectionStatus === "connected" ? (
                          <Wifi className="h-5 w-5 text-green-500" />
                        ) : connectionStatus === "disconnected" ? (
                          <WifiOff className="h-5 w-5 text-red-500" />
                        ) : (
                          <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                        )}
                        <span className="font-medium">Hugging Face API Connection</span>
                      </div>
                      <Badge
                        variant={
                          connectionStatus === "connected"
                            ? "success"
                            : connectionStatus === "disconnected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {connectionStatus === "connected"
                          ? "Connected"
                          : connectionStatus === "disconnected"
                            ? "Disconnected"
                            : "Unknown"}
                      </Badge>
                    </div>

                    {connectionError && (
                      <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded">
                        <div className="font-medium">Error:</div>
                        <div>{connectionError}</div>
                      </div>
                    )}

                    {connectionStatus === "connected" && (
                      <div className="mt-2 text-sm text-green-600">Successfully connected to Hugging Face API</div>
                    )}
                  </div>

                  {/* Connection test debug info */}
                  {Object.keys(connectionDebugInfo).length > 0 && (
                    <div className="space-y-4 mt-4">
                      <h4 className="text-sm font-medium">Connection Test Details</h4>
                      {connectionDebugInfo.direct && (
                        <ApiResponseViewer debugInfo={connectionDebugInfo.direct} title="Hugging Face API" />
                      )}
                      {connectionDebugInfo.router && (
                        <ApiResponseViewer debugInfo={connectionDebugInfo.router} title="Hugging Face Router" />
                      )}
                      {connectionDebugInfo.replicate && (
                        <ApiResponseViewer debugInfo={connectionDebugInfo.replicate} title="Replicate API" />
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Hugging Face Router</span>
                        <Badge variant={requests.length > 0 ? "success" : "outline"}>
                          {requests.length > 0 ? "Connected" : "Not Tested"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {requests.length > 0
                          ? `Last request: ${new Date(Math.max(...requests.map((r) => r.startTime.getTime()))).toLocaleTimeString()}`
                          : "No requests made yet"}
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">AI Services</span>
                        <Badge variant={requests.some((r) => r.status === "success") ? "success" : "outline"}>
                          {requests.some((r) => r.status === "success") ? "Connected" : "Not Confirmed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {requests.some((r) => r.status === "success")
                          ? `${requests.filter((r) => r.status === "success").length} successful generations`
                          : "No successful generations yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">HUGGING_FACE_API_KEY</span>
                      <Badge variant={connectionStatus === "connected" ? "success" : "destructive"}>
                        {connectionStatus === "connected" ? "Valid" : "Invalid or Missing"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {connectionStatus === "connected"
                        ? "API key is valid and working correctly"
                        : "API key may be missing, invalid, or has insufficient permissions"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Request Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{requests.length}</div>
                      <div className="text-sm text-gray-500">Total Requests</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-500">
                        {requests.filter((r) => r.status === "success").length}
                      </div>
                      <div className="text-sm text-gray-500">Successful</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-500">
                        {requests.filter((r) => r.status === "error").length}
                      </div>
                      <div className="text-sm text-gray-500">Failed</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">
                        {requests.filter((r) => isVideoRequest(r)).length}
                      </div>
                      <div className="text-sm text-gray-500">Video Requests</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw-api" className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Raw API Responses</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => apiDebugger.clear()}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>

            {Object.keys(apiDebugInfo).length === 0 ? (
              <div className="text-center text-gray-500 py-8">No API requests captured yet</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(apiDebugInfo).map(([id, info]) => {
                  const isVideoRequest =
                    info.url.includes("generate-video") || info.responseHeaders?.["content-type"]?.includes("video")
                  return (
                    <Card key={id}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {info.responseStatus && info.responseStatus >= 200 && info.responseStatus < 300 ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : info.responseStatus ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-500" />
                            )}
                            <CardTitle className="text-base flex items-center">
                              {info.method} {info.url.split("/").pop()}
                              {isVideoRequest ? (
                                <Video className="h-4 w-4 ml-2 text-purple-500" />
                              ) : info.responseHeaders?.["content-type"]?.includes("image") ? (
                                <ImageIcon className="h-4 w-4 ml-2 text-blue-500" />
                              ) : (
                                <FileJson className="h-4 w-4 ml-2 text-blue-500" />
                              )}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {info.responseStatus && (
                              <Badge
                                variant={
                                  info.responseStatus >= 200 && info.responseStatus < 300 ? "success" : "destructive"
                                }
                              >
                                {info.responseStatus}
                              </Badge>
                            )}
                            {info.timing.duration && (
                              <span className="text-xs text-gray-500">{info.timing.duration}ms</span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ApiResponseViewer debugInfo={info} />
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
