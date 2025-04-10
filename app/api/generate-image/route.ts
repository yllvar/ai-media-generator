import { NextResponse } from "next/server"
import { monitoringService } from "@/lib/monitoring-service"
import { apiDebugger } from "@/lib/api-debugger"

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] Starting image generation request`)

    const { prompt } = await request.json()

    if (!prompt) {
      console.error(`[${requestId}] Missing prompt in request`)
      monitoringService.log("error", "Missing prompt in request")
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Start tracking this request
    monitoringService.trackRequest(requestId, prompt, "image")
    console.log(`[${requestId}] Processing prompt: "${prompt}"`)

    // Log the API endpoint and key status
    const apiKey = process.env.HUGGING_FACE_API_KEY
    console.log(`[${requestId}] Hugging Face API Key present: ${!!apiKey}`)

    if (!apiKey) {
      const errorMsg = "Missing Hugging Face API Key"
      console.error(`[${requestId}] ${errorMsg}`)
      monitoringService.failRequest(requestId, { error: errorMsg })
      return NextResponse.json({ error: errorMsg, requestId }, { status: 500 })
    }

    // STEP 1: Create the prediction
    const createUrl = "https://router.huggingface.co/replicate/v1/predictions"
    const createMethod = "POST"
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }
    const body = {
      input: {
        prompt: prompt,
      },
      version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
    }

    console.log(`[${requestId}] Creating prediction:`, { url: createUrl, method: createMethod, body })

    // Start tracking the API request
    apiDebugger.startRequest(`${requestId}-create`, createUrl, createMethod, headers, body)

    try {
      const createResponse = await fetch(createUrl, {
        method: createMethod,
        headers,
        body: JSON.stringify(body),
      })

      // Capture response headers
      const createHeaders = Object.fromEntries(createResponse.headers.entries())
      console.log(`[${requestId}] Create response status: ${createResponse.status}`)
      console.log(`[${requestId}] Create response headers:`, createHeaders)

      // Get the response as JSON
      const createData = await createResponse.json()
      console.log(`[${requestId}] Create response data:`, createData)

      // Complete the API request tracking
      apiDebugger.completeRequest(`${requestId}-create`, createResponse.status, createHeaders, createData)

      if (!createResponse.ok) {
        const errorMsg = `API error: ${createResponse.status} ${createResponse.statusText}`
        console.error(`[${requestId}] ${errorMsg}`)

        monitoringService.failRequest(requestId, {
          status: createResponse.status,
          statusText: createResponse.statusText,
          headers: createHeaders,
          body: createData,
        })

        return NextResponse.json(
          {
            error: errorMsg,
            details: createData,
            requestId,
            debug: apiDebugger.getDebugInfo(`${requestId}-create`),
          },
          { status: createResponse.status },
        )
      }

      // Check if we have a prediction ID
      if (!createData.id) {
        const errorMsg = "No prediction ID in response"
        console.error(`[${requestId}] ${errorMsg}`)

        monitoringService.failRequest(requestId, {
          error: errorMsg,
          response: createData,
        })

        return NextResponse.json(
          {
            error: errorMsg,
            details: createData,
            requestId,
            debug: apiDebugger.getDebugInfo(`${requestId}-create`),
          },
          { status: 500 },
        )
      }

      const predictionId = createData.id
      console.log(`[${requestId}] Prediction created with ID: ${predictionId}`)
      monitoringService.log("info", `Prediction created with ID: ${predictionId}`, { predictionId })

      // STEP 2: Poll for the prediction result
      const getUrl = `https://router.huggingface.co/replicate/v1/predictions/${predictionId}`
      const getMethod = "GET"

      console.log(`[${requestId}] Polling for prediction result:`, { url: getUrl, method: getMethod })

      // Maximum number of polling attempts
      const maxAttempts = 30
      // Delay between polling attempts (in ms)
      const pollingDelay = 1000

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`[${requestId}] Polling attempt ${attempt}/${maxAttempts}`)

        // Start tracking the API request
        apiDebugger.startRequest(`${requestId}-poll-${attempt}`, getUrl, getMethod, headers)

        const getResponse = await fetch(getUrl, {
          method: getMethod,
          headers,
        })

        // Capture response headers
        const getHeaders = Object.fromEntries(getResponse.headers.entries())
        console.log(`[${requestId}] Poll response status: ${getResponse.status}`)

        // Get the response as JSON
        const getData = await getResponse.json()
        console.log(`[${requestId}] Poll response data:`, getData)

        // Complete the API request tracking
        apiDebugger.completeRequest(`${requestId}-poll-${attempt}`, getResponse.status, getHeaders, getData)

        if (!getResponse.ok) {
          const errorMsg = `API error while polling: ${getResponse.status} ${getResponse.statusText}`
          console.error(`[${requestId}] ${errorMsg}`)

          monitoringService.failRequest(requestId, {
            status: getResponse.status,
            statusText: getResponse.statusText,
            headers: getHeaders,
            body: getData,
          })

          return NextResponse.json(
            {
              error: errorMsg,
              details: getData,
              requestId,
              debug: {
                create: apiDebugger.getDebugInfo(`${requestId}-create`),
                poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
              },
            },
            { status: getResponse.status },
          )
        }

        // Check the status of the prediction
        const status = getData.status

        if (status === "succeeded") {
          console.log(`[${requestId}] Prediction succeeded`)

          // Check if we have output
          if (!getData.output) {
            const errorMsg = "No output in prediction result"
            console.error(`[${requestId}] ${errorMsg}`)

            monitoringService.failRequest(requestId, {
              error: errorMsg,
              response: getData,
            })

            return NextResponse.json(
              {
                error: errorMsg,
                details: getData,
                requestId,
                debug: {
                  create: apiDebugger.getDebugInfo(`${requestId}-create`),
                  poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
                },
              },
              { status: 500 },
            )
          }

          // STEP 3: Get the image from the output URL
          // The output is typically an array of image URLs
          const imageUrl = Array.isArray(getData.output) ? getData.output[0] : getData.output

          if (!imageUrl) {
            const errorMsg = "No image URL in prediction output"
            console.error(`[${requestId}] ${errorMsg}`)

            monitoringService.failRequest(requestId, {
              error: errorMsg,
              response: getData,
            })

            return NextResponse.json(
              {
                error: errorMsg,
                details: getData,
                requestId,
                debug: {
                  create: apiDebugger.getDebugInfo(`${requestId}-create`),
                  poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
                },
              },
              { status: 500 },
            )
          }

          console.log(`[${requestId}] Fetching image from URL: ${imageUrl}`)

          // Start tracking the API request
          apiDebugger.startRequest(`${requestId}-image`, imageUrl, "GET", {})

          try {
            const imageResponse = await fetch(imageUrl)

            // Capture response headers
            const imageHeaders = Object.fromEntries(imageResponse.headers.entries())
            console.log(`[${requestId}] Image response status: ${imageResponse.status}`)
            console.log(`[${requestId}] Image response headers:`, imageHeaders)

            // Complete the API request tracking
            apiDebugger.completeRequest(`${requestId}-image`, imageResponse.status, imageHeaders)

            if (!imageResponse.ok) {
              const errorMsg = `API error while fetching image: ${imageResponse.status} ${imageResponse.statusText}`
              console.error(`[${requestId}] ${errorMsg}`)

              monitoringService.failRequest(requestId, {
                status: imageResponse.status,
                statusText: imageResponse.statusText,
                headers: imageHeaders,
              })

              return NextResponse.json(
                {
                  error: errorMsg,
                  requestId,
                  debug: {
                    create: apiDebugger.getDebugInfo(`${requestId}-create`),
                    poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
                    image: apiDebugger.getDebugInfo(`${requestId}-image`),
                  },
                },
                { status: imageResponse.status },
              )
            }

            // Get the image as a blob
            const imageBlob = await imageResponse.blob()
            console.log(`[${requestId}] Received image blob of type ${imageBlob.type} and size ${imageBlob.size} bytes`)

            if (imageBlob.size === 0) {
              const errorMsg = "Received empty image data"
              console.error(`[${requestId}] ${errorMsg}`)

              monitoringService.failRequest(requestId, { error: errorMsg })

              return NextResponse.json(
                {
                  error: errorMsg,
                  requestId,
                  debug: {
                    create: apiDebugger.getDebugInfo(`${requestId}-create`),
                    poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
                    image: apiDebugger.getDebugInfo(`${requestId}-image`),
                  },
                },
                { status: 500 },
              )
            }

            // Convert the blob to a base64 string to send to the client
            const arrayBuffer = await imageBlob.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const base64Image = buffer.toString("base64")
            const dataUrl = `data:${imageBlob.type || "image/png"};base64,${base64Image}`

            console.log(`[${requestId}] Successfully converted image to base64 (${buffer.length} bytes)`)

            // Mark the request as complete
            monitoringService.completeRequest(requestId, dataUrl, {
              contentType: imageBlob.type,
              size: buffer.length,
              predictionId,
            })

            return NextResponse.json({
              image: dataUrl,
              requestId,
              predictionId,
              debug: {
                create: apiDebugger.getDebugInfo(`${requestId}-create`),
                poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
                image: apiDebugger.getDebugInfo(`${requestId}-image`),
              },
            })
          } catch (imageError) {
            console.error(`[${requestId}] Error fetching image:`, imageError)

            apiDebugger.completeRequest(
              `${requestId}-image`,
              0,
              {},
              null,
              imageError instanceof Error ? imageError.message : String(imageError),
            )

            monitoringService.failRequest(requestId, {
              error: imageError instanceof Error ? imageError.message : String(imageError),
              stack: imageError instanceof Error ? imageError.stack : undefined,
            })

            return NextResponse.json(
              {
                error: "Error fetching image",
                details: imageError instanceof Error ? imageError.message : String(imageError),
                requestId,
                debug: {
                  create: apiDebugger.getDebugInfo(`${requestId}-create`),
                  poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
                  image: apiDebugger.getDebugInfo(`${requestId}-image`),
                },
              },
              { status: 500 },
            )
          }
        } else if (status === "failed") {
          const errorMsg = "Prediction failed"
          console.error(`[${requestId}] ${errorMsg}:`, getData.error)

          monitoringService.failRequest(requestId, {
            error: errorMsg,
            details: getData.error,
            response: getData,
          })

          return NextResponse.json(
            {
              error: errorMsg,
              details: getData.error || getData,
              requestId,
              debug: {
                create: apiDebugger.getDebugInfo(`${requestId}-create`),
                poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
              },
            },
            { status: 500 },
          )
        } else if (status === "canceled") {
          const errorMsg = "Prediction was canceled"
          console.error(`[${requestId}] ${errorMsg}`)

          monitoringService.failRequest(requestId, {
            error: errorMsg,
            response: getData,
          })

          return NextResponse.json(
            {
              error: errorMsg,
              details: getData,
              requestId,
              debug: {
                create: apiDebugger.getDebugInfo(`${requestId}-create`),
                poll: apiDebugger.getDebugInfo(`${requestId}-poll-${attempt}`),
              },
            },
            { status: 500 },
          )
        }

        // If we're still processing, wait before the next attempt
        if (status === "processing" || status === "starting") {
          console.log(`[${requestId}] Prediction status: ${status}, waiting before next poll`)
          await new Promise((resolve) => setTimeout(resolve, pollingDelay))
        }
      }

      // If we've reached the maximum number of attempts, return an error
      const errorMsg = "Prediction timed out"
      console.error(`[${requestId}] ${errorMsg}`)

      monitoringService.failRequest(requestId, {
        error: errorMsg,
      })

      return NextResponse.json(
        {
          error: errorMsg,
          requestId,
          debug: {
            create: apiDebugger.getDebugInfo(`${requestId}-create`),
            poll: apiDebugger.getDebugInfo(`${requestId}-poll-${maxAttempts}`),
          },
        },
        { status: 500 },
      )
    } catch (fetchError) {
      console.error(`[${requestId}] Fetch error:`, fetchError)

      apiDebugger.completeRequest(
        `${requestId}-create`,
        0,
        {},
        null,
        fetchError instanceof Error ? fetchError.message : String(fetchError),
      )

      monitoringService.failRequest(requestId, {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
      })

      return NextResponse.json(
        {
          error: "Network error while contacting Hugging Face API",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
          requestId,
          debug: apiDebugger.getDebugInfo(`${requestId}-create`),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error)

    monitoringService.failRequest(requestId, error)

    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : String(error),
        requestId,
      },
      { status: 500 },
    )
  }
}
