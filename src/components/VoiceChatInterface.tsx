'use client'

import React, { useState, useEffect, useRef } from 'react'
import useVoiceConversationManager from './VoiceConversationManager'
import VoiceAudioPlayer from './VoiceAudioPlayer'

interface VoiceMessage {
  id: string
  role: 'student' | 'chatbot'
  content: string
  audioUrl?: string
  timestamp: Date
  isPlaying?: boolean
}

interface VoiceChatInterfaceProps {
  sessionData: any
  chatStarted: boolean
  onStartChat: () => void
  isLoading: boolean
}

export default function VoiceChatInterface({ 
  sessionData, 
  chatStarted, 
  onStartChat, 
  isLoading 
}: VoiceChatInterfaceProps) {
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([])
  const [showPermissionHelp, setShowPermissionHelp] = useState(false)
  const [isPlayingWelcome, setIsPlayingWelcome] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [voiceMessages])

  // Handle new voice messages
  const handleNewMessage = (message: VoiceMessage) => {
    setVoiceMessages(prev => [...prev, message])
  }

  // Play welcome message when chat starts
  const playWelcomeMessage = async (sessionData: any) => {
    try {
      setIsPlayingWelcome(true)
      
      // Get welcome message from analyze-case API (same as text mode)
      const analyzeResponse = await fetch('/api/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedContent: sessionData.uploadedContent,
          contextText: sessionData.contextText,
          educationLevel: sessionData.options.educationLevel
        })
      })

      const analyzeData = await analyzeResponse.json()
      const welcomeText = analyzeData.welcomeMessage || `Welkom! Je gaat nu oefenen met ${sessionData.options.assignmentName || 'deze vaardigheid'}. Laten we beginnen!`

      // Generate welcome audio
      const welcomeResponse = await fetch('/api/voice-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcomeMessage: welcomeText,
          voiceSettings: sessionData.options.voiceSettings,
          caseContext: {
            uploadedContent: sessionData.uploadedContent,
            contextText: sessionData.contextText,
            educationLevel: sessionData.options.educationLevel
          }
        })
      })

      if (!welcomeResponse.ok) {
        throw new Error('Welcome audio generation failed')
      }

      // Play welcome audio
      const audioBuffer = await welcomeResponse.arrayBuffer()
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      welcomeAudioRef.current = audio

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          setIsPlayingWelcome(false)
          resolve()
        }
        
        audio.onerror = () => {
          setIsPlayingWelcome(false)
          console.warn('Welcome audio playback failed')
          resolve() // Continue even if welcome fails
        }
        
        audio.play().catch(() => {
          setIsPlayingWelcome(false)
          resolve() // Continue even if autoplay is blocked
        })
      })

      // Add welcome message to chat (for visual reference)
      const welcomeMessage: VoiceMessage = {
        id: Date.now().toString(),
        role: 'chatbot',
        content: '[Welkomstboodschap afgespeeld]',
        audioUrl,
        timestamp: new Date()
      }
      handleNewMessage(welcomeMessage)

    } catch (error) {
      console.error('Error playing welcome message:', error)
      setIsPlayingWelcome(false)
      // Continue anyway - don't block the voice interface
    }
  }

  // Get conversation manager hook
  const voiceManager = useVoiceConversationManager({
    sessionData,
    onNewMessage: handleNewMessage
  })

  const getMainButtonText = () => {
    switch (voiceManager.conversationState) {
      case 'listening':
        return 'Stop Spreken'
      case 'processing':
        return 'Verwerken...'
      case 'speaking':
        return 'AI Spreekt...'
      case 'error':
        return 'Probeer Opnieuw'
      default:
        return chatStarted ? 'Druk om te Spreken' : 'Start Gesprek'
    }
  }

  const getMainButtonIcon = () => {
    switch (voiceManager.conversationState) {
      case 'listening':
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        )
      case 'processing':
        return (
          <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'speaking':
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
          </svg>
        )
      case 'error':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )
    }
  }

  const handleMainButtonClick = async () => {
    if (!chatStarted) {
      onStartChat()
      // Play welcome message after starting chat
      if (sessionData) {
        await playWelcomeMessage(sessionData)
      }
    } else {
      voiceManager.toggleRecording()
    }
  }

  return (
    <div className="voice-chat-interface h-full flex flex-col">
      {/* Speaking Indicators - Mobile Responsive */}
      <div className="flex justify-center gap-2 sm:gap-8 mb-6 px-2">
        <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-xs sm:text-sm ${
          voiceManager.currentSpeaker === 'student' 
            ? 'bg-green-500/20 border-2 border-green-500 animate-pulse scale-110' 
            : 'bg-green-500/10 border border-green-500/30'
        }`}>
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
            voiceManager.currentSpeaker === 'student' 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-green-500/50'
          }`} />
          <span className="font-medium">Student</span>
          {voiceManager.currentSpeaker === 'student' && (
            <div className="flex gap-0.5 sm:gap-1">
              <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-green-500 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="w-0.5 sm:w-1 h-4 sm:h-5 bg-green-500 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-xs sm:text-sm ${
          voiceManager.currentSpeaker === 'chatbot' 
            ? 'bg-accent/20 border-2 animate-pulse scale-110' 
            : 'bg-accent/10 border border-accent/30'
        }`} style={{ borderColor: voiceManager.currentSpeaker === 'chatbot' ? 'var(--accent)' : undefined }}>
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
            voiceManager.currentSpeaker === 'chatbot' 
              ? 'animate-pulse' 
              : ''
          }`} style={{ 
            backgroundColor: voiceManager.currentSpeaker === 'chatbot' 
              ? 'var(--accent)' 
              : 'rgba(162, 93, 248, 0.5)' 
          }} />
          <span className="font-medium">AI Assistent</span>
          {voiceManager.currentSpeaker === 'chatbot' && (
            <div className="flex gap-0.5 sm:gap-1">
              <div className="w-0.5 sm:w-1 h-3 sm:h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '0ms' }} />
              <div className="w-0.5 sm:w-1 h-2 sm:h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '100ms' }} />
              <div className="w-0.5 sm:w-1 h-4 sm:h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '200ms' }} />
            </div>
          )}
        </div>
      </div>

      {/* Conversation Status Area - Pure Voice Mode */}
      <div className="flex-1 overflow-y-auto mb-6 px-2 sm:px-0 flex flex-col justify-center" 
           style={{ 
             maxHeight: '50vh',
             WebkitOverflowScrolling: 'touch'
           }}>
        {!chatStarted ? (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-2xl">🎙️</span>
              </div>
              <h3 className="text-heading text-lg mb-2">Spraakgesprek Modus</h3>
              <p className="text-muted text-sm">Voer een volledig spraakgesprek met de AI</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            {/* Conversation Progress Indicator */}
            <div className="mb-6">
              <div className="text-sm text-muted mb-2">Gesprek Actief</div>
              <div className="flex justify-center items-center gap-2">
                {[...Array(Math.max(1, voiceMessages.length))].map((_, i) => (
                  <div 
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: i < voiceMessages.length ? 'var(--accent)' : 'rgba(162, 93, 248, 0.3)' 
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Current State Description */}
            <div className="text-center">
              {isPlayingWelcome && (
                <div className="space-y-2">
                  <p className="text-accent text-sm font-medium">🎙️ Welkomstboodschap...</p>
                  <div className="flex justify-center gap-1">
                    <div className="w-1 h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '0ms' }} />
                    <div className="w-1 h-7 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '100ms' }} />
                    <div className="w-1 h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '200ms' }} />
                    <div className="w-1 h-6 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '300ms' }} />
                    <div className="w-1 h-8 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
              {!isPlayingWelcome && voiceManager.conversationState === 'idle' && (
                <p className="text-muted text-sm">🎯 Klaar voor volgende vraag</p>
              )}
              {voiceManager.conversationState === 'listening' && (
                <div className="space-y-2">
                  <p className="text-green-400 text-sm font-medium">🎙️ Aan het luisteren...</p>
                  <div className="flex justify-center gap-1">
                    <div className="w-1 h-6 bg-green-500 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-4 bg-green-500 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-1 h-8 bg-green-500 rounded animate-pulse" style={{ animationDelay: '400ms' }} />
                    <div className="w-1 h-5 bg-green-500 rounded animate-pulse" style={{ animationDelay: '600ms' }} />
                    <div className="w-1 h-7 bg-green-500 rounded animate-pulse" style={{ animationDelay: '800ms' }} />
                  </div>
                </div>
              )}
              {voiceManager.conversationState === 'processing' && (
                <div className="space-y-2">
                  <p className="text-blue-400 text-sm font-medium">🤖 AI denkt na...</p>
                  <div className="animate-spin w-6 h-6 mx-auto border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              )}
              {voiceManager.conversationState === 'speaking' && (
                <div className="space-y-2">
                  <p className="text-accent text-sm font-medium">🔊 AI spreekt...</p>
                  <div className="flex justify-center gap-1">
                    <div className="w-1 h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '0ms' }} />
                    <div className="w-1 h-7 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '100ms' }} />
                    <div className="w-1 h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '200ms' }} />
                    <div className="w-1 h-6 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '300ms' }} />
                    <div className="w-1 h-8 rounded animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Conversation Stats */}
            {voiceMessages.length > 0 && (
              <div className="mt-6 text-xs text-muted">
                Gesprek uitwisselingen: {Math.ceil(voiceMessages.length / 2)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Voice Button - Mobile Optimized */}
      <div className="text-center px-4">
        <button
          onClick={handleMainButtonClick}
          onTouchStart={() => {}} // Enable iOS hover effects
          disabled={isLoading || isPlayingWelcome || voiceManager.conversationState === 'processing'}
          className={`btn-primary text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-full transition-all duration-300 touch-manipulation select-none min-h-[64px] sm:min-h-[80px] ${
            voiceManager.conversationState === 'listening' 
              ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 animate-pulse shadow-lg shadow-red-500/30' 
              : voiceManager.conversationState === 'speaking'
              ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-500/30'
              : voiceManager.conversationState === 'error'
              ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
              : 'shadow-lg shadow-accent/20 active:scale-95'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            {getMainButtonIcon()}
            <span className="font-medium">{getMainButtonText()}</span>
          </div>
        </button>

        {/* Error Display */}
        {voiceManager.error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{voiceManager.error}</p>
            <button 
              onClick={() => setShowPermissionHelp(true)}
              className="text-xs text-red-300 hover:text-red-200 underline mt-1"
            >
              Hulp bij microfoon problemen
            </button>
          </div>
        )}

        {/* Instructions - Mobile Optimized */}
        {chatStarted && voiceManager.conversationState === 'idle' && (
          <div className="mt-4 text-xs sm:text-sm text-muted text-center max-w-sm sm:max-w-md mx-auto px-2">
            <p className="leading-relaxed">💬 Voer een natuurlijk spraakgesprek - druk, spreek, laat los</p>
            <p className="text-xs mt-1 opacity-75">AI hoort je direct en antwoordt met spraak</p>
          </div>
        )}
        
        {!chatStarted && (
          <div className="mt-4 text-xs sm:text-sm text-muted text-center max-w-sm sm:max-w-md mx-auto px-2">
            <p className="leading-relaxed">🎯 Start een volledig spraakgesprek zonder tekst</p>
            <p className="text-xs mt-1 opacity-75">Perfect voor spreekvaardigheid oefenen</p>
          </div>
        )}
      </div>

      {/* Permission Help Modal - Mobile Optimized */}
      {showPermissionHelp && (
        <div className="modal-overlay" onClick={() => setShowPermissionHelp(false)}>
          <div className="modal-content p-4 sm:p-6 max-w-sm sm:max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-heading text-base sm:text-lg">Microfoon Hulp</h3>
              <button 
                onClick={() => setShowPermissionHelp(false)} 
                className="text-muted hover:text-body text-xl sm:text-lg p-1 -m-1 touch-manipulation"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
              <p>• Controleer of je microfoon aangesloten en ingeschakeld is</p>
              <p>• Klik op het slot-icoon in je adresbalk en sta microfoon toe</p>
              <p>• Herlaad de pagina na het wijzigen van permissies</p>
              <p>• Test je microfoon in andere apps om te controleren of het werkt</p>
            </div>
            <div className="mt-6 pt-4 border-t border-accent/20">
              <button 
                onClick={() => setShowPermissionHelp(false)}
                className="btn btn-primary w-full touch-manipulation"
              >
                Begrepen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}