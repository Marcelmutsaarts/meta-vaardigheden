import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { caseContext, voiceSettings, welcomeMessage } = await request.json()
    
    // Generate welcome audio using TTS
    const ttsResponse = await fetch(`${request.nextUrl.origin}/api/generate-tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: welcomeMessage || `Welkom! Je gaat nu oefenen met spreekvaardigheid. Laten we beginnen met een gesprek!`,
        voiceName: voiceSettings?.aiVoice || 'Achird',
        style: voiceSettings?.emotionStyle || 'friendly'
      })
    })

    if (!ttsResponse.ok) {
      throw new Error('Welcome TTS generatie gefaald')
    }

    // Return the audio blob
    const audioBuffer = await ttsResponse.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'X-Success': 'true',
        'X-Type': 'welcome-message'
      }
    })

  } catch (error) {
    console.error('Voice welcome API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het genereren van welkomst audio',
        success: false
      },
      { status: 500 }
    )
  }
}