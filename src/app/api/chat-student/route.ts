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
    const { message, conversationHistory, caseContext } = body

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Build conversation context
    let conversationContext = conversationHistory
      .map((msg: any) => `${msg.role === 'student' ? 'Student' : 'AI-Assistent'}: ${msg.content}`)
      .join('\n\n')

    const prompt = `Je bent een AI-assistent in een educatieve leeromgeving voor het oefenen van vaardigheden.

Context van de casus:
${caseContext.uploadedContent}

Aanvullende instructies:
${caseContext.contextText}

Onderwijsniveau: ${caseContext.educationLevel}

ZEER BELANGRIJK - ROLVERTELING:
- De STUDENT speelt ALTIJD de rol van de lerende (bijv. psychologiestudent, verpleegkundige in opleiding, stagiair)
- JIJ (AI) speelt ALTIJD de rol van degene waarmee de student oefent (bijv. cliënt, patiënt, klant, supervisor, collega)
- De student is NOOIT de cliënt/patiënt - dat ben JIJ
- De student is de professional in opleiding die vaardigheden oefent

Belangrijke instructies:
1. Speel consequent je toegewezen rol (NIET de rol van de student)
2. Reageer natuurlijk en realistisch vanuit jouw rol
3. Stel uitdagende maar faire situaties voor die de student helpen te oefenen
4. Pas je taalgebruik aan op het opgegeven onderwijsniveau
5. Blijf consistent in je rol tijdens het hele gesprek
6. Geef de student ruimte om te oefenen, maar daag hem/haar uit
7. Wees niet te makkelijk of te moeilijk - vind de juiste balans

Gespreksgeschiedenis:
${conversationContext}

Laatste bericht van student: ${message}

Geef een natuurlijke, realistische reactie vanuit JOUW rol (NIET de rol van de student):`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ 
      response: text,
      success: true
    })

  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwerken van je bericht' },
      { status: 500 }
    )
  }
}