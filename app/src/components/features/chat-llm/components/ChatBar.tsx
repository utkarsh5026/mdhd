import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

import { IoSend, IoClose, IoWarning } from "react-icons/io5";
import { RiRobot2Fill, RiLoader4Line } from "react-icons/ri";
import ModelProvider from "./ModelProvider";
import SectionDropdown from "./SectionDropdown";
import SelectedSections from "./SelectedSections";
import type { MarkdownSection } from "@/services/section/parsing";
import Messages from "./Messages";
import SettingsDropdown from "./SettingsDropdown";
import { useMDHDRAG } from "../hooks/use-rag";
import { useLLM } from "../hooks/use-llm";
import type { SeletctedSection, LLMProviderId } from "../types";
import { SiAnthropic, SiGoogle, SiOpenai } from "react-icons/si";

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
  const rag = useMDHDRAG({
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  });

  console.log(import.meta.env.VITE_OPENAI_API_KEY);

  const {
    isInitialized: llmInitialized,
    isLoading: llmLoading,
    error: llmError,
    messages,
    selectedProvider,
    selectedModel,
    addSystemMessage,
    availableProviders,
    streamMessage,
    updateProvider,
  } = useLLM({
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
  });

  const [inputValue, setInputValue] = useState("");
  const [selectedSections, setSelectedSections] = useState<SeletctedSection[]>(
    []
  );
  const [sectionsFilter, setSectionsFilter] = useState("");
  const [sectionsDropdownOpen, setSectionsDropdownOpen] = useState(false);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null!);

  // FIX: Debounced scroll only for complete messages
  const scrollToBottomRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    // Clear existing timeout
    if (scrollToBottomRef.current) {
      clearTimeout(scrollToBottomRef.current);
    }

    // Only scroll when streaming is complete or new message added
    const lastMessage = messages[messages.length - 1];
    const shouldScroll = !lastMessage?.isStreaming || messages.length === 1;

    if (shouldScroll) {
      scrollToBottomRef.current = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100); // Small delay to prevent excessive scrolling
    }

    return () => {
      if (scrollToBottomRef.current) {
        clearTimeout(scrollToBottomRef.current);
      }
    };
  }, [messages.length, messages[messages.length - 1]?.isStreaming]);

  useEffect(() => {
    if (
      currentSection &&
      !selectedSections.some((section) => section.id === currentSection.id)
    ) {
      setSelectedSections((prev) => [
        ...prev,
        { id: currentSection.id, title: currentSection.title },
      ]);
    }
  }, [currentSection, selectedSections]);

  // Add welcome message when initialized
  useEffect(() => {
    if (llmInitialized && messages.length === 0) {
      addSystemMessage(`🤖 Welcome to MDHD AI Assistant! 

Select sections and choose a model to start asking questions about your document.

${
  currentSection
    ? `Currently reading: "${currentSection.title}"`
    : "Ready to help!"
}`);
    }
  }, [llmInitialized, messages.length, currentSection, addSystemMessage]);

  const handleSendMessage = async () => {
    if (
      !inputValue.trim() ||
      llmLoading ||
      !llmInitialized ||
      selectedSections.length === 0
    ) {
      return;
    }

    const selectedSectionData = sections.filter((section) =>
      selectedSections.some(
        (selectedSection) => selectedSection.id === section.id
      )
    );

    try {
      await streamMessage(inputValue, {
        sections: selectedSectionData,
        provider: selectedProvider,
        model: selectedModel,
      });
      setInputValue("");
    } catch (error) {
      console.error("Query failed:", error);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.some((section) => section.id === sectionId)
        ? prev.filter((section) => section.id !== sectionId)
        : [
            ...prev,
            {
              id: sectionId,
              title:
                sections.find((section) => section.id === sectionId)?.title ||
                "",
            },
          ]
    );
  };

  const handleRemoveSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.filter((section) => section.id !== sectionId)
    );
  };

  const handleModelSelect = (providerId: LLMProviderId, model: string) => {
    updateProvider(providerId, model);
    setModelPopoverOpen(false);
  };

  const filteredSections = sections.filter((section) =>
    section.title.toLowerCase().includes(sectionsFilter.toLowerCase())
  );

  const getSelectedSectionsData = () => {
    return sections.filter((section) =>
      selectedSections.some(
        (selectedSection) => selectedSection.id === section.id
      )
    );
  };

  if (!isVisible) return null;

  const error = rag.error || llmError;
  const isLoading = rag.isIndexing || llmLoading;

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
            {isLoading && (
              <RiLoader4Line className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <SettingsDropdown
              providers={availableProviders}
              getProviderIcon={getProviderIcon}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <IoClose className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <IoWarning className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Selected Sections Chips */}
        {selectedSections.length > 0 && currentSection && (
          <SelectedSections
            getSelectedSectionsData={getSelectedSectionsData}
            currentSection={currentSection}
            handleRemoveSection={handleRemoveSection}
          />
        )}
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4">
          <Messages
            messages={messages}
            isQueryLoading={llmLoading}
            getProviderIcon={getProviderIcon}
            messageEndRef={messagesEndRef}
          />
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="p-4 border-t border-border">
        <div className="mb-4">
          <div className="flex gap-2">
            {/* Model Selection */}
            <div className="flex-1">
              <ModelProvider
                modelPopoverOpen={modelPopoverOpen}
                setModelPopoverOpen={setModelPopoverOpen}
                isInitialized={llmInitialized}
                providers={availableProviders}
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
                handleModelSelect={handleModelSelect}
                getProviderIcon={getProviderIcon}
              />
            </div>

            <div className="flex-1">
              <SectionDropdown
                sectionsDropdownOpen={sectionsDropdownOpen}
                setSectionsDropdownOpen={setSectionsDropdownOpen}
                isInitialized={rag.isInitialized}
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
                !llmInitialized
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
                !llmInitialized || llmLoading || selectedSections.length === 0
              }
              className="text-sm rounded-2xl border-1 border-border bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/30"
            />
            <motion.div
              animate={{
                scale:
                  !llmInitialized ||
                  llmLoading ||
                  !inputValue.trim() ||
                  selectedSections.length === 0
                    ? 0.95
                    : 1,
              }}
              whileHover={
                !llmInitialized ||
                llmLoading ||
                !inputValue.trim() ||
                selectedSections.length === 0
                  ? {}
                  : {
                      scale: 1.05,
                      rotate: [0, -2, 2, 0],
                    }
              }
              whileTap={
                !llmInitialized ||
                llmLoading ||
                !inputValue.trim() ||
                selectedSections.length === 0
                  ? {}
                  : { scale: 0.95 }
              }
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
                rotate: { duration: 0.3 },
              }}
            >
              <Button
                onClick={handleSendMessage}
                disabled={
                  !llmInitialized ||
                  llmLoading ||
                  !inputValue.trim() ||
                  selectedSections.length === 0
                }
                size="sm"
                className={`
                  shrink-0 px-3 rounded-2xl relative overflow-hidden group
                  ${
                    !llmInitialized ||
                    llmLoading ||
                    !inputValue.trim() ||
                    selectedSections.length === 0
                      ? "bg-muted/50 border border-border/50 text-muted-foreground/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border border-primary/40 text-primary hover:from-primary/30 hover:via-primary/50 hover:to-primary/30 hover:border-primary/60 hover:text-primary-foreground shadow-lg hover:shadow-primary/25"
                  }
                  transition-all duration-300 ease-out
                  before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent
                  before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
                  after:absolute after:inset-0 after:bg-gradient-to-r after:from-primary/5 after:to-primary/15 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300
                `}
              >
                <motion.div
                  animate={
                    llmLoading
                      ? {
                          rotate: 360,
                          scale: [1, 1.1, 1],
                        }
                      : {}
                  }
                  transition={
                    llmLoading
                      ? {
                          rotate: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          },
                          scale: {
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                        }
                      : {}
                  }
                >
                  <IoSend className="w-4 h-4 relative z-10" />
                </motion.div>

                {/* Animated glow effect */}
                {!llmInitialized ||
                llmLoading ||
                !inputValue.trim() ||
                selectedSections.length === 0 ? null : (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/30 blur-md -z-10"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const getProviderIcon = (providerId: LLMProviderId) => {
  switch (providerId) {
    case "openai":
      return <SiOpenai className="w-4 h-4" />;
    case "anthropic":
      return <SiAnthropic className="w-4 h-4" />;
    case "google":
      return <SiGoogle className="w-4 h-4" />;
    default:
      return <RiRobot2Fill className="w-4 h-4" />;
  }
};

export default MDHDChatSidebar;
