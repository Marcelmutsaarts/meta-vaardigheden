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

    // Parse form data
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as File
    
    if (!audioBlob) {
      return NextResponse.json(
        { error: 'Geen audio data ontvangen', success: false },
        { status: 400 }
      )
    }

    // Check file size - limit for real-time processing
    const maxSize = 10 * 1024 * 1024 // 10MB for real-time
    if (audioBlob.size > maxSize) {
      return NextResponse.json(
        { 
          error: 'Audio te groot voor real-time verwerking (max 10MB)',
          success: false
        },
        { status: 400 }
      )
    }

    try {
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = Buffer.from(arrayBuffer).toString('base64')

      // Initialize Gemini model
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      // Validate and normalize MIME type for Gemini
      let mimeType = audioBlob.type || 'audio/webm'
      
      // Map common formats to supported ones
      const supportedFormats = ['audio/wav', 'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/flac']
      if (!supportedFormats.some(format => mimeType.startsWith(format))) {
        console.log(`Converting unsupported format ${mimeType} to audio/webm`)
        mimeType = 'audio/webm'
      }

      // Create audio part for Gemini
      const audioPart = {
        inlineData: {
          data: base64Audio,
          mimeType: mimeType
        }
      }

      // Enhanced prompt for better conversation transcription
      const prompt = `Transcribeer deze gesproken audio naar Nederlandse tekst. Focus op natuurlijke gesproken taal en context van een educatief gesprek. Geef alleen de getranscribeerde tekst terug, geen extra uitleg of commentaar.`
      
      const result = await model.generateContent([prompt, audioPart])
      const response = await result.response
      const transcription = response.text().trim()

      return NextResponse.json({
        success: true,
        transcription: transcription,
        audioSize: audioBlob.size,
        processingTime: Date.now(),
        engine: 'Gemini 2.5 Flash'
      })

    } catch (transcriptionError: any) {
      console.error('Voice transcription error:', transcriptionError)
      
      // Handle specific errors
      if (transcriptionError?.message?.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota bereikt. Probeer later opnieuw.', success: false },
          { status: 429 }
        )
      }
      
      if (transcriptionError?.message?.includes('unsupported')) {
        return NextResponse.json(
          { error: 'Audio formaat niet ondersteund.', success: false },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Fout bij spraakherkenning. Probeer opnieuw.',
          success: false,
          details: transcriptionError?.message
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Voice transcribe API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij spraakverwerking',
        success: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}