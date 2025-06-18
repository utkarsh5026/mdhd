import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { MarkdownSection } from "@/services/section/parsing";

export type ChatMessageType = "user" | "assistant" | "system";

export type SeletctedSection = {
  id: string;
  title: string;
  excerpt?: string;
  relevanceScore?: number;
};

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  selectedSections?: SeletctedSection[];
  model?: string;
  provider?: string;
  sources?: Array<SeletctedSection>;
}

interface ChatState {
  // Chat messages
  messages: ChatMessage[];
  inputValue: string;
  isQueryLoading: boolean;

  // Section management
  selectedSections: string[];
  sectionsFilter: string;

  // Model/Provider selection
  selectedProvider: string;
  selectedModel: string;

  // UI state
  sectionsDropdownOpen: boolean;
  modelPopoverOpen: boolean;
  isVisible: boolean;

  // Actions
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setInputValue: (value: string) => void;
  setIsQueryLoading: (loading: boolean) => void;

  // Section actions
  toggleSection: (sectionId: string) => void;
  removeSection: (sectionId: string) => void;
  clearSelectedSections: () => void;
  setSectionsFilter: (filter: string) => void;
  autoSelectCurrentSection: (currentSection: MarkdownSection | null) => void;

  // Model/Provider actions
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  selectModel: (providerId: string, model: string) => void;

  // UI actions
  setSectionsDropdownOpen: (open: boolean) => void;
  setModelPopoverOpen: (open: boolean) => void;
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;

  // Initialize with welcome message
  initializeWelcomeMessage: (currentSection?: MarkdownSection | null) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [],
        inputValue: "",
        isQueryLoading: false,
        selectedSections: [],
        sectionsFilter: "",
        selectedProvider: "openai",
        selectedModel: "gpt-4o",
        sectionsDropdownOpen: false,
        modelPopoverOpen: false,
        isVisible: false,

        // Message actions
        addMessage: (message) =>
          set(
            (state) => ({
              messages: [...state.messages, message],
            }),
            false,
            "addMessage"
          ),

        clearMessages: () => set({ messages: [] }, false, "clearMessages"),

        setInputValue: (value) =>
          set({ inputValue: value }, false, "setInputValue"),

        setIsQueryLoading: (loading) =>
          set({ isQueryLoading: loading }, false, "setIsQueryLoading"),

        // Section actions
        toggleSection: (sectionId) =>
          set(
            (state) => ({
              selectedSections: state.selectedSections.includes(sectionId)
                ? state.selectedSections.filter((id) => id !== sectionId)
                : [...state.selectedSections, sectionId],
            }),
            false,
            "toggleSection"
          ),

        removeSection: (sectionId) =>
          set(
            (state) => ({
              selectedSections: state.selectedSections.filter(
                (id) => id !== sectionId
              ),
            }),
            false,
            "removeSection"
          ),

        clearSelectedSections: () =>
          set({ selectedSections: [] }, false, "clearSelectedSections"),

        setSectionsFilter: (filter) =>
          set({ sectionsFilter: filter }, false, "setSectionsFilter"),

        autoSelectCurrentSection: (currentSection) => {
          const state = get();
          if (
            currentSection &&
            !state.selectedSections.includes(currentSection.id)
          ) {
            set(
              (state) => ({
                selectedSections: [
                  currentSection.id,
                  ...state.selectedSections,
                ],
              }),
              false,
              "autoSelectCurrentSection"
            );
          }
        },

        // Model/Provider actions
        setSelectedProvider: (provider) =>
          set({ selectedProvider: provider }, false, "setSelectedProvider"),

        setSelectedModel: (model) =>
          set({ selectedModel: model }, false, "setSelectedModel"),

        selectModel: (providerId, model) =>
          set(
            {
              selectedProvider: providerId,
              selectedModel: model,
              modelPopoverOpen: false,
            },
            false,
            "selectModel"
          ),

        // UI actions
        setSectionsDropdownOpen: (open) =>
          set({ sectionsDropdownOpen: open }, false, "setSectionsDropdownOpen"),

        setModelPopoverOpen: (open) =>
          set({ modelPopoverOpen: open }, false, "setModelPopoverOpen"),

        toggleVisibility: () =>
          set(
            (state) => ({ isVisible: !state.isVisible }),
            false,
            "toggleVisibility"
          ),

        setVisibility: (visible) =>
          set({ isVisible: visible }, false, "setVisibility"),

        // Initialize welcome message
        initializeWelcomeMessage: (currentSection) => {
          const state = get();
          if (state.messages.length === 0) {
            const welcomeMessage: ChatMessage = {
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
            };

            set(
              (state) => ({
                messages: [...state.messages, welcomeMessage],
              }),
              false,
              "initializeWelcomeMessage"
            );
          }
        },
      }),
      {
        name: "mdhd-chat-store",
        partialize: (state) => ({
          // Only persist these values
          selectedProvider: state.selectedProvider,
          selectedModel: state.selectedModel,
          isVisible: state.isVisible,
        }),
      }
    ),
    {
      name: "mdhd-chat-store",
    }
  )
);

export const useChatMessages = () => useChatStore((state) => state.messages);
export const useInputValue = () => useChatStore((state) => state.inputValue);
export const useSelectedSections = () =>
  useChatStore((state) => state.selectedSections);
export const useModelSelection = () =>
  useChatStore((state) => ({
    selectedProvider: state.selectedProvider,
    selectedModel: state.selectedModel,
  }));
export const useUIState = () =>
  useChatStore((state) => ({
    sectionsDropdownOpen: state.sectionsDropdownOpen,
    modelPopoverOpen: state.modelPopoverOpen,
    isVisible: state.isVisible,
    isQueryLoading: state.isQueryLoading,
  }));

export const useChatActions = () =>
  useChatStore((state) => ({
    addMessage: state.addMessage,
    clearMessages: state.clearMessages,
    setInputValue: state.setInputValue,
    setIsQueryLoading: state.setIsQueryLoading,
    toggleSection: state.toggleSection,
    removeSection: state.removeSection,
    clearSelectedSections: state.clearSelectedSections,
    setSectionsFilter: state.setSectionsFilter,
    autoSelectCurrentSection: state.autoSelectCurrentSection,
    setSelectedProvider: state.setSelectedProvider,
    setSelectedModel: state.setSelectedModel,
    selectModel: state.selectModel,
    setSectionsDropdownOpen: state.setSectionsDropdownOpen,
    setModelPopoverOpen: state.setModelPopoverOpen,
    toggleVisibility: state.toggleVisibility,
    setVisibility: state.setVisibility,
    initializeWelcomeMessage: state.initializeWelcomeMessage,
  }));
