'use client'

import React, { useState, useRef, useEffect } from 'react'

interface FileUploadResult {
  success: boolean
  filename?: string
  size?: number
  fileType?: string
  content?: string
  wordCount?: number
  characterCount?: number
  error?: string
}

interface EnhancedFileUploadProps {
  onFileUpload: (result: FileUploadResult & { tokenCount: number }) => void
  maxTokens?: number
  initialFile?: { name: string; tokenCount: number } | null
}

export default function EnhancedFileUpload({ onFileUpload, maxTokens = 20000, initialFile = null }: EnhancedFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; tokenCount: number } | null>(initialFile)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update uploadedFile when initialFile prop changes
  useEffect(() => {
    setUploadedFile(initialFile)
  }, [initialFile])

  // Estimate tokens (roughly 4 characters per token)
  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4)
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload-docx', {
        method: 'POST',
        body: formData,
      })

      const data: FileUploadResult = await response.json()

      if (data.success && data.content) {
        const tokenCount = estimateTokens(data.content)
        
        if (tokenCount > maxTokens) {
          onFileUpload({
            ...data,
            success: false,
            error: `Bestand bevat te veel tokens (${tokenCount.toLocaleString()} tokens). Maximum is ${maxTokens.toLocaleString()} tokens.`,
            tokenCount
          })
          setUploadedFile(null)
        } else {
          setUploadedFile({ name: data.filename || file.name, tokenCount })
          onFileUpload({ ...data, tokenCount })
        }
      } else {
        onFileUpload({ ...data, tokenCount: 0 })
        setUploadedFile(null)
      }
    } catch (error) {
      console.error('Upload error:', error)
      onFileUpload({
        success: false,
        error: 'Er is een fout opgetreden bij het uploaden',
        tokenCount: 0
      })
      setUploadedFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    onFileUpload({
      success: false,
      content: '',
      tokenCount: 0
    })
  }

  return (
    <div
      className={`card-primary cursor-pointer transition-all duration-300 ${
        isDragging ? 'scale-[1.02]' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center text-center">
        {isUploading ? (
          <>
            <div className="w-16 h-16 mb-4">
              <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="var(--accent)" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="var(--accent)"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-muted">Bestand wordt verwerkt...</p>
          </>
        ) : uploadedFile ? (
          <>
            <svg className="w-16 h-16 mb-4" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-heading text-lg mb-2">{uploadedFile.name}</p>
            <p className="text-muted mb-4">
              {uploadedFile.tokenCount.toLocaleString()} / {maxTokens.toLocaleString()} tokens
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFile()
              }}
              className="btn btn-secondary"
            >
              Verwijder bestand
            </button>
          </>
        ) : (
          <>
            <svg className="w-16 h-16 mb-4" fill="none" stroke="var(--accent)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-heading text-lg mb-2">
              Sleep een bestand hierheen of klik om te selecteren
            </p>
            <p className="text-muted mb-4">
              Ondersteunde formaten: .docx, .pdf
            </p>
            <p className="text-sm" style={{ color: 'var(--accent)' }}>
              Maximum: {maxTokens.toLocaleString()} tokens
            </p>
          </>
        )}
      </div>
    </div>
  )
}