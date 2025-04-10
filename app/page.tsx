import MediaGenerator from "@/components/media-generator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">AI Media Generation</h1>
        <p className="text-center text-gray-500 mb-8">Generate images and videos with AI using text prompts</p>
        <MediaGenerator />
      </div>
    </main>
  )
}
