# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Meta-Vaardigheden Leeromgeving** - an AI-powered learning environment generator that creates personalized skill training environments for students. Teachers upload materials and configure settings on a start page, which then generates an interactive learning environment where students can practice skills through AI-powered conversations.

## Architecture

### Two-Page Application Structure
1. **Start Page (`/`)** - Teacher configuration interface
2. **Learning Environment (`/leeromgeving`)** - Student practice interface

### Key Components
- **EnhancedFileUpload**: Handles docx/pdf uploads with token counting (max 20,000 tokens) and `initialFile` prop for edit functionality
- **Chat Interface**: Role-based conversation system with distinct UI for student vs AI assistant (text and voice modes)
- **VoiceChatInterface**: Full voice conversation interface with real-time audio processing
- **Feedback System**: Optional AI feedback bot with centralized modal popup interface
- **Error Boundaries**: `error.tsx` and `global-error.tsx` for Next.js 15 App Router compliance
- **Session Management**: Uses sessionStorage to persist data between pages and enable edit functionality

### API Architecture
- **`/api/analyze-case`**: Analyzes uploaded content to create case description and determine AI role
- **`/api/chat-student`**: Main conversation endpoint with context-aware AI responses for text mode
- **`/api/voice-live`**: Voice conversation endpoint with audio-to-audio processing using Gemini Live
- **`/api/feedback`**: Generates constructive feedback based on conversation history
- **`/api/upload-docx`**: Processes docx/pdf files and extracts text content
- **`/api/generate-tts`**: Text-to-speech generation for voice mode using Gemini TTS
- **`/api/voice-welcome`**: Generates welcome audio for voice chat mode
- **`/api/voice-transcribe`**: Speech-to-text conversion for voice input

### AI Model Strategy
Uses **Gemini 2.0 Flash** for text generation, **Gemini 2.5 Flash** for voice processing, and **Gemini TTS** for speech synthesis:
- Student always plays the learning role (e.g., psychology student, nursing student)
- AI always plays the practice partner role (e.g., client, patient, customer)
- **Critical role prompting**: Both text and voice APIs use identical role separation prompts to prevent confusion
- Voice mode supports 9 speaking styles: happy, sad, excited, calm, serious, dramatic, friendly, formal, casual
- Voice processing optimized for 2-3 sentence responses for natural conversation flow

## Development Commands

```bash
# Development
npm run dev              # Start development server on localhost:3000
npm run build           # Build for production  
npm run start           # Start production server
npm run lint            # Run ESLint

# Netlify deployment
npm run netlify-build   # Netlify-specific build command
```

## Environment Setup

Required environment variable:
```bash
GEMINI_API_KEY=your_api_key_here  # From Google AI Studio
```

## Design System

### Purple Hacker Academic Theme
The app uses a custom design system defined in `globals.css` with:
- **Dark mode default** with CSS custom properties
- **Typography**: Poppins (headings) + Inter (body text)
- **Color palette**: Purple accents (#A25DF8) with dark backgrounds
- **Component classes**: `.card`, `.btn-primary`, `.form-input`, `.floating-btn`
- **Purple glow effects** and subtle sci-fi background textures

### Key UI Patterns
- **Floating action buttons** (left side: case info, dark/light toggle, finalize, edit)
- **Dark/Light mode toggle** (start page: top-left, learning environment: left sidebar)
- **Modal system** with centralized overlays, backdrop blur, and smooth animations (`.modal-overlay`, `.modal-content`)
- **Role-based chat bubbles** with color coding (green for student, purple for AI)
- **Test environment indicators** with warning styling
- **Voice chat interface** with microphone controls, audio playback, and speaking indicators
- **Feedback modal** - centralized popup with improved UX replacing sidebar design

## Data Flow

### Teacher Workflow
1. Upload materials (docx/pdf) with automatic token counting and text extraction
2. Add context text and configure options (name, education level, interaction mode, voice settings, feedback bot)
3. Generate learning environment → stores data in sessionStorage with fresh chat state
4. Navigate to `/leeromgeving` with test mode enabled

### Student Workflow  
1. Case description auto-loaded and cached on environment entry
2. Click "Start Gesprek" → API analyzes case and provides welcome message (text or voice)
3. Chat with AI assistant that maintains role consistency (text mode or voice mode)
4. Optional feedback requests that analyze full conversation

### Edit Functionality
- All form data including file metadata persists in sessionStorage
- Edit button returns to start page with all fields pre-populated
- **Enhanced file restoration**: `EnhancedFileUpload` component supports `initialFile` prop to restore uploaded files in edit mode  
- Supports both uploaded files and text input restoration with complete fidelity

## Important Implementation Details

### PDF Text Extraction
- Uses **pdf-parse** library with Next.js configuration for serverless compatibility
- **Updated Next.js 15 config**: Uses `serverExternalPackages: ["pdf-parse"]` (not experimental.serverComponentsExternalPackages)
- Fallback system for complex PDFs with user guidance for manual input
- Forces Node.js runtime with `export const runtime = 'nodejs'` in API routes
- Supports .docx, .pdf, and .csv file formats with robust error handling

### Token Management
- Upload component estimates ~4 characters per token
- 20,000 token limit for main content, 10,000 for feedback criteria
- Real-time token counting with user feedback

### Role Prompting Strategy
**Critical for AI behavior**: Both `/api/chat-student` and `/api/voice-live` use identical role separation prompts:
- Student is ALWAYS the learner (psychology student, nursing student, etc.)
- AI is ALWAYS the practice partner (client, patient, supervisor, etc.)
- Explicit role boundaries prevent confusion in complex scenarios
- **Fixed voice mode role confusion**: Previously voice-live had inadequate role prompting causing AI to respond as student

### Voice Mode Implementation
- **Gemini Live integration**: `/api/voice-live` processes audio-to-audio with Gemini 2.5 Flash
- Uses Gemini TTS with 9 speaking styles (happy, sad, excited, calm, serious, dramatic, friendly, formal, casual)
- Real-time speech recognition and audio playback via `VoiceConversationManager` hook
- **Pure audio conversation**: Student speaks → AI processes audio → AI responds with audio
- Speaking indicators show current speaker (student/AI) with visual feedback
- Automatic conversation flow with error handling and retry logic

### Session Storage Schema
```typescript
{
  uploadedContent: string,
  uploadedFile: FileMetadata,
  contextText: string,
  options: TeacherOptions,
  feedbackCriteria: string,
  feedbackText: string,
  isTestEnvironment: boolean,
  caseDescription?: string,
  chatStarted: boolean,
  messages: ChatMessage[]
}
```

### Fresh Session Reset
Each "Generate Learning Environment" creates a fresh session by explicitly resetting:
- `chatStarted: false` - Forces new welcome message
- `messages: []` - Clears chat history  
- `caseDescription: undefined` - Forces re-generation of case analysis

### CSS Custom Properties & Theme System
Uses CSS variables for theming consistency with full dark/light mode support:
- `--accent`, `--accent-soft`, `--accent-dark` for purple variants
- `--fg-base`, `--fg-muted` for text colors  
- `--bg-primary`, `--bg-card` for backgrounds
- Light mode activated via `[data-theme="light"]` attribute on document element
- Theme preference stored in localStorage and synchronized across pages
- **Modal system**: `.modal-overlay` and `.modal-content` with backdrop blur and smooth animations
- Component classes follow BEM-like naming with `.card`, `.btn-primary` patterns

### Error Handling & Next.js 15 Compliance
- **Required error boundaries**: `src/app/error.tsx` and `src/app/global-error.tsx`
- Error components must be client components with `'use client'` directive
- Global error component includes its own `<html>` and `<body>` tags
- User-friendly error messages in Dutch with retry functionality
- Development mode shows detailed error information for debugging

## Common Development Tasks

When adding new features, maintain the two-page architecture and ensure:
- Data persists properly in sessionStorage for edit functionality
- **Role prompting consistency**: Both text and voice APIs use identical role separation prompts
- UI follows the purple hacker academic theme with dark/light mode support
- File uploads respect token limits and provide user feedback with `initialFile` prop support
- **Error boundaries**: Include proper error handling for Next.js 15 App Router
- Test/production mode states are handled correctly
- **PDF processing**: Use `serverExternalPackages: ["pdf-parse"]` in next.config.js (Next.js 15)
- Voice features integrate with Gemini Live API for audio-to-audio processing
- **Modal system**: Use centralized modal classes for consistent UX
- Fresh session reset maintains clean user experience between test cycles

## Recent Major Updates

### Voice Mode Role Confusion Fix
Fixed critical issue where voice mode AI responded as student instead of practice partner by updating `/api/voice-live` with proper role prompting identical to text mode.

### File Upload Edit Restoration
Enhanced `EnhancedFileUpload` component with `initialFile` prop to properly restore uploaded files when editing learning environments.

### Feedback UI Overhaul  
Converted feedback sidebar to centralized modal popup with improved UX, mobile responsiveness, and consistent styling.

### Next.js 15 Error Boundary Compliance
Added required `error.tsx` and `global-error.tsx` components to prevent "missing required error components" errors.

### PDF Processing Configuration Update
Updated next.config.js from deprecated `experimental.serverComponentsExternalPackages` to `serverExternalPackages` for Next.js 15 compatibility.