'use client'

import React, { useState, useRef, useCallback } from 'react'

interface VoiceMessage {
  id: string
  role: 'student' | 'chatbot'
  content: string
  audioUrl?: string
  timestamp: Date
  isPlaying?: boolean
}

interface VoiceConversationManagerProps {
  sessionData: any
  onNewMessage: (message: VoiceMessage) => void
}

type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export default function useVoiceConversationManager({ 
  sessionData, 
  onNewMessage
}: VoiceConversationManagerProps) {
  const [conversationState, setConversationState] = useState<ConversationState>('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<'student' | 'chatbot' | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Check browser compatibility
  const checkBrowserSupport = useCallback(() => {
    const issues = []
    
    if (!navigator.mediaDevices?.getUserMedia) {
      issues.push('Microfoon toegang wordt niet ondersteund in deze browser')
    }
    
    if (!window.MediaRecorder) {
      issues.push('Audio opname wordt niet ondersteund in deze browser')
    }
    
    if (!window.Audio) {
      issues.push('Audio afspelen wordt niet ondersteund')
    }
    
    return issues
  }, [])

  // Start recording student voice
  const startRecording = useCallback(async () => {
    try {
      setError(null)
      
      // Check browser compatibility first
      const compatibilityIssues = checkBrowserSupport()
      if (compatibilityIssues.length > 0) {
        setError(`Browser compatibiliteit: ${compatibilityIssues.join(', ')}`)
        setConversationState('error')
        return
      }
      
      setConversationState('listening')
      setCurrentSpeaker('student')
      
      // Request microphone with timeout
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Microfoon toegang timeout')), 10000)
        )
      ]) as MediaStream
      
      // Try to get the best audio format for transcription
      const options = { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      }
      
      // Fallback chain for MediaRecorder format support
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm'
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4'
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        delete (options as any).mimeType // Use browser default
        delete (options as any).audioBitsPerSecond
      }
      
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('Fout bij audio opname. Probeer het opnieuw.')
        setConversationState('error')
        setCurrentSpeaker(null)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.onstop = async () => {
        try {
          // Use the actual MIME type from MediaRecorder
          const mimeType = mediaRecorder.mimeType || 'audio/webm'
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          
          // Validate audio data
          if (audioBlob.size < 1000) { // Less than 1KB is likely empty
            throw new Error('Audio opname te kort of leeg')
          }
          
          console.log(`Recorded audio: ${audioBlob.size} bytes`) // Debug log
          await processStudentAudio(audioBlob)
        } catch (error) {
          console.error('Error processing recorded audio:', error)
          setError(error instanceof Error ? error.message : 'Fout bij verwerken van audio')
          setConversationState('error')
          setCurrentSpeaker(null)
        } finally {
          // Always stop tracks to release microphone
          stream.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      // Auto-stop after 15 seconds for better conversation flow
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 15000)
      
    } catch (error: any) {
      console.error('Error starting recording:', error)
      
      // Provide specific error messages
      let errorMessage = 'Er is een fout opgetreden bij het starten van de opname'
      
      if (error?.name === 'NotAllowedError') {
        errorMessage = 'Microfoon toegang geweigerd. Sta microfoon toe in je browser.'
      } else if (error?.name === 'NotFoundError') {
        errorMessage = 'Geen microfoon gevonden. Controleer je audio apparaten.'
      } else if (error?.name === 'NotReadableError') {
        errorMessage = 'Microfoon is al in gebruik door een andere app.'
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Microfoon toegang duurde te lang. Probeer opnieuw.'
      }
      
      setError(errorMessage)
      setConversationState('error')
      setCurrentSpeaker(null)
    }
  }, [checkBrowserSupport])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setConversationState('processing')
    }
  }, [isRecording])

  // Process student audio with Gemini Live: Direct Audio -> AI Audio Response
  const processStudentAudio = useCallback(async (audioBlob: Blob) => {
    let retryCount = 0
    const maxRetries = 2
    
    const processWithRetry = async (): Promise<void> => {
      try {
        setConversationState('processing')
        
        // Prepare form data for Gemini Live API
        const formData = new FormData()
        formData.append('audio', audioBlob, 'voice-recording.wav')
        
        // Add context and voice settings
        formData.append('caseContext', JSON.stringify({
          uploadedContent: sessionData.uploadedContent,
          contextText: sessionData.contextText,
          educationLevel: sessionData.options.educationLevel
        }))
        
        formData.append('voiceSettings', JSON.stringify({
          aiVoice: sessionData.options.voiceSettings?.aiVoice || 'Achird',
          emotionStyle: sessionData.options.voiceSettings?.emotionStyle || 'Neutraal'
        }))
        
        // Call Gemini Live API with timeout
        const apiStartTime = Date.now()
        const liveController = new AbortController()
        const liveTimeout = setTimeout(() => liveController.abort(), 20000) // Reduced timeout for faster fails
        
        const liveResponse = await fetch('/api/voice-live', {
          method: 'POST',
          body: formData,
          signal: liveController.signal
        })
        clearTimeout(liveTimeout)
        const apiEndTime = Date.now()
        console.log(`Voice API call: ${apiEndTime - apiStartTime}ms`)
        
        if (!liveResponse.ok) {
          const errorText = await liveResponse.text()
          throw new Error(`Gemini Live API fout: ${liveResponse.status} - ${errorText}`)
        }
        
        // Get audio response directly
        const audioBuffer = await liveResponse.arrayBuffer()
        
        // Validate audio response
        if (audioBuffer.byteLength < 1000) { // Less than 1KB is likely empty
          throw new Error('AI audio response te kort of leeg')
        }
        
        // Create audio URL for playback
        const responseAudioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(responseAudioBlob)
        
        // Create AI message (no text content since it's pure audio)
        const aiMessage: VoiceMessage = {
          id: Date.now().toString(),
          role: 'chatbot',
          content: '[AI Spraak Response]', // Placeholder for visual purposes
          audioUrl,
          timestamp: new Date()
        }
        onNewMessage(aiMessage)

        // Auto-play AI response
        try {
          // Play the AI response directly
          setConversationState('speaking')
          setCurrentSpeaker('chatbot')
          
          const audio = new Audio(audioUrl)
          
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => {
              setConversationState('idle')
              setCurrentSpeaker(null)
              resolve()
            }
            
            audio.onerror = () => {
              setConversationState('idle')
              setCurrentSpeaker(null)
              reject(new Error('Audio playback failed'))
            }
            
            audio.play().catch(reject)
          })
        } catch (playError) {
          console.warn('Audio playback failed:', playError)
          // Set conversation to idle even if playback fails
          setConversationState('idle')
          setCurrentSpeaker(null)
        }

      } catch (error: any) {
        console.error(`Error processing audio with Gemini Live (attempt ${retryCount + 1}):`, error)
        
        // Check if we should retry
        if (retryCount < maxRetries && 
            (error?.name === 'AbortError' || 
             error?.message?.includes('network') || 
             error?.message?.includes('timeout') ||
             error?.message?.includes('fetch'))) {
          
          retryCount++
          console.log(`Retrying Gemini Live processing (${retryCount}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
          return processWithRetry()
        }
        
        // Final error handling
        let errorMessage = 'Er is een fout opgetreden bij spraakverwerking'
        
        if (error?.name === 'AbortError') {
          errorMessage = 'Spraakverwerking duurde te lang. Probeer het opnieuw.'
        } else if (error?.message?.includes('Gemini Live API fout')) {
          errorMessage = 'AI spraakservice tijdelijk niet beschikbaar. Probeer het opnieuw.'
        } else if (error?.message?.includes('te kort')) {
          errorMessage = error.message
        }
        
        setError(errorMessage)
        setConversationState('error')
        setCurrentSpeaker(null)
      }
    }
    
    await processWithRetry()
  }, [sessionData, onNewMessage])

  // Play AI response audio with error handling
  const playAIResponse = useCallback(async (audioUrl: string) => {
    return new Promise<void>((resolve, reject) => {
      setConversationState('speaking')
      setCurrentSpeaker('chatbot')
      
      const audio = new Audio()
      currentAudioRef.current = audio
      
      // Set up event handlers before setting src
      audio.onloadeddata = () => {
        // Audio loaded successfully, can start playing
        audio.play().catch((playError) => {
          console.error('Audio play failed:', playError)
          
          // Handle specific play errors
          if (playError.name === 'NotAllowedError') {
            // User interaction required for autoplay
            console.warn('Autoplay blocked - user interaction required')
            setConversationState('idle')
            setCurrentSpeaker(null)
            resolve() // Don't treat as error, just continue
          } else {
            setConversationState('error')
            setCurrentSpeaker(null)
            reject(new Error('Audio afspelen gefaald: ' + playError.message))
          }
        })
      }
      
      audio.onended = () => {
        setConversationState('idle')
        setCurrentSpeaker(null)
        currentAudioRef.current = null
        resolve()
      }
      
      audio.onerror = (event) => {
        console.error('Audio error:', event)
        setConversationState('idle') // Don't show as error, just continue
        setCurrentSpeaker(null)
        currentAudioRef.current = null
        
        // Try to determine specific error
        if (event && typeof event === 'object' && 'target' in event) {
          const target = event.target as HTMLAudioElement
          let errorMessage = 'Audio kon niet worden afgespeeld'
          
          if (target?.error) {
            switch (target.error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Audio afspelen geannuleerd'
                break
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'Netwerkfout bij audio afspelen'
                break
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'Audio format niet ondersteund'
                break
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Audio bron niet beschikbaar'
                break
            }
          }
          
          console.warn('Audio playback error:', errorMessage)
        }
        
        resolve() // Continue conversation despite audio error
      }
      
      audio.oncanplay = () => {
        // Audio can start playing
        console.log('Audio ready to play')
      }
      
      // Set volume and preload
      audio.volume = 0.8
      audio.preload = 'auto'
      
      // Set source - this triggers loading
      audio.src = audioUrl
      
      // Timeout fallback in case audio never loads
      setTimeout(() => {
        if (audio.readyState === 0) { // HAVE_NOTHING
          console.warn('Audio loading timeout')
          setConversationState('idle')
          setCurrentSpeaker(null)
          resolve()
        }
      }, 10000) // 10 second timeout
    })
  }, [])

  // Stop current audio
  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      setConversationState('idle')
      setCurrentSpeaker(null)
    }
  }, [])

  // Toggle recording (main interaction)
  const toggleRecording = useCallback(() => {
    if (conversationState === 'speaking') {
      stopCurrentAudio()
    } else if (isRecording) {
      stopRecording()
    } else if (conversationState === 'idle') {
      startRecording()
    }
  }, [conversationState, isRecording, startRecording, stopRecording, stopCurrentAudio])

  return {
    conversationState,
    currentSpeaker,
    isRecording,
    error,
    toggleRecording,
    stopCurrentAudio,
    playAIResponse
  }
}