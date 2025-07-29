'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error occurred:', error)
  }, [error])

  return (
    <html lang="nl" data-theme="dark">
      <head>
        <title>Fout - Meta-Vaardigheden Leeromgeving</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          :root {
            --accent: #A25DF8;
            --accent-soft: rgba(162, 93, 248, 0.8);
            --accent-dark: #8B4FE6;
            --fg-base: #FFFFFF;
            --fg-muted: #94A3B8;
            --bg-primary: #0F1419;
            --bg-card: #1A1F2E;
            --bg-card-hover: #252B3A;
            --border-primary: rgba(148, 163, 184, 0.1);
            --color-warning: #F59E0B;
          }

          [data-theme="light"] {
            --fg-base: #1E293B;
            --fg-muted: #64748B;
            --bg-primary: #FFFFFF;
            --bg-card: #F8FAFC;
            --bg-card-hover: #F1F5F9;
            --border-primary: rgba(148, 163, 184, 0.2);
            --color-warning: #D97706;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg-primary);
            color: var(--fg-base);
            line-height: 1.6;
            min-height: 100vh;
          }

          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }

          .card {
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }

          .error-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            font-size: 4rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.1);
            border: 2px solid rgba(239, 68, 68, 0.3);
          }

          h1 {
            font-size: 1.875rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--fg-base);
          }

          p {
            color: var(--fg-muted);
            margin-bottom: 2rem;
          }

          .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            margin: 0.25rem;
            width: 100%;
            box-sizing: border-box;
          }

          .btn-primary {
            background: var(--accent);
            color: white;
          }

          .btn-primary:hover {
            background: var(--accent-dark);
            transform: translateY(-1px);
          }

          .btn-secondary {
            background: transparent;
            color: var(--fg-muted);
            border: 1px solid var(--border-primary);
          }

          .btn-secondary:hover {
            background: var(--bg-card-hover);
            color: var(--fg-base);
          }

          .debug-info {
            margin-top: 1.5rem;
            padding: 1rem;
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            text-align: left;
          }

          .debug-summary {
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            color: #ef4444;
            margin-bottom: 0.5rem;
          }

          .debug-content {
            font-size: 0.75rem;
            color: var(--fg-muted);
            white-space: pre-wrap;
            overflow: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <div className="error-icon">
              💥
            </div>
            
            <h1>Kritieke Systeemfout</h1>
            <p>
              Er is een ernstige fout opgetreden in de applicatie. 
              Dit is meestal tijdelijk - probeer de pagina opnieuw te laden.
            </p>

            <button 
              className="btn btn-primary"
              onClick={reset}
            >
              Applicatie herstarten
            </button>

            <button 
              className="btn btn-secondary"
              onClick={() => window.location.href = '/'}
            >
              Terug naar startpagina
            </button>

            {process.env.NODE_ENV === 'development' && (
              <details className="debug-info">
                <summary className="debug-summary">
                  Debug informatie (alleen in development)
                </summary>
                <div className="debug-content">
                  {error.message}
                  {error.stack && (
                    <>
                      {'\n\nStack trace:\n'}
                      {error.stack}
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}