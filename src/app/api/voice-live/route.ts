import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Gemini API key niet geconfigureerd.',
          success: false
        }, 
        { status: 500 }
      )
    }

    // Parse form data (audio + context)
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as File
    const caseContext = formData.get('caseContext') as string
    const voiceSettings = formData.get('voiceSettings') as string
    
    if (!audioBlob) {
      return NextResponse.json(
        { error: 'Geen audio data ontvangen', success: false },
        { status: 400 }
      )
    }

    // Check file size - smaller limit for faster processing
    const maxSize = 10 * 1024 * 1024 // 10MB for faster processing
    if (audioBlob.size > maxSize) {
      return NextResponse.json(
        { 
          error: 'Audio te groot voor snelle verwerking (max 10MB)',
          success: false
        },
        { status: 400 }
      )
    }
    
    console.log(`Processing audio: ${audioBlob.size} bytes, type: ${audioBlob.type}`) // Debug log

    try {
      const startTime = Date.now()
      
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = Buffer.from(arrayBuffer).toString('base64')
      
      const base64Time = Date.now()
      console.log(`Audio to base64: ${base64Time - startTime}ms`)

      // Parse context and settings
      const context = caseContext ? JSON.parse(caseContext) : {}
      const settings = voiceSettings ? JSON.parse(voiceSettings) : {}

      // Use Gemini 2.5 Flash for best balance of speed and quality
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash'
      })

      // Create audio part for Gemini
      const audioPart = {
        inlineData: {
          data: base64Audio,
          mimeType: audioBlob.type || 'audio/webm'
        }
      }

      // Optimized prompt for faster, more concise responses
      const systemPrompt = `Je bent een AI gesprekspartner voor spreekvaardigheid oefening.

INSTRUCTIES:
- Reageer kort en natuurlijk (max 2-3 zinnen)
- Gebruik ${settings.emotionStyle || 'vriendelijke'} toon
- Niveau: ${context.educationLevel || 'universitair'}
- Houd gesprek gaande met korte vragen/reacties

CONTEXT: ${context.uploadedContent || 'Algemeen gesprek'}
${context.contextText || ''}

Geef een korte, natuurlijke reactie die het gesprek voortzet.`

      // Generate text response from audio input
      const geminiStartTime = Date.now()
      const result = await model.generateContent([
        systemPrompt,
        "Reageer kort en natuurlijk:",
        audioPart
      ])

      // Get the response
      const response = await result.response
      
      if (!response) {
        throw new Error('Geen response ontvangen van Gemini')
      }

      // Get text response
      const responseText = response.text()
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Lege response ontvangen van Gemini')
      }

      const geminiEndTime = Date.now()
      console.log(`Gemini processing: ${geminiEndTime - geminiStartTime}ms`)
      console.log('Gemini response text:', responseText)

      // Convert response to speech using TTS
      const ttsStartTime = Date.now()
      const ttsResponse = await fetch(`${request.nextUrl.origin}/api/generate-tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: responseText,
          voiceName: settings.aiVoice || 'Achird',
          style: settings.emotionStyle || 'friendly'
        })
      })

      if (!ttsResponse.ok) {
        const ttsError = await ttsResponse.text()
        console.error('TTS Error:', ttsError)
        throw new Error(`TTS generatie gefaald: ${ttsResponse.status}`)
      }

      // Return the audio blob
      const audioBuffer = await ttsResponse.arrayBuffer()
      
      if (audioBuffer.byteLength === 0) {
        throw new Error('Lege audio response van TTS')
      }
      
      const ttsEndTime = Date.now()
      console.log(`TTS processing: ${ttsEndTime - ttsStartTime}ms`)
      console.log(`Total processing time: ${ttsEndTime - startTime}ms`)
      
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-cache',
          'X-Success': 'true',
          'X-Processing-Time': Date.now().toString(),
          'X-Engine': 'Gemini Live 2.5 Flash Preview'
        }
      })

    } catch (liveError: any) {
      console.error('Gemini Live error:', liveError)
      
      // Handle specific errors
      if (liveError?.message?.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota bereikt. Probeer later opnieuw.', success: false },
          { status: 429 }
        )
      }
      
      if (liveError?.message?.includes('unsupported')) {
        return NextResponse.json(
          { error: 'Audio formaat niet ondersteund door Gemini Live.', success: false },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Fout bij live audio verwerking. Probeer opnieuw.',
          success: false,
          details: liveError?.message
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Voice Live API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij live spraakverwerking',
        success: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}