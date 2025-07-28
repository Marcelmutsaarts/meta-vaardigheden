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
    const { uploadedContent, contextText, educationLevel } = body

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `Je bent een expert in het creëren van educatieve leeromgevingen. Analyseer de volgende informatie en creëer een casuïstiek voor een vaardigheidsoefeninig.

Geüpload materiaal:
${uploadedContent}

Aanvullende context:
${contextText}

Onderwijsniveau: ${educationLevel}

ZEER BELANGRIJK: De student speelt ALTIJD de rol van de lerende (bijv. psychologiestudent, verpleegkundige in opleiding, stagiair, etc.). De AI-assistent speelt NOOIT de rol van de student/lerende, maar altijd de rol van degene waarmee de student moet oefenen (bijv. cliënt, patiënt, klant, collega, supervisor).

Taak:
1. Analyseer het materiaal en bepaal welke vaardigheid geoefend moet worden
2. Bepaal de ROL VAN DE STUDENT (bijv. psychologiestudent, verpleegkundige, stagiair)
3. Bepaal een relevante rol voor de AI-assistent waarmee de student moet oefenen (bijv. cliënt, patiënt, klant, opdrachtgever)
4. Creëer een realistische context/scenario voor de oefening waarin de student de vaardigheid kan oefenen
5. Genereer een casusbeschrijving (max 200 woorden) die duidelijk maakt welke rol de student heeft en met wie hij/zij gaat oefenen
6. Maak een welkomstbericht voor de chatbot waarin duidelijk wordt wie de AI speelt

Geef je antwoord in het volgende JSON formaat:
{
  "skill": "naam van de vaardigheid",
  "studentRole": "rol van de student/lerende",
  "aiRole": "rol van de AI-assistent",
  "scenario": "korte beschrijving van het scenario",
  "caseDescription": "uitgebreide casusbeschrijving voor de student",
  "welcomeMessage": "welkomstbericht van de chatbot om het gesprek te starten"
}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
      } catch (e) {
        console.error('JSON parse error:', e)
      }
    }

    // Fallback response
    return NextResponse.json({
      skill: "Algemene communicatievaardigheden",
      studentRole: "Student",
      aiRole: "Gesprekspartner",
      scenario: "Een oefensituatie voor het ontwikkelen van vaardigheden",
      caseDescription: "In deze leeromgeving ga je oefenen met de vaardigheden die in het materiaal beschreven staan. Jij speelt de rol van de student en de AI-assistent speelt een relevante rol om je optimaal te laten oefenen.",
      welcomeMessage: "Welkom! Laten we beginnen met oefenen. Ik ben hier om je te helpen bij het ontwikkelen van je vaardigheden. Hoe kan ik je vandaag helpen?"
    })

  } catch (error) {
    console.error('Error analyzing case:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het analyseren van de casus' },
      { status: 500 }
    )
  }
}