'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EnhancedFileUpload from '@/components/EnhancedFileUpload'

interface TeacherOptions {
  teacherName?: string
  assignmentName?: string
  educationLevel: string
  interactionMode: 'text' | 'voice'
  enableFeedbackBot: boolean
  feedbackCriteria?: any
  voiceSettings?: {
    aiVoice: string
    emotionStyle: string
  }
}

interface FileMetadata {
  name: string
  tokenCount: number
  content: string
}

export default function Home() {
  const router = useRouter()
  const [uploadedContent, setUploadedContent] = useState<{ content: string; tokenCount: number } | null>(null)
  const [uploadedFile, setUploadedFile] = useState<FileMetadata | null>(null)
  const [contextText, setContextText] = useState('')
  const [feedbackFile, setFeedbackFile] = useState<any>(null)
  const [feedbackFileData, setFeedbackFileData] = useState<FileMetadata | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [options, setOptions] = useState<TeacherOptions>({
    educationLevel: 'HBO',
    interactionMode: 'text',
    enableFeedbackBot: false,
    voiceSettings: {
      aiVoice: 'Achird',
      emotionStyle: 'friendly'
    }
  })
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Load saved data from sessionStorage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('learningEnvironmentData')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        
        // Restore all form data
        if (parsed.uploadedFile) {
          setUploadedFile(parsed.uploadedFile)
          setUploadedContent({
            content: parsed.uploadedFile.content,
            tokenCount: parsed.uploadedFile.tokenCount
          })
        }
        
        setContextText(parsed.contextText || '')
        setOptions(parsed.options || {
          educationLevel: 'HBO',
          interactionMode: 'text',
          enableFeedbackBot: false,
          voiceSettings: {
            aiVoice: 'Achird',
            emotionStyle: 'friendly'
          }
        })
        
        if (parsed.feedbackFileData) {
          setFeedbackFileData(parsed.feedbackFileData)
          setFeedbackFile({
            content: parsed.feedbackFileData.content,
            filename: parsed.feedbackFileData.name
          })
        }
        
        setFeedbackText(parsed.feedbackText || '')
      } catch (error) {
        console.error('Error loading saved data:', error)
      }
    }
  }, [])

  // Theme toggle functionality
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleFileUpload = (result: any) => {
    if (result.success && result.content) {
      setUploadedContent({
        content: result.content,
        tokenCount: result.tokenCount
      })
      setUploadedFile({
        name: result.filename || 'Bestand',
        tokenCount: result.tokenCount,
        content: result.content
      })
    } else if (!result.success && !result.content) {
      setUploadedContent(null)
      setUploadedFile(null)
    }
  }

  const handleFeedbackFileUpload = (result: any) => {
    if (result.success && result.content) {
      setFeedbackFile(result)
      setFeedbackFileData({
        name: result.filename || 'Beoordelingskader',
        tokenCount: result.tokenCount,
        content: result.content
      })
    } else if (!result.success && !result.content) {
      setFeedbackFile(null)
      setFeedbackFileData(null)
    }
  }

  const handleGenerateLearningEnvironment = async () => {
    if (!uploadedContent && !contextText.trim()) {
      alert('Upload een bestand of voeg context toe voordat je verder gaat.')
      return
    }

    setIsGenerating(true)
    
    // Store data in sessionStorage for the learning environment
    // This creates a fresh session, resetting any existing chat state
    const sessionData = {
      uploadedContent: uploadedContent?.content || '',
      uploadedFile: uploadedFile,
      contextText,
      options,
      feedbackCriteria: feedbackFile?.content || '',
      feedbackText,
      feedbackFileData: feedbackFileData,
      isTestEnvironment: true,
      // Force fresh start - reset any existing chat state
      chatStarted: false,
      messages: [],
      caseDescription: undefined // Force re-generation
    }
    
    sessionStorage.setItem('learningEnvironmentData', JSON.stringify(sessionData))
    
    // Navigate to learning environment
    router.push('/leeromgeving')
  }

  return (
    <div className="min-h-screen">
      {/* Theme Toggle - Top Left */}
      <div className="fixed left-4 top-4 z-50">
        <button
          onClick={toggleTheme}
          className="floating-btn group relative"
          title={`Schakel naar ${theme === 'dark' ? 'licht' : 'donker'} thema`}
        >
          <span className="text-2xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span className="absolute left-full ml-2 px-2 py-1 bg-card rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
            {theme === 'dark' ? 'Licht thema' : 'Donker thema'}
          </span>
        </button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-hero mb-4">Meta-Vaardigheden</h1>
          <p className="text-subtitle">Leeromgeving Generator</p>
          <p className="text-motto">Creëer gepersonaliseerde leeromgevingen voor vaardigheidstraining</p>
        </div>

        {/* Upload Section */}
        <div className="mb-8 animate-fade-in-up animate-delay-1">
          <h2 className="text-heading text-2xl mb-4">Upload Lesmateriaal</h2>
          <EnhancedFileUpload 
            onFileUpload={handleFileUpload}
            maxTokens={20000}
            initialFile={uploadedFile}
          />
        </div>

        {/* Context Text Area */}
        <div className="mb-8 animate-fade-in-up animate-delay-2">
          <h2 className="text-heading text-2xl mb-4">Context & Toelichting</h2>
          <div className="card">
            <textarea
              className="form-input min-h-[150px] resize-y"
              placeholder="Geef hier aanvullende context of instructies voor de leeromgeving..."
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
            />
          </div>
        </div>

        {/* Options Panel */}
        <div className="mb-8 animate-fade-in-up animate-delay-3">
          <h2 className="text-heading text-2xl mb-4">Instellingen</h2>
          <div className="card space-y-6">
            {/* Teacher and Assignment Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Naam Docent (optioneel)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bijvoorbeeld: Dhr. Jansen"
                  value={options.teacherName || ''}
                  onChange={(e) => setOptions({...options, teacherName: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Naam Opdracht (optioneel)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bijvoorbeeld: Presentatievaardigheden"
                  value={options.assignmentName || ''}
                  onChange={(e) => setOptions({...options, assignmentName: e.target.value})}
                />
              </div>
            </div>

            {/* Education Level */}
            <div>
              <label className="form-label">Onderwijsniveau</label>
              <select
                className="form-input"
                value={options.educationLevel}
                onChange={(e) => setOptions({...options, educationLevel: e.target.value})}
              >
                <option value="PO">Primair Onderwijs (PO)</option>
                <option value="VM">Voortgezet Onderwijs - VMBO</option>
                <option value="VWO">Voortgezet Onderwijs - VWO</option>
                <option value="MBO">Middelbaar Beroepsonderwijs (MBO)</option>
                <option value="HBO">Hoger Beroepsonderwijs (HBO)</option>
                <option value="UNI">Universiteit (WO)</option>
              </select>
            </div>

            {/* Interaction Mode */}
            <div>
              <label className="form-label">Interactiemodus</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="interactionMode"
                    value="text"
                    checked={options.interactionMode === 'text'}
                    onChange={(e) => setOptions({...options, interactionMode: 'text'})}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span className="text-body">Tekst</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="interactionMode"
                    value="voice"
                    checked={options.interactionMode === 'voice'}
                    onChange={(e) => setOptions({...options, interactionMode: 'voice'})}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span className="text-body">Spraak</span>
                </label>
              </div>
            </div>

            {/* Voice Settings */}
            {options.interactionMode === 'voice' && (
              <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                <h3 className="form-label text-lg mb-4">Spraak Instellingen</h3>
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400 mb-1">🎙️ Volledig Spraakgesprek</p>
                  <p className="text-xs text-muted">Student spreekt in microfoon, AI antwoordt met spraak. Geen tekst zichtbaar tijdens gesprek.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">AI Assistent Stem</label>
                    <select
                      className="form-input"
                      value={options.voiceSettings?.aiVoice || 'Achird'}
                      onChange={(e) => setOptions({
                        ...options,
                        voiceSettings: { ...options.voiceSettings!, aiVoice: e.target.value }
                      })}
                    >
                      <option value="Achird">David (Man - Vriendelijk)</option>
                      <option value="Despina">Emma (Vrouw - Professioneel)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Spreekstijl</label>
                    <select
                      className="form-input"
                      value={options.voiceSettings?.emotionStyle || 'friendly'}
                      onChange={(e) => setOptions({
                        ...options,
                        voiceSettings: { ...options.voiceSettings!, emotionStyle: e.target.value }
                      })}
                    >
                      <option value="happy">Vrolijk</option>
                      <option value="sad">Somber</option>
                      <option value="excited">Opgewonden</option>
                      <option value="calm">Kalm</option>
                      <option value="serious">Serieus</option>
                      <option value="dramatic">Dramatisch</option>
                      <option value="friendly">Vriendelijk</option>
                      <option value="formal">Formeel</option>
                      <option value="casual">Ontspannen</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm text-muted">
                    💡 <strong>Tip:</strong> In spraak modus voer je gesprekken door te praten in plaats van te typen. 
                    De AI reageert ook met spraak.
                  </p>
                </div>
              </div>
            )}

            {/* Feedback Bot */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="toggle">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={options.enableFeedbackBot}
                    onChange={(e) => setOptions({...options, enableFeedbackBot: e.target.checked})}
                  />
                  <span className="toggle-slider"></span>
                </div>
                <span className="text-body">Feedbackbot inschakelen</span>
              </label>
              
              {options.enableFeedbackBot && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="form-label">Beoordelingscriteria (tekst)</label>
                    <textarea
                      className="form-input min-h-[120px] resize-y"
                      placeholder="Beschrijf hier de beoordelingscriteria voor de feedbackbot..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Of upload een beoordelingskader</label>
                    <EnhancedFileUpload 
                      onFileUpload={handleFeedbackFileUpload}
                      maxTokens={10000}
                      initialFile={feedbackFileData}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={handleGenerateLearningEnvironment}
            disabled={isGenerating || (!uploadedContent && !contextText.trim())}
            className="btn btn-primary text-lg px-12 py-4"
          >
            {isGenerating ? (
              <>
                <span className="inline-block animate-spin mr-2">⚡</span>
                Leeromgeving wordt gegenereerd...
              </>
            ) : (
              'Genereer Leeromgeving'
            )}
          </button>
        </div>
      </div>

    </div>
  )
}