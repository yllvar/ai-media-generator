import { NextResponse } from "next/server"
import { apiDebugger } from "@/lib/api-debugger"

export async function GET() {
  const requestId = crypto.randomUUID()

  try {
    console.log("Testing Hugging Face API connection")

    // Check if API key is present
    const apiKey = process.env.HUGGING_FACE_API_KEY
    if (!apiKey) {
      console.error("Missing Hugging Face API Key")
      return NextResponse.json(
        {
          success: false,
          error: "Missing Hugging Face API Key",
        },
        { status: 500 },
      )
    }

    // First test the Hugging Face API directly
    const hfUrl = "https://huggingface.co/api/whoami"
    console.log(`Testing direct Hugging Face API connection: ${hfUrl}`)

    apiDebugger.startRequest(`hf-${requestId}`, hfUrl, "GET", { Authorization: `Bearer ${apiKey}` })

    try {
      const hfResponse = await fetch(hfUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      const hfHeaders = Object.fromEntries(hfResponse.headers.entries())
      let hfData

      try {
        hfData = await hfResponse.json()
      } catch (e) {
        hfData = await hfResponse.text()
      }

      apiDebugger.completeRequest(`hf-${requestId}`, hfResponse.status, hfHeaders, hfData)

      console.log("Hugging Face API direct test response:", {
        status: hfResponse.status,
        data: hfData,
      })

      if (!hfResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            stage: "huggingface-api",
            status: hfResponse.status,
            error: hfData,
            debug: {
              direct: apiDebugger.getDebugInfo(`hf-${requestId}`),
            },
          },
          { status: hfResponse.status },
        )
      }
    } catch (error) {
      apiDebugger.completeRequest(
        `hf-${requestId}`,
        0,
        {},
        null,
        error instanceof Error ? error.message : String(error),
      )

      console.error("Error testing direct Hugging Face API connection:", error)

      return NextResponse.json(
        {
          success: false,
          stage: "huggingface-api",
          error: error instanceof Error ? error.message : String(error),
          debug: {
            direct: apiDebugger.getDebugInfo(`hf-${requestId}`),
          },
        },
        { status: 500 },
      )
    }

    // Now test the Hugging Face router specifically
    const routerUrl = "https://router.huggingface.co/health"
    console.log(`Testing Hugging Face router connection: ${routerUrl}`)

    apiDebugger.startRequest(`router-${requestId}`, routerUrl, "GET", { Authorization: `Bearer ${apiKey}` })

    try {
      const routerResponse = await fetch(routerUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      const routerHeaders = Object.fromEntries(routerResponse.headers.entries())
      let routerData

      try {
        routerData = await routerResponse.json()
      } catch (e) {
        routerData = await routerResponse.text()
      }

      apiDebugger.completeRequest(`router-${requestId}`, routerResponse.status, routerHeaders, routerData)

      console.log("Hugging Face router test response:", {
        status: routerResponse.status,
        data: routerData,
      })

      if (!routerResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            stage: "router",
            status: routerResponse.status,
            error: routerData,
            debug: {
              direct: apiDebugger.getDebugInfo(`hf-${requestId}`),
              router: apiDebugger.getDebugInfo(`router-${requestId}`),
            },
          },
          { status: routerResponse.status },
        )
      }
    } catch (error) {
      apiDebugger.completeRequest(
        `router-${requestId}`,
        0,
        {},
        null,
        error instanceof Error ? error.message : String(error),
      )

      console.error("Error testing Hugging Face router connection:", error)

      return NextResponse.json(
        {
          success: false,
          stage: "router",
          error: error instanceof Error ? error.message : String(error),
          debug: {
            direct: apiDebugger.getDebugInfo(`hf-${requestId}`),
            router: apiDebugger.getDebugInfo(`router-${requestId}`),
          },
        },
        { status: 500 },
      )
    }

    // Finally, test a simple request to the Replicate endpoint
    const replicateUrl = "https://router.huggingface.co/replicate/v1/models"
    console.log(`Testing Replicate endpoint: ${replicateUrl}`)

    apiDebugger.startRequest(`replicate-${requestId}`, replicateUrl, "GET", { Authorization: `Bearer ${apiKey}` })

    try {
      const replicateResponse = await fetch(replicateUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      const replicateHeaders = Object.fromEntries(replicateResponse.headers.entries())
      let replicateData

      try {
        replicateData = await replicateResponse.json()
      } catch (e) {
        replicateData = await replicateResponse.text()
      }

      apiDebugger.completeRequest(`replicate-${requestId}`, replicateResponse.status, replicateHeaders, replicateData)

      console.log("Replicate endpoint test response:", {
        status: replicateResponse.status,
        data: replicateData,
      })

      if (!replicateResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            stage: "replicate",
            status: replicateResponse.status,
            error: replicateData,
            debug: {
              direct: apiDebugger.getDebugInfo(`hf-${requestId}`),
              router: apiDebugger.getDebugInfo(`router-${requestId}`),
              replicate: apiDebugger.getDebugInfo(`replicate-${requestId}`),
            },
          },
          { status: replicateResponse.status },
        )
      }

      // All tests passed
      return NextResponse.json({
        success: true,
        message: "Successfully connected to all Hugging Face API endpoints",
        debug: {
          direct: apiDebugger.getDebugInfo(`hf-${requestId}`),
          router: apiDebugger.getDebugInfo(`router-${requestId}`),
          replicate: apiDebugger.getDebugInfo(`replicate-${requestId}`),
        },
      })
    } catch (error) {
      apiDebugger.completeRequest(
        `replicate-${requestId}`,
        0,
        {},
        null,
        error instanceof Error ? error.message : String(error),
      )

      console.error("Error testing Replicate endpoint:", error)

      return NextResponse.json(
        {
          success: false,
          stage: "replicate",
          error: error instanceof Error ? error.message : String(error),
          debug: {
            direct: apiDebugger.getDebugInfo(`hf-${requestId}`),
            router: apiDebugger.getDebugInfo(`router-${requestId}`),
            replicate: apiDebugger.getDebugInfo(`replicate-${requestId}`),
          },
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in connection test:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
