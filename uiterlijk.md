# Meta-Verslag-App UI Design System

Een complete gids voor het repliceren van de Meta-Verslag-App visuele identiteit in andere projecten.

## 1. Core Design Philosophy

**Purple Hacker Academic Theme**: Een futuristische educatieve interface die professioneel onderwijs combineert met moderne tech aesthetiek.

**Key Principles:**
- Dark mode primary, light mode secondary
- Purple accent color als primary brand color
- Subtiele glow effects en sci-fi elementen
- Clean typography met sterke hiërarchie
- Minimale maar krachtige interacties

## 2. Color Palette & CSS Variables

### Dark Mode (Default)
```css
:root {
  /* Primary Purple Palette */
  --accent: #A25DF8;           /* Main purple accent */
  --accent-soft: #C38FFF;      /* Lighter purple for hovers */
  --accent-dark: #8A4AE8;      /* Darker purple for gradients */
  
  /* Foreground Colors */
  --fg-base: #E5E5E5;          /* Primary text color */
  --fg-muted: #7B7B7B;         /* Secondary/muted text */
  
  /* Background Colors */
  --bg-primary: #000000;       /* Main background */
  --bg-card: #010101;          /* Card backgrounds */
  --bg-card-hover: #0A0A0A;    /* Card hover state */
  
  /* Semantic Colors */
  --color-error: #ef4444;      /* Red for errors */
  --color-success: #22c55e;    /* Green for success */
  --color-warning: #f59e0b;    /* Orange for warnings */
  --color-info: #3b82f6;       /* Blue for info */
}
```

### Light Mode Override
```css
[data-theme="light"] {
  /* Inverted Foreground */
  --fg-base: #1a1a1a;          /* Dark text on light background */
  --fg-muted: #6b7280;         /* Muted dark text */
  
  /* Light Backgrounds */
  --bg-primary: #ffffff;       /* White background */
  --bg-card: #f9fafb;          /* Light gray cards */
  --bg-card-hover: #f3f4f6;    /* Slightly darker on hover */
  
  /* Adjusted Semantic Colors */
  --color-error: #dc2626;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-info: #2563eb;
  
  /* Light mode shadows */
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.1);
}
```

## 3. Typography System

### Font Families
```css
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@400;600;700&display=swap');

/* Font variables */
--font-heading: 'Poppins', sans-serif;  /* Voor koppen en belangrijke tekst */
--font-body: 'Inter', sans-serif;       /* Voor reguliere tekst */
```

### Typography Classes
```css
/* Hero Title */
.text-hero {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: clamp(3rem, 8vw, 6rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--fg-base);
  text-shadow: 0 0 30px rgba(162, 93, 248, 0.3);
}

/* Subtitle */
.text-subtitle {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--fg-muted);
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

/* Motto/Slogan */
.text-motto {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 1.125rem;
  color: var(--accent);
  margin-top: var(--space-sm);
}

/* Regular Heading */
.text-heading {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--fg-base);
}

/* Body Text */
.text-body {
  font-family: var(--font-body);
  font-weight: 400;
  color: var(--fg-base);
}

/* Muted Text */
.text-muted {
  color: var(--fg-muted);
}
```

## 4. Spacing & Layout System

### Spacing Variables
```css
/* Consistent spacing scale */
--space-xs: 0.5rem;   /* 8px */
--space-sm: 1rem;     /* 16px */
--space-md: 1.5rem;   /* 24px */
--space-lg: 2rem;     /* 32px */
--space-xl: 3rem;     /* 48px */

/* Border Radius */
--radius-sm: 0.5rem;  /* 8px */
--radius-md: 0.75rem; /* 12px */
--radius-lg: 1rem;    /* 16px */
```

## 5. Visual Effects & Glows

### Glow Effects
```css
/* Purple glow variations */
--glow-purple: 0 0 20px rgba(162, 93, 248, 0.3);
--glow-purple-intense: 0 0 30px rgba(162, 93, 248, 0.5);
--shadow-card: 0 4px 20px rgba(0, 0, 0, 0.5);
```

### Background Texture
```css
body {
  /* Subtle scan-lines effect voor sci-fi look */
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px),
    radial-gradient(circle at center, transparent 0%, #000 70%);
  background-size: 100% 4px, 100% 100%;
  background-repeat: repeat-y, no-repeat;
}

/* Light mode texture */
[data-theme="light"] body {
  background-image: 
    linear-gradient(rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 4px),
    radial-gradient(circle at center, transparent 0%, #ffffff 70%);
}
```

## 6. Component Library

### Card Components
```css
/* Standard Card */
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--accent);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all 0.3s ease;
  position: relative;
}

/* Glow effect behind card */
.card::before {
  content: "";
  position: absolute;
  inset: -1px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-lg);
  filter: blur(8px);
  opacity: 0.6;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.card:hover::before {
  opacity: 0.9;
}

.card:hover {
  background-color: var(--bg-card-hover);
  box-shadow: var(--glow-purple);
}

/* Primary Upload Card */
.card-primary {
  background-color: var(--bg-card);
  border: 2px solid var(--accent);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  transition: all 0.3s ease;
  min-height: 200px;
  position: relative;
}

.card-primary::before {
  content: "";
  position: absolute;
  inset: -2px;
  border: 2px solid var(--accent);
  border-radius: var(--radius-lg);
  filter: blur(12px);
  opacity: 0.7;
  z-index: -1;
  transition: all 0.3s ease;
}

.card-primary:hover::before {
  opacity: 1;
  filter: blur(16px);
}

.card-primary:hover {
  background-color: var(--bg-card-hover);
  box-shadow: var(--glow-purple-intense);
  border-color: var(--accent-soft);
}
```

### Button System
```css
/* Base Button */
.btn {
  font-family: var(--font-body);
  font-weight: 500;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  overflow: hidden;
}

/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
  color: white;
  box-shadow: var(--glow-purple);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--accent-soft) 0%, var(--accent) 100%);
  box-shadow: var(--glow-purple-intense);
  transform: translateY(-2px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--accent);
  color: white;
  box-shadow: var(--glow-purple);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: var(--fg-muted);
  border-color: var(--fg-muted);
}
```

### Form Elements
```css
/* Form Input */
.form-input {
  font-family: var(--font-body);
  background-color: var(--bg-card);
  border: 1px solid rgba(162, 93, 248, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  color: var(--fg-base);
  width: 100%;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--glow-purple);
}

/* Form Label */
.form-label {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--fg-base);
  margin-bottom: var(--space-xs);
  display: block;
}
```

### Floating Action Buttons
```css
/* Floating Actions Container */
.floating-actions {
  position: fixed;
  bottom: var(--space-lg);
  right: calc(48px + var(--space-md));
  display: flex;
  gap: var(--space-sm);
  z-index: 50;
}

/* Individual Floating Button */
.floating-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--accent);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(162, 93, 248, 0.2);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.floating-btn:hover {
  background: var(--accent-soft);
  border-color: var(--accent-bright);
  color: var(--accent-bright);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 20px rgba(162, 93, 248, 0.4);
}

.floating-btn:active {
  transform: translateY(-1px) scale(1.02);
}

.floating-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

## 7. Theme Toggle System

### Theme Toggle Component
```css
/* Theme toggle integration with floating buttons */
.floating-btn-wrapper button {
  width: 52px !important;
  height: 52px !important;
  border-radius: 50% !important;
  background: var(--bg-card) !important;
  border: 2px solid var(--accent) !important;
  color: var(--accent) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
  backdrop-filter: blur(8px) !important;
  box-shadow: 0 4px 12px rgba(162, 93, 248, 0.2) !important;
}

.floating-btn-wrapper button:hover {
  background: var(--accent-soft) !important;
  transform: translateY(-3px) scale(1.05) !important;
  box-shadow: 0 6px 20px rgba(162, 93, 248, 0.4) !important;
}

.floating-btn-wrapper button svg {
  width: 24px !important;
  height: 24px !important;
}
```

### JavaScript Theme Implementation
```javascript
// Theme toggle functionality
const [theme, setTheme] = useState('dark')

useEffect(() => {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  setTheme(savedTheme)
  document.documentElement.setAttribute('data-theme', savedTheme)
}, [])

const toggleTheme = () => {
  const newTheme = theme === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
  localStorage.setItem('theme', newTheme)
  document.documentElement.setAttribute('data-theme', newTheme)
}
```

## 8. Layout Patterns

### Three-Column Workspace
```css
/* Workspace Container */
.workspace-container {
  display: flex;
  height: 100vh;
  background-color: var(--bg-primary);
}

/* Left Sidebar */
.workspace-sidebar {
  width: 14rem; /* 224px */
  background-color: var(--bg-card);
  border-right: 1px solid rgba(162, 93, 248, 0.2);
  overflow-y: auto;
}

/* Center Content */
.workspace-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

/* Right Panel (Chat) */
.workspace-chat {
  width: 24rem; /* 384px */
  background-color: var(--bg-card);
  border-left: 1px solid rgba(162, 93, 248, 0.2);
  transition: transform 0.3s ease;
}

/* Collapsible chat */
.workspace-chat.collapsed {
  transform: translateX(100%);
}
```

### Modal System
```css
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

/* Modal Content */
.modal-content {
  background-color: var(--bg-card);
  border: 1px solid var(--accent);
  border-radius: var(--radius-lg);
  box-shadow: var(--glow-purple-intense);
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
```

## 9. Special Effects

### Focus Mode
```css
/* Focus mode overlay */
.focus-mode {
  position: fixed;
  inset: 0;
  background-color: var(--bg-primary);
  z-index: 200;
}

/* Focus mode exit controls */
.focus-mode-exit-controls {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: 201;
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.focus-mode-esc-indicator {
  background: rgba(162, 93, 248, 0.1);
  border: 1px solid rgba(162, 93, 248, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  backdrop-filter: blur(8px);
}

.focus-mode-exit-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--accent);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}
```

### Toggle Components
```css
/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-card);
  border: 1px solid var(--accent);
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: var(--accent);
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--accent);
  border-color: var(--accent-soft);
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(24px);
  background-color: white;
}
```

## 10. Animations & Transitions

### Fade In Animations
```css
/* Fade in animation classes */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-delay-1 { animation-delay: 0.1s; }
.animate-delay-2 { animation-delay: 0.2s; }
.animate-delay-3 { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Loading Animations
```css
/* Spinner animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

## 11. Responsive Breakpoints

```css
/* Mobile first approach */
@media (max-width: 768px) {
  .workspace-container {
    flex-direction: column;
  }
  
  .workspace-sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
  }
  
  .floating-actions {
    bottom: var(--space-sm);
    right: var(--space-sm);
  }
  
  .text-hero {
    font-size: clamp(2rem, 6vw, 4rem);
  }
}

@media (max-width: 480px) {
  .card {
    padding: var(--space-md);
  }
  
  .floating-btn {
    width: 44px;
    height: 44px;
  }
}
```

## 12. Usage Examples

### Complete Implementation Example
```html
<!DOCTYPE html>
<html data-theme="dark">
<head>
  <link rel="stylesheet" href="styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="workspace-container">
    <!-- Left Sidebar -->
    <div class="workspace-sidebar">
      <div class="card">
        <h3 class="text-heading">Navigation</h3>
        <p class="text-muted">Sectie inhoud</p>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="workspace-content">
      <div class="card-primary">
        <h1 class="text-hero">Meta-Verslag</h1>
        <p class="text-subtitle">AI-Powered Education</p>
        <p class="text-motto">Transforming Learning Through Intelligence</p>
      </div>
    </div>
    
    <!-- Floating Actions -->
    <div class="floating-actions">
      <button class="floating-btn">
        <svg width="24" height="24"><!-- Icon --></svg>
      </button>
    </div>
  </div>
</body>
</html>
```

### React Component Example
```jsx
import React, { useState, useEffect } from 'react'

const ThemeToggle = () => {
  const [theme, setTheme] = useState('dark')
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }
  
  return (
    <button onClick={toggleTheme} className="floating-btn">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

## 13. Implementation Checklist

- [ ] CSS custom properties gedefinieerd
- [ ] Dark/light mode systeem geïmplementeerd
- [ ] Typography system ingesteld
- [ ] Component library gecreëerd
- [ ] Glow effects en shadows toegevoegd
- [ ] Floating action buttons system
- [ ] Theme toggle functionaliteit
- [ ] Modal system geïmplementeerd
- [ ] Responsive breakpoints ingesteld
- [ ] Animations en transitions toegevoegd
- [ ] Background texture effects
- [ ] Focus mode functionality

---

**Deze design system prompt bevat alle visuele elementen, exact colors, en implementatie details om de Meta-Verslag-App UI perfect te repliceren in elke technologie stack.**