"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wand2, Save, X, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PromptBuilderProps {
  onPromptGenerated: (prompt: string) => void
  initialPrompt?: string
}

export function PromptBuilder({ onPromptGenerated, initialPrompt = "" }: PromptBuilderProps) {
  const [subject, setSubject] = useState("")
  const [setting, setSetting] = useState("")
  const [lighting, setLighting] = useState("")
  const [style, setStyle] = useState("")
  const [camera, setCamera] = useState("")
  const [additionalDetails, setAdditionalDetails] = useState("")
  const [customPrompt, setCustomPrompt] = useState(initialPrompt)
  const [savedPrompts, setSavedPrompts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("builder")

  // Load saved prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("savedPrompts")
    if (saved) {
      try {
        setSavedPrompts(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved prompts", e)
      }
    }
  }, [])

  // Update custom prompt when initial prompt changes
  useEffect(() => {
    if (initialPrompt) {
      setCustomPrompt(initialPrompt)
      setActiveTab("custom")
    }
  }, [initialPrompt])

  const generatePrompt = () => {
    const parts = [
      subject,
      setting && `${setting}`,
      lighting && `${lighting}`,
      camera && `shot on ${camera}`,
      style && `${style}`,
      additionalDetails,
    ].filter(Boolean)

    const generatedPrompt = parts.join(", ")
    setCustomPrompt(generatedPrompt)
    onPromptGenerated(generatedPrompt)
    setActiveTab("custom")
  }

  const savePrompt = () => {
    if (!customPrompt.trim()) return

    const newSavedPrompts = [...savedPrompts, customPrompt]
    setSavedPrompts(newSavedPrompts)
    localStorage.setItem("savedPrompts", JSON.stringify(newSavedPrompts))
  }

  const deletePrompt = (index: number) => {
    const newSavedPrompts = savedPrompts.filter((_, i) => i !== index)
    setSavedPrompts(newSavedPrompts)
    localStorage.setItem("savedPrompts", JSON.stringify(newSavedPrompts))
  }

  const usePrompt = useCallback(
    (prompt: string) => {
      setCustomPrompt(prompt)
      onPromptGenerated(prompt)
      setActiveTab("custom")
    },
    [onPromptGenerated],
  )

  // Suggestions for each field
  const suggestions = {
    subject: [
      "a young woman with long hair",
      "an elderly man with a beard",
      "a majestic lion",
      "a futuristic cityscape",
      "a serene lake",
    ],
    setting: ["in a lush forest", "on a mountain peak", "in a cyberpunk city", "in a cozy cafe", "on a deserted beach"],
    lighting: ["golden hour lighting", "dramatic side lighting", "soft diffused lighting", "neon lights", "moonlight"],
    style: [
      "photorealistic, detailed, 8K",
      "cinematic, film grain",
      "watercolor painting",
      "in the style of Monet",
      "vaporwave aesthetic",
    ],
    camera: ["Canon EOS R5", "Hasselblad medium format", "Sony A7R IV", "iPhone 15 Pro", "Leica M10"],
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
          Prompt Builder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="saved">Saved Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="E.g., a young woman with auburn hair"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {suggestions.subject.map((suggestion, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setSubject(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="setting">Setting</Label>
              <Input
                id="setting"
                placeholder="E.g., in a lush forest"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {suggestions.setting.map((suggestion, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setSetting(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="lighting">Lighting</Label>
              <Input
                id="lighting"
                placeholder="E.g., golden hour lighting"
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {suggestions.lighting.map((suggestion, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setLighting(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="camera">Camera Details</Label>
              <Input
                id="camera"
                placeholder="E.g., Canon EOS R5"
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {suggestions.camera.map((suggestion, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setCamera(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="style">Style</Label>
              <Input
                id="style"
                placeholder="E.g., photorealistic, detailed, 8K"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {suggestions.style.map((suggestion, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setStyle(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="additionalDetails">Additional Details</Label>
              <Input
                id="additionalDetails"
                placeholder="E.g., shallow depth of field, vibrant colors"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
              />
            </div>

            <Button onClick={generatePrompt} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Prompt
            </Button>
          </TabsContent>

          <TabsContent value="custom">
            <div className="space-y-4">
              <div>
                <Label htmlFor="customPrompt">Custom Prompt</Label>
                <Textarea
                  id="customPrompt"
                  placeholder="Enter your custom prompt here..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => onPromptGenerated(customPrompt)} className="flex-1">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use Prompt
                </Button>
                <Button variant="outline" onClick={savePrompt}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            {savedPrompts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No saved prompts yet</p>
                <p className="text-sm mt-1">Build and save prompts to reuse them later</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedPrompts.map((prompt, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md border relative group">
                    <p className="text-sm pr-16">{prompt}</p>
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => usePrompt(prompt)}
                        title="Use this prompt"
                      >
                        <Sparkles className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500"
                        onClick={() => deletePrompt(index)}
                        title="Delete this prompt"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
