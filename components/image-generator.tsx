"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  XCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"
import { DevToolsPanel } from "@/components/dev-tools/dev-tools-panel"
import { Progress } from "@/components/ui/progress"
import { PromptGuide } from "@/components/prompt-engineering/prompt-guide"
import { PromptBuilder } from "@/components/prompt-engineering/prompt-builder"

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [predictionId, setPredictionId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)
  const [progressPercent, setProgressPercent] = useState(0)
  const [showPromptTools, setShowPromptTools] = useState(false)

  // Update the handleSubmit function to include more detailed error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setRequestId(null)
    setPredictionId(null)
    setDebugInfo(null)
    setGenerationStatus("Creating prediction...")
    setProgressPercent(10)
    setImage(null)

    try {
      console.log("Starting image generation request with prompt:", prompt)

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      console.log("Received response with status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      // Store debug info if available
      if (data.debug) {
        setDebugInfo(data.debug)
        console.log("Debug info:", data.debug)
      }

      // Store prediction ID if available
      if (data.predictionId) {
        setPredictionId(data.predictionId)
        console.log("Prediction ID:", data.predictionId)
      }

      if (!response.ok) {
        const errorMessage = data.error || "Failed to generate image"
        const errorDetails = data.details ? `: ${data.details}` : ""
        console.error(`Error generating image: ${errorMessage}${errorDetails}`)

        throw new Error(`${errorMessage}${errorDetails}`)
      }

      if (!data.image) {
        console.error("No image data in response")
        throw new Error("No image was generated")
      }

      setImage(data.image)
      setRequestId(data.requestId)
      setGenerationStatus("Complete")
      setProgressPercent(100)
      console.log("Successfully set image with requestId:", data.requestId)
    } catch (err) {
      console.error("Error in image generation:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setGenerationStatus("Failed")
      setProgressPercent(0)
    } finally {
      setLoading(false)
    }
  }

  const viewRawResponse = () => {
    // Open the dev tools panel and switch to the raw API tab
    document.querySelector("[data-dev-tools-toggle]")?.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    // Find the tab trigger for raw-api and click it
    setTimeout(() => {
      const tabTriggers = document.querySelectorAll('[role="tab"]')
      for (const trigger of tabTriggers) {
        if (trigger.textContent?.includes("Raw API")) {
          trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }))
          break
        }
      }
    }, 100)
  }

  const handlePromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt)
  }

  return (
    <>
      <Card className="w-full">
        {/* Add a network status indicator at the top of the card */}
        <div className="bg-gray-100 px-4 py-2 text-sm border-b flex items-center justify-between">
          <span className="font-medium">Image Generation Status</span>
          {loading ? (
            <span className="flex items-center text-yellow-600">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {generationStatus || "Generating..."}
            </span>
          ) : error ? (
            <span className="flex items-center text-red-600">
              <XCircle className="h-3 w-3 mr-1" />
              Error
            </span>
          ) : image ? (
            <span className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Success
            </span>
          ) : (
            <span className="flex items-center text-gray-600">
              <Info className="h-3 w-3 mr-1" />
              Ready
            </span>
          )}
        </div>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Enter your prompt
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setShowPromptTools(!showPromptTools)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Prompt Tools
                  {showPromptTools ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>
              <div className="flex space-x-2">
                <Input
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Astronaut riding a horse, photorealistic, detailed, 8K"
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !prompt.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
            </div>

            {/* Show progress during generation */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{generationStatus}</span>
                  <span className="text-sm text-gray-500">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {/* Enhance the error display to show more details */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Error generating image</h4>
                    <p className="text-sm mt-1">{error}</p>
                    {predictionId && (
                      <p className="text-sm mt-1">
                        Prediction ID: <code className="bg-red-100 px-1 rounded">{predictionId}</code>
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 bg-white"
                        onClick={() => {
                          // Open the dev tools panel
                          document
                            .querySelector("[data-dev-tools-toggle]")
                            ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                        }}
                      >
                        View Details in Dev Tools
                      </Button>
                      {debugInfo && (
                        <Button variant="outline" size="sm" className="text-xs h-7 bg-white" onClick={viewRawResponse}>
                          <FileText className="h-3 w-3 mr-1" />
                          View Raw Response
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && !error && (
              <div className="flex justify-center items-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">{generationStatus}</p>
                  {predictionId && (
                    <p className="text-xs text-gray-400 mt-2">
                      Prediction ID: <code className="bg-gray-100 px-1 rounded">{predictionId}</code>
                    </p>
                  )}
                </div>
              </div>
            )}

            {image && !loading && (
              <div className="mt-6 space-y-2">
                <h3 className="text-lg font-medium">Generated Image</h3>
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-gray-100">
                  <img src={image || "/placeholder.svg"} alt={prompt} className="h-full w-full object-contain" />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Prompt: {prompt}</p>
                  <div className="text-right">
                    {predictionId && <p className="text-xs text-gray-400">Prediction ID: {predictionId}</p>}
                    {requestId && <p className="text-xs text-gray-400">Request ID: {requestId}</p>}
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Prompt Engineering Tools */}
          {showPromptTools && (
            <>
              <PromptBuilder onPromptGenerated={handlePromptSelect} initialPrompt={prompt} />
              <PromptGuide onSelectPrompt={handlePromptSelect} />
            </>
          )}
        </CardContent>
      </Card>

      <DevToolsPanel />
    </>
  )
}
