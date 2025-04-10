"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lightbulb, Copy, Check, Sparkles } from "lucide-react"
import { useState } from "react"

interface PromptGuideProps {
  onSelectPrompt: (prompt: string) => void
}

export function PromptGuide({ onSelectPrompt }: PromptGuideProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"image" | "video">("image")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const imagePromptTemplates = [
    {
      id: "portrait",
      title: "Portrait Photography",
      template: "Portrait of [subject], [specific details], [setting], [lighting], shot on [camera], [style]",
      examples: [
        {
          id: "portrait-1",
          text: "Portrait of a young woman with freckles and auburn hair, ethereal forest setting, golden hour lighting, shot on Canon EOS R5, shallow depth of field, photorealistic, detailed, 8K",
        },
        {
          id: "portrait-2",
          text: "Close-up portrait of an elderly fisherman with weathered face, harbor backdrop, dramatic side lighting, shot on Hasselblad, cinematic color grading, hyperrealistic detail",
        },
      ],
    },
    {
      id: "landscape",
      title: "Landscape Photography",
      template: "[Type of landscape], [weather/time], [lighting conditions], [camera details], [style]",
      examples: [
        {
          id: "landscape-1",
          text: "Majestic mountain range with snow-capped peaks, dawn, morning mist, dramatic clouds, shot on Sony A7R IV, wide angle lens, photorealistic, detailed, 8K resolution",
        },
        {
          id: "landscape-2",
          text: "Serene beach at sunset, gentle waves, golden hour lighting, shot on Nikon Z9, polarizing filter, cinematic, vibrant colors, hyper-detailed",
        },
      ],
    },
    {
      id: "concept",
      title: "Concept Art",
      template: "[Subject/scene], [style], [lighting], [mood], [artist influence], [details]",
      examples: [
        {
          id: "concept-1",
          text: "Futuristic cyberpunk cityscape, neon lights, rainy night, moody atmosphere, in the style of Blade Runner, detailed architecture, volumetric lighting",
        },
        {
          id: "concept-2",
          text: "Ancient magical library with floating books, mystical energy, warm candlelight, fantasy concept art, in the style of Craig Mullins, intricate details, atmospheric",
        },
      ],
    },
    {
      id: "artistic",
      title: "Artistic Styles",
      template: "[Subject], [setting], in the style of [artist/movement], [additional details]",
      examples: [
        {
          id: "artistic-1",
          text: "A woman in a garden, surrounded by flowers, in the style of Alphonse Mucha, Art Nouveau, ornate details, flowing lines, pastel colors, decorative elements",
        },
        {
          id: "artistic-2",
          text: "Bustling marketplace in Morocco, in the style of impressionism, vibrant brushstrokes, Claude Monet inspired, atmospheric light, colorful scene",
        },
      ],
    },
  ]

  const videoPromptTemplates = [
    {
      id: "action",
      title: "Action Sequences",
      template: "[Subject] [action], [setting], [style], [camera movement]",
      examples: [
        {
          id: "action-1",
          text: "A young man running through a crowded city street, cinematic lighting, handheld camera following",
        },
        {
          id: "action-2",
          text: "A dancer performing a pirouette on stage, dramatic lighting, slow motion, camera circling around",
        },
      ],
    },
    {
      id: "nature",
      title: "Nature Scenes",
      template: "[Natural element] [movement], [weather], [time of day], [camera style]",
      examples: [
        {
          id: "nature-1",
          text: "Ocean waves crashing against rocky cliffs, stormy weather, sunset, aerial view",
        },
        {
          id: "nature-2",
          text: "Autumn leaves falling in a forest, gentle breeze, golden hour, shallow depth of field",
        },
      ],
    },
    {
      id: "urban",
      title: "Urban Scenes",
      template: "[Urban setting], [people activity], [time of day], [weather], [camera movement]",
      examples: [
        {
          id: "urban-1",
          text: "Busy New York intersection with pedestrians crossing, rush hour, rainy evening, timelapse",
        },
        {
          id: "urban-2",
          text: "Quiet cafe with a person reading a book, early morning, steam rising from coffee cup, static shot",
        },
      ],
    },
  ]

  const imagePromptTips = [
    {
      title: "Be Specific and Detailed",
      description:
        "Include specific details about the subject, setting, lighting, and mood. The more specific your prompt, the better the results.",
    },
    {
      title: "Use Artistic Terminology",
      description:
        "Terms like 'cinematic', 'photorealistic', 'detailed', '8K resolution' help guide the model toward higher quality outputs.",
    },
    {
      title: "Specify Camera Details",
      description:
        "Mentioning camera models, lenses, and settings (e.g., 'Shot with a Canon EOS R5, 85mm lens, f/1.8 aperture') can improve photorealism.",
    },
    {
      title: "Describe Lighting",
      description:
        "Lighting dramatically affects the mood and quality. Try terms like 'golden hour lighting', 'dramatic side lighting', or 'studio lighting setup'.",
    },
    {
      title: "Reference Artists or Styles",
      description:
        "Mentioning 'in the style of [artist name]' or specific art movements can guide the aesthetic direction.",
    },
  ]

  const videoPromptTips = [
    {
      title: "Describe Movement",
      description:
        "For videos, it's important to describe the movement or action that should occur. Use verbs like 'walking', 'running', 'dancing', etc.",
    },
    {
      title: "Specify Camera Movement",
      description:
        "Terms like 'tracking shot', 'panning', 'zoom in', 'aerial view', or 'static shot' help define how the camera should move.",
    },
    {
      title: "Keep It Simple",
      description:
        "Video generation works best with simpler prompts. Focus on one main subject and action rather than complex scenes.",
    },
    {
      title: "Mention Timing",
      description:
        "Terms like 'slow motion', 'timelapse', or 'real-time' can help define the temporal aspect of the video.",
    },
    {
      title: "Include Atmosphere",
      description:
        "Describing weather, time of day, and lighting helps create a more cohesive and realistic atmosphere.",
    },
  ]

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
          Prompt Engineering Guide
        </CardTitle>
        <CardDescription>Craft better prompts for more impressive media with these templates and tips</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="templates">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="templates">Prompt Templates</TabsTrigger>
              <TabsTrigger value="tips">Tips & Tricks</TabsTrigger>
            </TabsList>

            <TabsList>
              <TabsTrigger value="image" onClick={() => setActiveTab("image")}>
                Images
              </TabsTrigger>
              <TabsTrigger value="video" onClick={() => setActiveTab("video")}>
                Videos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="templates">
            <div className="space-y-6">
              {(activeTab === "image" ? imagePromptTemplates : videoPromptTemplates).map((category) => (
                <div key={category.id} className="space-y-3">
                  <h3 className="text-lg font-medium">{category.title}</h3>
                  <p className="text-sm text-gray-500 italic">{category.template}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.examples.map((example) => (
                      <div key={example.id} className="bg-gray-50 p-3 rounded-md border border-gray-200 relative group">
                        <p className="text-sm pr-8">{example.text}</p>
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(example.text, example.id)}
                          >
                            {copied === example.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => onSelectPrompt(example.text)}
                          >
                            <Sparkles className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tips">
            <div className="space-y-4">
              {(activeTab === "image" ? imagePromptTips : videoPromptTips).map((tip, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-md font-medium">{tip.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
