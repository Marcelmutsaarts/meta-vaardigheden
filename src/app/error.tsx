'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error occurred:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 text-6xl flex items-center justify-center rounded-full" 
               style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)' }}>
            ⚠️
          </div>
          <h2 className="text-heading text-2xl mb-2">Er is iets misgegaan</h2>
          <p className="text-muted mb-6">
            Er is een onverwachte fout opgetreden. Probeer het opnieuw of ga terug naar de startpagina.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="btn btn-primary w-full"
          >
            Probeer opnieuw
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-secondary w-full"
          >
            Terug naar startpagina
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 p-4 rounded-lg text-left" 
                   style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <summary className="cursor-pointer text-sm font-medium text-red-400 mb-2">
              Debug informatie (alleen in development)
            </summary>
            <pre className="text-xs text-muted overflow-auto">
              {error.message}
              {error.stack && (
                <>
                  {'\n\nStack trace:\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}