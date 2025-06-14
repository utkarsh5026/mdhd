# MDHD 📚✨

> **M**arkdown **H**igh **D**efinition - Transform your markdown into focused reading sessions

[![React](https://img.shields.io/badge/React-18+-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://choosealicense.com/licenses/mit/)

---

## 🌟 What is MDHD?

MDHD is a revolutionary markdown reader that transforms your lengthy documents into  **digestible, focused reading sessions** . Instead of scrolling through endless walls of text, MDHD intelligently breaks your content into sections based on headings, presenting each as a beautiful, distraction-free card.

Think of it as **Netflix for your documentation** 🎬 - where each section becomes an episode in your learning journey!

### 🎯 The Problem We Solve

Ever tried reading a 50-page markdown documentation? Your brain gets overwhelmed, you lose focus, and important information gets lost in the noise. Traditional markdown viewers show everything at once, creating:

* **Information overload** 🧠💥
* **Loss of reading progress** 📍❌
* **Poor mobile reading experience** 📱😵
* **Lack of focus and retention** 🎯❌

### 💡 Our Solution

MDHD revolutionizes markdown reading by:

1. **Intelligent Section Parsing** 🔍 - Automatically detects headings (`#`, `##`) and creates logical breaks
2. **Card-Based Navigation** 🃏 - Each section becomes a focused reading card
3. **Immersive Full-Screen Mode** 🖥️ - Eliminates distractions for deep focus
4. **Progress Tracking** 📊 - Know exactly where you are and how much is left
5. **Mobile-First Design** 📱 - Perfect reading experience on any device

---

## ✨ Key Features

### 🔥 Core Functionality

#### 📝 Smart Markdown Parsing

* **Automatic section detection** based on `#` and `##` headings
* **Preserves all markdown formatting** (code blocks, tables, links, images)
* **Word count estimation** for each section
* **Reading time calculation** based on average reading speed

#### 🎴 Card-Based Reading Experience

* **One section at a time** for maximum focus
* **Smooth transitions** between sections with beautiful animations
* **Swipe navigation** on mobile devices (left/right to navigate)
* **Keyboard shortcuts** for power users (`←`, `→`, `Space`, `Esc`)

#### 🎨 Rich Customization Options

**Reading Settings:**

* **20+ Professional Fonts** including serif, sans-serif, and monospace options
* **Optimized for long-form reading** (Literata, Spectral, EB Garamond, etc.)
* **Accessibility fonts** (Atkinson Hyperlegible) for better readability

**Theme System:**

* **25+ Beautiful Themes** across multiple categories
* **Dark, Light, Developer, and Unique** theme collections
* **Real-time theme switching** without losing reading progress
* **System preference detection** for automatic dark/light mode

#### 📊 Progress & Analytics

* **Section-by-section progress tracking** 📈
* **Reading time estimation** for remaining content ⏱️
* **Visual progress indicators** with completion states ✅
* **Table of contents** with quick navigation 📚

#### 💻 Code Highlighting Excellence

* **25+ Syntax themes** (One Dark, VS Code Dark+, Dracula, etc.)
* **Collapsible code blocks** to save screen space
* **One-click copy functionality** 📋
* **Auto-language detection** with proper icons
* **Mobile-optimized** horizontal scrolling

### 🚀 Advanced Features

#### 📱 Mobile Optimization

* **Touch-friendly navigation** with large tap targets
* **Swipe gestures** for intuitive section navigation
* **Responsive typography** that adapts to screen size
* **Auto-hiding controls** for distraction-free reading

#### ⌨️ Keyboard Navigation

```
← / ↑     Previous section
→ / ↓ / ⎵ Next section
Esc       Hide/show controls
```

#### 🎭 Animation & UX

* **Framer Motion** powered smooth animations
* **Scroll-triggered** entrance effects
* **Hover states** and micro-interactions
* **Loading states** and skeleton screens

---

## 🏗️ Architecture Deep Dive

### 🧠 How Section Parsing Works

MDHD's intelligent parsing system works through several steps:

1. **Markdown Analysis** 🔍
   ```typescript
   // The parser scans for heading patterns
   const h1Regex = /^#\s+(.+)$/;
   const h2Regex = /^##\s+(.+)$/;
   ```
2. **Section Boundary Detection** 📍
   * Each `#` or `##` heading creates a new section
   * Content before the first heading becomes an "Introduction" section
   * Code blocks are preserved and never split
3. **Metadata Extraction** 📊
   * Word count per section
   * Reading time estimation (250 WPM average)
   * Section hierarchy (H1 vs H2)
4. **Slug Generation** 🔗
   * URL-friendly IDs for each section
   * Enables deep linking and navigation

### 🎨 Theme System Architecture

```typescript
interface ThemeOption {
  name: string;
  category: string;
  background: string;
  foreground: string;
  primary: string;
  // ... other color properties
}
```

**Categories:**

* **Dark** 🌙 - For night reading and reduced eye strain
* **Light** ☀️ - Clean, bright themes for daytime reading
* **Developer** 👨‍💻 - Code-focused themes with high contrast
* **Unique** 🎨 - Creative and artistic color combinations

### 📱 Responsive Design Philosophy

MDHD follows a  **mobile-first approach** :

1. **Base styles** designed for mobile (320px+)
2. **Progressive enhancement** for tablets (768px+)
3. **Desktop optimization** for large screens (1024px+)

```css
/* Mobile-first approach */
.text-sm      /* Base mobile size */
.xs:text-base /* Small phones */
.sm:text-lg   /* Tablets */
.lg:text-xl   /* Desktop */
```

---

## 🛠️ Technology Stack

### ⚛️ Frontend Framework

* **React 18+** - Modern React with hooks and concurrent features
* **TypeScript 5+** - Type safety and better developer experience
* **Vite** - Lightning-fast build tool and dev server

### 🎨 Styling & UI

* **Tailwind CSS** - Utility-first CSS framework
* **Framer Motion** - Production-ready motion library
* **Radix UI** - Unstyled, accessible UI primitives
* **Lucide React** - Beautiful & consistent icon library

### 📝 Markdown Processing

* **React Markdown** - Markdown to React component renderer
* **Remark GFM** - GitHub Flavored Markdown support
* **React Syntax Highlighter** - Code syntax highlighting

### 🗃️ State Management

* **Zustand** - Lightweight state management
* **Local Storage persistence** - Settings survival across sessions

### 📱 Mobile Features

* **React Swipeable** - Touch gesture handling
* **Intersection Observer** - Scroll-based animations
* **Responsive design** - Mobile-first approach

---

## 🚀 Getting Started

### 📋 Prerequisites

Before you begin, ensure you have:

* **Node.js 18+** installed
* **npm** or **yarn** package manager
* A modern browser (Chrome, Firefox, Safari, Edge)

### ⚡ Quick Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mdhd.git

# Navigate to project directory
cd mdhd

# Install dependencies
npm install

# Start development server
npm run dev

# Open your browser to http://localhost:5173
```

### 🔧 Build for Production

```bash
# Create optimized production build
npm run build

# Preview the production build locally
npm run preview
```

---

## 📖 Usage Guide

### 🎬 Basic Usage

1. **Paste Your Markdown** 📝
   * Copy your markdown content into the text area
   * MDHD automatically detects sections based on headings
2. **Start Reading** 🚀
   * Click "Start Focused Reading"
   * Enter immersive full-screen mode
3. **Navigate Sections** 🧭
   * Use arrow keys, swipe gestures, or on-screen controls
   * Track your progress in real-time

### ✏️ Markdown Best Practices for MDHD

```markdown
# Main Section Title
This content will become the first reading card.

## Subsection
This creates a sub-level section.

### Details (treated as content)
H3 and below are treated as content, not section breaks.

```javascript
// Code blocks are preserved perfectly
function example() {
  return "syntax highlighting included!";
}
```

> Blockquotes, tables, and all formatting is maintained.

```

### 🎛️ Customization Options

#### Font Selection
- **Serif fonts** for traditional reading (Georgia, Merriweather, Lora)
- **Sans-serif fonts** for modern feel (Inter, Open Sans, Source Sans Pro)
- **Accessibility fonts** for improved readability (Atkinson Hyperlegible)
- **Monospace fonts** for technical content (Cascadia Code, Fira Code)

#### Theme Categories
- **Professional** - Business and documentation themes
- **Creative** - Artistic and unique color combinations  
- **Developer** - High-contrast themes for code-heavy content
- **Accessibility** - High-contrast themes for visual accessibility

---

## 🎨 Customization & Theming

### 🎭 Creating Custom Themes

MDHD's theme system is built for extensibility:

```typescript
const customTheme: ThemeOption = {
  name: "My Custom Theme",
  category: "Unique",
  background: "#1a1a1a",
  foreground: "#ffffff", 
  primary: "#ff6b6b",
  // ... other properties
};
```

### 🖼️ Color Psychology in Reading

Our themes are carefully designed based on reading research:

* **Dark themes** 🌙 - Reduce eye strain in low light
* **Warm colors** 🔥 - Create comfortable reading atmosphere
* **High contrast** ⚡ - Improve text legibility
* **Muted accents** 🎨 - Avoid distraction from content

### 📝 Typography Choices

Each font family is chosen for specific reading scenarios:

| Font Category           | Best For                     | Examples                         |
| ----------------------- | ---------------------------- | -------------------------------- |
| **Serif**         | Long-form reading, books     | Literata, Spectral, EB Garamond  |
| **Sans-serif**    | Digital screens, UI text     | Inter, Source Sans Pro, IBM Plex |
| **Monospace**     | Code, technical docs         | Cascadia Code, Fira Code         |
| **Accessibility** | Dyslexia, visual impairments | Atkinson Hyperlegible            |

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🐛 Bug Reports

* Use GitHub Issues with detailed reproduction steps
* Include browser/device information
* Provide sample markdown if relevant

### ✨ Feature Requests

* Check existing issues first
* Describe the use case and benefits
* Consider implementation complexity

### 💻 Development Setup

```bash
# Fork the repository
git clone https://github.com/utkarsh5026/mdhd.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and commit
git commit -m "Add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Create a Pull Request
```

### 📋 Code Standards

* **TypeScript** for type safety
* **ESLint + Prettier** for code formatting
* **Conventional Commits** for clear history
* **Component documentation** with JSDoc

---


## 📄 License

This project is licensed under the MIT License

```
MIT License - you're free to use, modify, and distribute this software!
```

---

## 🙏 Acknowledgments

### 📚 Inspiration

* **Medium's distraction-free reading** experience
* **Notion's** clean typography and theming
* **GitHub's** markdown rendering excellence
* **Apple's** focus on reading accessibility

### 🛠️ Built With Love Using

* **React ecosystem** for component architecture
* **Tailwind CSS** for rapid styling
* **Framer Motion** for delightful animations
* **Open source community** for amazing tools

### 🎨 Design Philosophy

Inspired by the principle that **great design is invisible** - MDHD gets out of your way so you can focus on what matters:  **the content** .

---

## 📞 Connect & Support

### 🐞 Found a Bug?

[Create an Issue](https://github.com/utkarsh5026/mdhd/issues/new?assignees=&labels=bug&template=bug_report.md)

### 💡 Have an Idea?

[Request a Feature](https://github.com/utkarsh5026/mdhd/issues/new?assignees=&labels=enhancement&template=feature_request.md)

### 💬 Want to Chat?

* **Twitter** : [@UtkarshPriyad10](https://x.com/UtkarshPriyad10)
* **Discord** : [Join our community](https://discord.gg/mdhd)
* **Email** : utkarshpriyadarshi5026@gmail.com

---

<div align="center">
### 🌟 Star us on GitHub if MDHD helped you read better!

**Made with ❤️ for the developer and content creator community**

*Transform your reading experience today* ✨

</div>
