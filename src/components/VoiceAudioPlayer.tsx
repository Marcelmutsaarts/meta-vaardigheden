'use client'

import React, { useState, useRef, useEffect } from 'react'

interface VoiceAudioPlayerProps {
  audioUrl: string
  role: 'student' | 'chatbot'
  isActive?: boolean
  onPlay?: () => void
  onEnd?: () => void
}

export default function VoiceAudioPlayer({ 
  audioUrl, 
  role, 
  isActive = false,
  onPlay,
  onEnd 
}: VoiceAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      setDuration(audio.duration)
    }

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onEnd?.()
    }

    audio.onplay = () => {
      setIsPlaying(true)
      onPlay?.()
    }

    audio.onpause = () => {
      setIsPlaying(false)
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [audioUrl, onPlay, onEnd])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getWaveformBars = () => {
    // Generate visual waveform bars
    const bars = []
    const numBars = 20
    
    for (let i = 0; i < numBars; i++) {
      const height = Math.random() * 100 + 20 // Random height between 20-120%
      const isActive = isPlaying && (currentTime / duration) * numBars > i
      
      bars.push(
        <div
          key={i}
          className={`waveform-bar ${isActive ? 'active' : ''}`}
          style={{
            height: `${height}%`,
            backgroundColor: isActive 
              ? role === 'student' ? '#22c55e' : 'var(--accent)'
              : role === 'student' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(162, 93, 248, 0.3)',
            animationDelay: `${i * 50}ms`
          }}
        />
      )
    }
    
    return bars
  }

  return (
    <div className={`voice-audio-player ${role === 'student' ? 'student' : 'chatbot'}`}>
      <div className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300"
           style={{ 
             backgroundColor: role === 'student' 
               ? 'rgba(34, 197, 94, 0.1)' 
               : 'rgba(162, 93, 248, 0.1)',
             border: `1px solid ${role === 'student' 
               ? 'rgba(34, 197, 94, 0.3)' 
               : 'rgba(162, 93, 248, 0.3)'}`
           }}>
        
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: role === 'student' ? '#22c55e' : 'var(--accent)',
            color: 'white'
          }}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Waveform Visualization */}
        <div className="flex items-center gap-1 flex-1 h-8">
          {getWaveformBars()}
        </div>

        {/* Time Display */}
        <div className="text-xs text-muted font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Active Indicator */}
        {isActive && (
          <div className={`w-2 h-2 rounded-full animate-pulse`}
               style={{ 
                 backgroundColor: role === 'student' ? '#22c55e' : 'var(--accent)' 
               }} />
        )}
      </div>

      <style jsx>{`
        .waveform-bar {
          width: 3px;
          min-height: 4px;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        
        .waveform-bar.active {
          animation: waveform-pulse 0.6s ease-in-out infinite alternate;
        }
        
        @keyframes waveform-pulse {
          0% { opacity: 0.7; transform: scaleY(0.8); }
          100% { opacity: 1; transform: scaleY(1.2); }
        }
        
        .voice-audio-player:hover .waveform-bar {
          opacity: 0.8;
        }
        
        .voice-audio-player:hover .waveform-bar.active {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}