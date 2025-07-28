'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SessionData {
  uploadedContent: string
  contextText: string
  options: {
    teacherName?: string
    assignmentName?: string
    educationLevel: string
    interactionMode: 'text' | 'voice'
    enableFeedbackBot: boolean
  }
  feedbackCriteria: string
  feedbackText: string
  isTestEnvironment: boolean
  caseDescription?: string
}

interface ChatMessage {
  role: 'student' | 'chatbot' | 'feedback'
  content: string
  timestamp: Date
}

export default function LeeromgevingPage() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatStarted, setChatStarted] = useState(false)
  const [showCaseInfo, setShowCaseInfo] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackHistory, setFeedbackHistory] = useState<ChatMessage[]>([])
  const [caseDescription, setCaseDescription] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load session data
    const data = sessionStorage.getItem('learningEnvironmentData')
    if (data) {
      const parsed = JSON.parse(data)
      setSessionData(parsed)
      
      // Load case description if not already loaded
      if (!parsed.caseDescription) {
        loadCaseDescription(parsed)
      } else {
        setCaseDescription(parsed.caseDescription)
      }
    } else {
      router.push('/')
    }
  }, [router])

  const loadCaseDescription = async (sessionData: SessionData) => {
    try {
      const response = await fetch('/api/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedContent: sessionData.uploadedContent,
          contextText: sessionData.contextText,
          educationLevel: sessionData.options.educationLevel
        })
      })

      const data = await response.json()
      setCaseDescription(data.caseDescription)
      
      // Update sessionStorage with the case description
      const updatedSessionData = { ...sessionData, caseDescription: data.caseDescription }
      sessionStorage.setItem('learningEnvironmentData', JSON.stringify(updatedSessionData))
      setSessionData(updatedSessionData)
    } catch (error) {
      console.error('Error loading case description:', error)
      setCaseDescription('Er is een fout opgetreden bij het laden van de casuïstiek toelichting.')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startChat = async () => {
    if (!sessionData) return
    
    setChatStarted(true)
    setIsLoading(true)

    try {
      // Get welcome message (case description should already be loaded)
      const response = await fetch('/api/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedContent: sessionData.uploadedContent,
          contextText: sessionData.contextText,
          educationLevel: sessionData.options.educationLevel
        })
      })

      const data = await response.json()
      
      // Add welcome message from chatbot
      setMessages([{
        role: 'chatbot',
        content: data.welcomeMessage || `Welkom! Je gaat nu oefenen met ${sessionData.options.assignmentName || 'deze vaardigheid'}. Laten we beginnen!`,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Error starting chat:', error)
      setMessages([{
        role: 'chatbot',
        content: 'Er is een fout opgetreden bij het starten van de chat. Probeer het opnieuw.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !sessionData) return

    const userMessage: ChatMessage = {
      role: 'student',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: messages,
          caseContext: {
            uploadedContent: sessionData.uploadedContent,
            contextText: sessionData.contextText,
            educationLevel: sessionData.options.educationLevel
          }
        })
      })

      const data = await response.json()
      
      setMessages(prev => [...prev, {
        role: 'chatbot',
        content: data.response,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'chatbot',
        content: 'Er is een fout opgetreden. Probeer het opnieuw.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const requestFeedback = async () => {
    if (!sessionData || messages.length === 0) return
    
    setShowFeedback(true)
    const feedbackLoading: ChatMessage = {
      role: 'feedback',
      content: 'Feedback wordt gegenereerd...',
      timestamp: new Date()
    }
    setFeedbackHistory(prev => [...prev, feedbackLoading])

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: messages,
          feedbackCriteria: sessionData.feedbackCriteria,
          feedbackText: sessionData.feedbackText,
          caseContext: {
            uploadedContent: sessionData.uploadedContent,
            contextText: sessionData.contextText,
            educationLevel: sessionData.options.educationLevel
          }
        })
      })

      const data = await response.json()
      
      setFeedbackHistory(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'feedback',
          content: data.feedback,
          timestamp: new Date()
        }
        return updated
      })
    } catch (error) {
      console.error('Error getting feedback:', error)
      setFeedbackHistory(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'feedback',
          content: 'Er is een fout opgetreden bij het genereren van feedback.',
          timestamp: new Date()
        }
        return updated
      })
    }
  }

  const makeDefinitive = () => {
    if (sessionData) {
      const updatedData = { ...sessionData, isTestEnvironment: false }
      setSessionData(updatedData)
      sessionStorage.setItem('learningEnvironmentData', JSON.stringify(updatedData))
    }
  }

  const goBackToEdit = () => {
    router.push('/')
  }

  if (!sessionData) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin text-4xl">⚡</div>
    </div>
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Floating Actions */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
        <button
          onClick={() => setShowCaseInfo(true)}
          className="floating-btn group relative"
          title="Casuïstiek Toelichting"
        >
          <span className="text-2xl">📋</span>
          <span className="absolute left-full ml-2 px-2 py-1 bg-card rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
            Casuïstiek
          </span>
        </button>
        
        <button
          className="floating-btn opacity-50 cursor-not-allowed"
          title="Dark/Light Mode (komt binnenkort)"
          disabled
        >
          <span className="text-2xl">🌙</span>
        </button>
        
        {sessionData.isTestEnvironment && (
          <>
            <button
              onClick={makeDefinitive}
              className="floating-btn group relative"
              title="Definitief maken"
            >
              <span className="text-2xl">✅</span>
              <span className="absolute left-full ml-2 px-2 py-1 bg-card rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
                Definitief maken
              </span>
            </button>
            
            <button
              onClick={goBackToEdit}
              className="floating-btn group relative"
              title="Bewerken"
            >
              <span className="text-2xl">✏️</span>
              <span className="absolute left-full ml-2 px-2 py-1 bg-card rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
                Bewerken
              </span>
            </button>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          {sessionData.isTestEnvironment && (
            <div className="inline-block px-4 py-2 mb-4 rounded-full" 
                 style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <span className="text-sm" style={{ color: 'var(--color-warning)' }}>🔬 TESTLEEROMGEVING</span>
            </div>
          )}
          {(sessionData.options.teacherName || sessionData.options.assignmentName) && (
            <div className="text-center mb-4 p-3 rounded-lg" 
                 style={{ backgroundColor: 'rgba(162, 93, 248, 0.05)', border: '1px solid rgba(162, 93, 248, 0.1)' }}>
              {sessionData.options.teacherName && (
                <div className="text-sm text-muted">Docent: <span className="text-body">{sessionData.options.teacherName}</span></div>
              )}
              {sessionData.options.assignmentName && (
                <div className="text-sm text-muted">Opdracht: <span className="text-body">{sessionData.options.assignmentName}</span></div>
              )}
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="card" style={{ minHeight: '70vh' }}>
          {/* Role Indicators */}
          <div className="flex justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" 
                 style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm">Student</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                 style={{ backgroundColor: 'rgba(162, 93, 248, 0.1)', border: '1px solid rgba(162, 93, 248, 0.3)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></span>
              <span className="text-sm">AI Assistent</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4" style={{ maxHeight: '50vh' }}>
            {!chatStarted ? (
              <div className="flex flex-col items-center justify-center h-full">
                <button
                  onClick={startChat}
                  className="btn btn-primary text-xl px-8 py-4"
                  disabled={isLoading}
                >
                  {isLoading ? 'Laden...' : 'Start Gesprek'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-lg ${
                      msg.role === 'student' 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-accent/10 border border-accent/30'
                    }`}>
                      <p className="text-body whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-xs text-muted mt-2 block">
                        {msg.timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-accent/10 border border-accent/30 p-4 rounded-lg">
                      <div className="flex gap-2">
                        <span className="animate-bounce">•</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {chatStarted && (
            <div className="flex gap-3">
              <input
                type="text"
                className="form-input flex-1"
                placeholder="Type je bericht..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="btn btn-primary"
              >
                Verstuur
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Feedback Button */}
      {sessionData.options.enableFeedbackBot && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
          <button
            onClick={requestFeedback}
            className="floating-btn group relative"
            title="Vraag feedback"
          >
            <span className="text-2xl">💬</span>
            <span className="absolute right-full mr-2 px-2 py-1 bg-card rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm">
              Feedback
            </span>
          </button>
        </div>
      )}

      {/* Case Info Modal */}
      {showCaseInfo && (
        <div className="modal-overlay" onClick={() => setShowCaseInfo(false)}>
          <div className="modal-content p-8 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-heading text-2xl">Casuïstiek Toelichting</h2>
              <button
                onClick={() => setShowCaseInfo(false)}
                className="text-muted hover:text-body transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="text-body">
              <p className="whitespace-pre-wrap">{caseDescription || 'De casuïstiek wordt geladen...'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Panel */}
      {showFeedback && (
        <div className="fixed right-0 top-0 h-full w-96 bg-card border-l border-accent/30 shadow-xl z-40 flex flex-col">
          <div className="p-6 border-b border-accent/30 flex justify-between items-center">
            <h2 className="text-heading text-xl">Feedback</h2>
            <button
              onClick={() => setShowFeedback(false)}
              className="text-muted hover:text-body transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {feedbackHistory.map((feedback, idx) => (
                <div key={idx} className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                  <p className="text-body whitespace-pre-wrap">{feedback.content}</p>
                  <span className="text-xs text-muted mt-2 block">
                    {feedback.timestamp.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-accent/30">
            <button
              onClick={requestFeedback}
              className="btn btn-secondary w-full"
            >
              Nieuwe Feedback Aanvragen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}