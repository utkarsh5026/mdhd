import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { parseMarkdownIntoSections } from "@/services/section/parsing";
import { MarkdownViewer } from "@/components/features/content-reading";
import { BookOpen, FileText, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeroMain from "./hero";
import MarkdownEditor from "./markdown-editor";
import SectionPreview from "./section-preview";
import ExampleContent from "./example-content";
import Header from "./header";
import { useReadingStore } from "@/components/features/content-reading/store/use-reading-store";

const Homepage = () => {
  const markdownInput = useReadingStore((state) => state.markdownInput);
  const initializeReading = useReadingStore((state) => state.initializeReading);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("write");

  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);

  const parsedSections = useMemo(() => {
    if (!markdownInput.trim()) return [];
    return parseMarkdownIntoSections(markdownInput);
  }, [markdownInput]);

  const handleStartReading = useCallback(() => {
    if (!markdownInput.trim()) return;
    setIsFullscreen(true);
  }, [markdownInput]);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleLoadSample = useCallback(
    (sampleKey: string) => {
      initializeReading(
        SAMPLE_CONTENTS[sampleKey as keyof typeof SAMPLE_CONTENTS]
      );
      setActiveTab("write");
    },
    [initializeReading]
  );

  const wordCount = markdownInput
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (markdownInput) {
      setIsTyping(true);
      timeout = setTimeout(() => setIsTyping(false), 500);
    }
    return () => clearTimeout(timeout);
  }, [markdownInput]);

  if (isFullscreen) {
    return (
      <MarkdownViewer
        markdown={markdownInput}
        exitFullScreen={handleExitFullscreen}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-cascadia-code bg-gradient-to-br from-background via-background to-muted/20">
      {/* Enhanced background with depth */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-background via-primary/3 to-secondary/5"
        style={{ y: backgroundY }}
      />

      <Header />

      <div className="relative z-10 pt-20">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <HeroMain />

          {/* Main Interface */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-4">
              {/* Left Panel - Input & Controls */}
              <div className="lg:col-span-8 space-y-6">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
                    <TabsTrigger value="write" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Write
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="examples" className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      Examples
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="write" className="space-y-4">
                    <MarkdownEditor
                      markdownInput={markdownInput}
                      setMarkdownInput={initializeReading}
                      isTyping={isTyping}
                      wordCount={wordCount}
                      parsedSections={parsedSections}
                      handleStartReading={handleStartReading}
                    />
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-4">
                    <SectionPreview sections={parsedSections} />
                  </TabsContent>

                  <TabsContent value="examples" className="space-y-4">
                    <ExampleContent onLoadSample={handleLoadSample} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SAMPLE_CONTENTS = {
  tutorial: `# Getting Started with MDHD

Welcome to **MDHD** - the intelligent markdown reader that transforms your documentation into focused, interactive reading sessions.

## Core Features

### Smart Section Parsing
MDHD automatically detects your heading structure and creates logical reading sections.

\`\`\`javascript
// Example: Auto-detected code blocks become interactive
function parseMarkdown(content) {
  return content.split('\\n## ').map(section => ({
    title: extractTitle(section),
    content: section,
    wordCount: countWords(section)
  }));
}
\`\`\`

### AI-Powered Assistance
Ask questions about any part of your content using integrated AI models.

> "The best way to learn is to ask questions" - MDHD Philosophy

## Quick Start

1. **Paste** your markdown content
2. **Review** the auto-generated sections  
3. **Start** your focused reading session
4. **Chat** with AI about any section

| Feature | Benefit | Status |
|---------|---------|--------|
| Section Parsing | Better Focus | ✅ Active |
| AI Chat | Instant Help | ✅ Active |
| Theme System | Custom Look | ✅ Active |`,

  documentation: `# API Documentation

## Authentication

All API requests require authentication using your API key.

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.example.com/v1/sections
\`\`\`

## Endpoints

### GET /sections
Retrieve all document sections.

\`\`\`json
{
  "sections": [
    {
      "id": "section-1",
      "title": "Introduction",
      "content": "...",
      "wordCount": 150
    }
  ]
}
\`\`\`

### POST /chat
Send a message to the AI assistant.

## Error Handling

The API uses conventional HTTP response codes to indicate success or failure.

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 500 | Server Error |`,

  guide: `# Machine Learning Guide

Machine learning enables computers to learn patterns from data without explicit programming.

## Types of Learning

### Supervised Learning
Learning with labeled examples to make predictions.

\`\`\`python
from sklearn.linear_model import LinearRegression

# Train a simple model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)
\`\`\`

### Unsupervised Learning
Finding hidden patterns in unlabeled data.

### Reinforcement Learning
Learning through trial and error with rewards and penalties.

## Key Algorithms

1. **Linear Regression** - For continuous predictions
2. **Decision Trees** - For classification tasks
3. **Neural Networks** - For complex pattern recognition
4. **K-Means** - For clustering data

> "In God we trust, all others bring data" - W. Edwards Deming`,
};

export default Homepage;
