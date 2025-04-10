import { NextResponse } from "next/server"
import { monitoringService } from "@/lib/monitoring-service"
import { apiDebugger } from "@/lib/api-debugger"
import { InferenceClient } from "@huggingface/inference"

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] Starting video generation request`)

    const { prompt } = await request.json()

    if (!prompt) {
      console.error(`[${requestId}] Missing prompt in request`)
      monitoringService.log("error", "Missing prompt in request")
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Start tracking this request
    monitoringService.trackRequest(requestId, prompt, "video")
    console.log(`[${requestId}] Processing prompt for video: "${prompt}"`)

    // Log the API endpoint and key status
    const apiKey = process.env.HUGGING_FACE_API_KEY
    console.log(`[${requestId}] Hugging Face API Key present: ${!!apiKey}`)

    if (!apiKey) {
      const errorMsg = "Missing Hugging Face API Key"
      console.error(`[${requestId}] ${errorMsg}`)
      monitoringService.failRequest(requestId, { error: errorMsg })
      return NextResponse.json({ error: errorMsg, requestId }, { status: 500 })
    }

    // Create Hugging Face Inference client
    const client = new InferenceClient(apiKey)

    // Start tracking the API request
    apiDebugger.startRequest(
      requestId,
      "https://api-inference.huggingface.co/models/Lightricks/LTX-Video",
      "POST",
      { Authorization: `Bearer ${apiKey}` },
      { inputs: prompt },
    )

    try {
      console.log(`[${requestId}] Calling Hugging Face Inference API for video generation`)

      // Call the Hugging Face Inference API
      const videoBlob = await client.textToVideo({
        provider: "fal-ai",
        model: "Lightricks/LTX-Video",
        inputs: prompt,
      })

      console.log(`[${requestId}] Received video blob of type ${videoBlob.type} and size ${videoBlob.size} bytes`)

      // Complete the API request tracking with success
      apiDebugger.completeRequest(requestId, 200, { "Content-Type": videoBlob.type }, { size: videoBlob.size })

      if (videoBlob.size === 0) {
        const errorMsg = "Received empty video data"
        console.error(`[${requestId}] ${errorMsg}`)
        monitoringService.failRequest(requestId, { error: errorMsg })
        return NextResponse.json({ error: errorMsg, requestId }, { status: 500 })
      }

      // Convert the blob to a base64 string to send to the client
      const arrayBuffer = await videoBlob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64Video = buffer.toString("base64")
      const dataUrl = `data:${videoBlob.type || "video/mp4"};base64,${base64Video}`

      console.log(`[${requestId}] Successfully converted video to base64 (${buffer.length} bytes)`)

      // Mark the request as complete
      monitoringService.completeRequest(requestId, dataUrl, {
        contentType: videoBlob.type,
        size: buffer.length,
      })

      return NextResponse.json({
        video: dataUrl,
        requestId,
        debug: apiDebugger.getDebugInfo(requestId),
      })
    } catch (apiError: any) {
      console.error(`[${requestId}] API error:`, apiError)

      // Check if the error is a response object
      if (apiError.response) {
        const errorStatus = apiError.response.status || 500
        const errorHeaders = apiError.response.headers ? Object.fromEntries(apiError.response.headers.entries()) : {}
        let errorBody

        try {
          errorBody = await apiError.response.json()
        } catch (e) {
          try {
            errorBody = await apiError.response.text()
          } catch (e2) {
            errorBody = "Could not parse error response"
          }
        }

        apiDebugger.completeRequest(requestId, errorStatus, errorHeaders, errorBody)

        monitoringService.failRequest(requestId, {
          status: errorStatus,
          body: errorBody,
        })

        return NextResponse.json(
          {
            error: `API error: ${errorStatus}`,
            details: errorBody,
            requestId,
            debug: apiDebugger.getDebugInfo(requestId),
          },
          { status: errorStatus },
        )
      }

      // Handle non-response errors
      apiDebugger.completeRequest(
        requestId,
        500,
        {},
        null,
        apiError instanceof Error ? apiError.message : String(apiError),
      )

      monitoringService.failRequest(requestId, {
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
      })

      return NextResponse.json(
        {
          error: "Error generating video",
          details: apiError instanceof Error ? apiError.message : String(apiError),
          requestId,
          debug: apiDebugger.getDebugInfo(requestId),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error)

    monitoringService.failRequest(requestId, error)

    return NextResponse.json(
      {
        error: "Failed to generate video",
        details: error instanceof Error ? error.message : String(error),
        requestId,
      },
      { status: 500 },
    )
  }
}
