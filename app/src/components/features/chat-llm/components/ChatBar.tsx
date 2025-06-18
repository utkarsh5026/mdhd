import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

import { IoSend, IoClose, IoWarning } from "react-icons/io5";
import { SiOpenai, SiGoogle } from "react-icons/si";
import { RiRobot2Fill, RiBrainFill, RiLoader4Line } from "react-icons/ri";
import ModelProvider from "./ModelProvider";
import SectionDropdown from "./SectionDropdown";
import SelectedSections from "./SelectedSections";
import type { MarkdownSection } from "@/services/section/parsing";
import Messages from "./Messages";

// Mock the RAG hook for demo
const useRAG = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => setIsInitialized(true), 1000);
  }, []);

  const mockProviders = [
    {
      id: "openai",
      name: "OpenAI",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
      icon: SiOpenai,
      description: "Powerful and versatile AI models",
    },
    {
      id: "anthropic",
      name: "Claude",
      models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
      icon: RiBrainFill,
      description: "Excellent for analysis and reasoning",
    },
    {
      id: "google",
      name: "Gemini",
      models: ["gemini-1.5-pro", "gemini-1.5-flash"],
      icon: SiGoogle,
      description: "Fast and efficient responses",
    },
  ];

  const mockSections = [
    {
      id: "1",
      title: "Introduction",
      content: "Introduction content...",
      level: 1,
      wordCount: 150,
      index: 0,
    },
    {
      id: "2",
      title: "Smart Markdown Parsing",
      content: "Parsing content...",
      level: 1,
      wordCount: 300,
      index: 1,
    },
    {
      id: "3",
      title: "Section Detection Algorithms",
      content: "Detection algorithms...",
      level: 2,
      wordCount: 200,
      index: 2,
    },
    {
      id: "4",
      title: "Code Block Handling",
      content: "Code processing...",
      level: 2,
      wordCount: 250,
      index: 3,
    },
    {
      id: "5",
      title: "Reading Optimization Techniques",
      content: "Optimization techniques...",
      level: 1,
      wordCount: 400,
      index: 4,
    },
    {
      id: "6",
      title: "User Interface Design Principles",
      content: "UI design content...",
      level: 1,
      wordCount: 320,
      index: 5,
    },
  ];

  const queryDocument = async (query: string, context: any) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      response: `Based on the selected sections (${
        context.selectedSections.length
      } sections), I can explain that ${query.toLowerCase()}. The content demonstrates advanced markdown processing using ${
        context.model
      } analysis. This involves intelligent parsing algorithms that detect heading structures and create logical content boundaries.`,
      sources: [
        {
          sectionId: context.selectedSections[0] || "2",
          sectionTitle: "Smart Markdown Parsing",
          excerpt:
            "The parsing system uses sophisticated algorithms to identify section boundaries...",
          relevanceScore: 0.92,
        },
      ],
      sectionsUsed: mockSections.filter((s) =>
        context.selectedSections.includes(s.id)
      ),
    };
  };

  return {
    isInitialized,
    isIndexing,
    error,
    indexDocument: async () => {},
    queryDocument,
    getAvailableProviders: () => mockProviders,
    getCurrentSections: () => mockSections,
  };
};

interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  selectedSections?: string[];
  model?: string;
  provider?: string;
  sources?: Array<{
    sectionId: string;
    sectionTitle: string;
    excerpt: string;
    relevanceScore: number;
  }>;
}

interface MDHDChatSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  sections: MarkdownSection[];
  currentSection: MarkdownSection | null;
}

const MDHDChatSidebar: React.FC<MDHDChatSidebarProps> = ({
  isVisible,
  onToggle,
  sections,
  currentSection,
}) => {
  const rag = useRAG();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [sectionsFilter, setSectionsFilter] = useState("");
  const [sectionsDropdownOpen, setSectionsDropdownOpen] = useState(false);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const providers = rag.getAvailableProviders();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-select current section when it changes
  useEffect(() => {
    if (currentSection && !selectedSections.includes(currentSection.id)) {
      setSelectedSections((prev) => [currentSection.id, ...prev]);
    }
  }, [currentSection, selectedSections]);

  // Initialize with welcome message
  useEffect(() => {
    if (rag.isInitialized && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          type: "system",
          content: `🤖 Welcome to MDHD AI Assistant! 

Select sections and choose a model to start asking questions about your document.

${
  currentSection
    ? `Currently reading: "${currentSection.title}"`
    : "Ready to help!"
}`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [rag.isInitialized, messages.length, currentSection]);

  const handleSendMessage = async () => {
    if (
      !inputValue.trim() ||
      isQueryLoading ||
      !rag.isInitialized ||
      selectedSections.length === 0
    ) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
      selectedSections,
      model: selectedModel,
      provider: selectedProvider,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsQueryLoading(true);

    try {
      const result = await rag.queryDocument(inputValue, {
        selectedSections,
        provider: selectedProvider,
        model: selectedModel,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: result.response,
        timestamp: new Date(),
        selectedSections,
        model: selectedModel,
        provider: selectedProvider,
        sources: result.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Query failed:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I apologize, but I encountered an error processing your question. Please check your API configuration and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsQueryLoading(false);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleRemoveSection = (sectionId: string) => {
    setSelectedSections((prev) => prev.filter((id) => id !== sectionId));
  };

  const handleModelSelect = (providerId: string, model: string) => {
    setSelectedProvider(providerId);
    setSelectedModel(model);
    setModelPopoverOpen(false);
  };

  const filteredSections = sections.filter((section) =>
    section.title.toLowerCase().includes(sectionsFilter.toLowerCase())
  );

  const getSelectedSectionsData = () => {
    return sections.filter((section) => selectedSections.includes(section.id));
  };

  const getProviderIcon = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (provider?.icon) {
      const IconComponent = provider.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <RiRobot2Fill className="w-4 h-4" />;
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-full w-1/3 bg-card border-r border-border z-50 flex flex-col shadow-2xl font-cascadia-code"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RiRobot2Fill className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">AI Assistant</h2>
            {rag.isIndexing && (
              <RiLoader4Line className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <IoClose className="w-4 h-4" />
          </Button>
        </div>

        {/* Error Display */}
        {rag.error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <IoWarning className="w-4 h-4" />
              <span>{rag.error}</span>
            </div>
          </div>
        )}

        {/* Model and Section Selection - Side by Side */}

        {/* Selected Sections Chips */}
        {selectedSections.length > 0 && currentSection && (
          <SelectedSections
            getSelectedSectionsData={getSelectedSectionsData}
            currentSection={currentSection}
            handleRemoveSection={handleRemoveSection}
          />
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <ScrollArea className="flex-1 px-4">
          <Messages
            messages={messages}
            isQueryLoading={isQueryLoading}
            getProviderIcon={getProviderIcon}
            messageEndRef={messagesEndRef}
          />
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border">
          <div className="mb-4">
            <div className="flex gap-2">
              {/* Model Selection */}
              <div className="flex-1">
                <ModelProvider
                  modelPopoverOpen={modelPopoverOpen}
                  setModelPopoverOpen={setModelPopoverOpen}
                  rag={rag}
                  providers={providers}
                  selectedProvider={selectedProvider}
                  selectedModel={selectedModel}
                  handleModelSelect={handleModelSelect}
                  getProviderIcon={getProviderIcon}
                />
              </div>

              {/* Section Selection */}
              <div className="flex-1">
                <SectionDropdown
                  sectionsDropdownOpen={sectionsDropdownOpen}
                  setSectionsDropdownOpen={setSectionsDropdownOpen}
                  rag={rag}
                  selectedSections={selectedSections}
                  sectionsFilter={sectionsFilter}
                  setSectionsFilter={setSectionsFilter}
                  filteredSections={filteredSections}
                  handleSectionToggle={handleSectionToggle}
                  currentSection={currentSection}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={
                  !rag.isInitialized
                    ? "Initializing..."
                    : selectedSections.length === 0
                    ? "Select sections first..."
                    : "Ask about the selected sections..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSendMessage()
                }
                disabled={
                  !rag.isInitialized ||
                  isQueryLoading ||
                  selectedSections.length === 0
                }
                className="text-sm rounded-2xl border-1 border-border bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/30"
              />
              <Button
                onClick={handleSendMessage}
                disabled={
                  !rag.isInitialized ||
                  isQueryLoading ||
                  !inputValue.trim() ||
                  selectedSections.length === 0
                }
                size="sm"
                className="shrink-0 px-3 rounded-2xl border-1 border-border bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/30"
              >
                <IoSend className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MDHDChatSidebar;
