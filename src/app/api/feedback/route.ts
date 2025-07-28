import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API configuratie ontbreekt.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { conversationHistory, feedbackCriteria, feedbackText, caseContext } = body

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Build conversation context
    let conversationContext = conversationHistory
      .map((msg: any) => `${msg.role === 'student' ? 'Student' : 'AI-Assistent'}: ${msg.content}`)
      .join('\n\n')

    const prompt = `Je bent een ervaren onderwijskundige feedbackbot die constructieve feedback geeft op vaardigheidsoefeningen.

Context van de oefening:
${caseContext.uploadedContent}

Aanvullende context:
${caseContext.contextText}

Onderwijsniveau: ${caseContext.educationLevel}

${feedbackText ? `Beoordelingscriteria (tekst):
${feedbackText}` : ''}

${feedbackCriteria ? `Beoordelingscriteria (upload):
${feedbackCriteria}` : ''}

Het gevoerde gesprek:
${conversationContext}

Taak:
1. Analyseer het gesprek tussen de student en de AI-assistent
2. Identificeer sterke punten in de aanpak van de student
3. Identificeer verbeterpunten en gemiste kansen
4. Geef concrete, constructieve feedback gericht op het onderwijsniveau
5. Eindig met één concrete tip voor verbetering

Structuur je feedback als volgt:
- Begin met een positief punt
- Bespreek 2-3 specifieke observaties uit het gesprek
- Geef concrete suggesties voor verbetering
- Sluit af met een motiverende tip

Houd de feedback beknopt (max 250 woorden) en constructief.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ 
      feedback: text,
      success: true
    })

  } catch (error) {
    console.error('Error generating feedback:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van feedback' },
      { status: 500 }
    )
  }
}