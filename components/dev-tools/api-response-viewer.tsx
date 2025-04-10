"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import type { ApiDebugInfo } from "@/lib/api-debugger"

interface ApiResponseViewerProps {
  debugInfo?: ApiDebugInfo
  title?: string
}

export function ApiResponseViewer({ debugInfo, title = "API Response" }: ApiResponseViewerProps) {
  const [activeTab, setActiveTab] = useState("response")
  const [copied, setCopied] = useState(false)

  if (!debugInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">No debug information available</div>
        </CardContent>
      </Card>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2)
    } catch (e) {
      return String(data)
    }
  }

  const renderContent = (content: any): JSX.Element => {
    if (content === undefined || content === null) {
      return <div className="text-gray-500">No content</div>
    }

    const contentStr = typeof content === "object" ? formatJson(content) : String(content)

    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="absolute right-2 top-2 h-8 w-8 p-0"
          onClick={() => copyToClipboard(contentStr)}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-96 mt-2">{contentStr}</pre>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-2">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
          </TabsList>

          <TabsContent value="request">
            <div className="space-y-4">
              <div>
                <div className="font-medium text-sm mb-1">URL</div>
                <div className="text-sm bg-gray-100 p-2 rounded">{debugInfo.url}</div>
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Method</div>
                <div className="text-sm bg-gray-100 p-2 rounded">{debugInfo.method}</div>
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Request Body</div>
                {renderContent(debugInfo.requestBody)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="response">
            <div className="space-y-4">
              <div>
                <div className="font-medium text-sm mb-1">Status</div>
                <div className="text-sm bg-gray-100 p-2 rounded">{debugInfo.responseStatus || "No response"}</div>
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Response Body</div>
                {renderContent(debugInfo.responseBody)}
              </div>
              {debugInfo.error && (
                <div>
                  <div className="font-medium text-sm mb-1 text-red-500">Error</div>
                  <div className="text-sm bg-red-50 p-2 rounded text-red-600">{debugInfo.error}</div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="headers">
            <div className="space-y-4">
              <div>
                <div className="font-medium text-sm mb-1">Request Headers</div>
                {renderContent(debugInfo.requestHeaders)}
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Response Headers</div>
                {renderContent(debugInfo.responseHeaders)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timing">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-sm mb-1">Start Time</div>
                  <div className="text-sm bg-gray-100 p-2 rounded">
                    {new Date(debugInfo.timing.start).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm mb-1">End Time</div>
                  <div className="text-sm bg-gray-100 p-2 rounded">
                    {debugInfo.timing.end ? new Date(debugInfo.timing.end).toLocaleTimeString() : "Not completed"}
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Duration</div>
                <div className="text-sm bg-gray-100 p-2 rounded">
                  {debugInfo.timing.duration ? `${debugInfo.timing.duration}ms` : "Not completed"}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
