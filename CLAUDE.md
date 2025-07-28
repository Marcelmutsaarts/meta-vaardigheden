# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Meta-Vaardigheden Leeromgeving** - an AI-powered learning environment generator that creates personalized skill training environments for students. Teachers upload materials and configure settings on a start page, which then generates an interactive learning environment where students can practice skills through AI-powered conversations.

## Architecture

### Two-Page Application Structure
1. **Start Page (`/`)** - Teacher configuration interface
2. **Learning Environment (`/leeromgeving`)** - Student practice interface

### Key Components
- **EnhancedFileUpload**: Handles docx/pdf uploads with token counting (max 20,000 tokens)
- **Chat Interface**: Role-based conversation system with distinct UI for student vs AI assistant
- **Feedback System**: Optional AI feedback bot with assessment criteria
- **Session Management**: Uses sessionStorage to persist data between pages and enable edit functionality

### API Architecture
- **`/api/analyze-case`**: Analyzes uploaded content to create case description and determine AI role
- **`/api/chat-student`**: Main conversation endpoint with context-aware AI responses  
- **`/api/feedback`**: Generates constructive feedback based on conversation history
- **`/api/upload-docx`**: Processes docx/pdf files and extracts text content

### AI Model Strategy
Uses **Gemini 2.0 Flash** for all text generation with specific prompting to ensure:
- Student always plays the learning role (e.g., psychology student, nursing student)
- AI always plays the practice partner role (e.g., client, patient, customer)
- Clear role separation to avoid AI confusion about who is the student

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
- **Modal overlays** with purple-accented borders and glow effects
- **Role-based chat bubbles** with color coding (green for student, purple for AI)
- **Test environment indicators** with warning styling

## Data Flow

### Teacher Workflow
1. Upload materials (docx/pdf) with automatic token counting
2. Add context text and configure options (name, education level, feedback bot)
3. Generate learning environment → stores data in sessionStorage
4. Navigate to `/leeromgeving` with test mode enabled

### Student Workflow  
1. Case description auto-loaded and cached on environment entry
2. Click "Start Gesprek" → API analyzes case and provides welcome message
3. Chat with AI assistant that maintains role consistency
4. Optional feedback requests that analyze full conversation

### Edit Functionality
- All form data including file metadata persists in sessionStorage
- Edit button returns to start page with all fields pre-populated
- Supports both uploaded files and text input restoration

## Important Implementation Details

### Token Management
- Upload component estimates ~4 characters per token
- 20,000 token limit for main content, 10,000 for feedback criteria
- Real-time token counting with user feedback

### Role Prompting Strategy
Critical for AI behavior: prompts explicitly state that the student is always the learner and AI plays the practice partner. This prevents confusion in scenarios like "psychology student practicing with client" where AI might incorrectly assume it's the psychology student.

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
  caseDescription?: string
}
```

### CSS Custom Properties
Use CSS variables for theming consistency:
- `--accent`, `--accent-soft`, `--accent-dark` for purple variants
- `--fg-base`, `--fg-muted` for text colors  
- `--bg-primary`, `--bg-card` for backgrounds
- Component classes follow BEM-like naming with `.card`, `.btn-primary` patterns

## Common Development Tasks

When adding new features, maintain the two-page architecture and ensure:
- Data persists properly in sessionStorage for edit functionality
- AI prompts maintain clear role separation 
- UI follows the purple hacker academic theme
- File uploads respect token limits and provide user feedback
- Test/production mode states are handled correctly