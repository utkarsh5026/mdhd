import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ComponentSelection } from "../../markdown-render/services/component-service";

export type ChatMessageType = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  selections?: ComponentSelection[]; // What was selected when asking
  model?: string;
  provider?: string;
  isStreaming?: boolean;
}

interface SimpleChatState {
  // Chat messages
  messages: ChatMessage[];
  inputValue: string;
  isQueryLoading: boolean;

  // Selected components for context
  selectedComponents: ComponentSelection[];

  // Current section info
  currentSectionId: string;
  currentSectionTitle: string;

  // Model/Provider selection
  selectedProvider: string;
  selectedModel: string;

  // UI state
  isVisible: boolean;
  askDialogOpen: boolean;
  currentAskComponent: ComponentSelection | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setInputValue: (value: string) => void;
  setIsQueryLoading: (loading: boolean) => void;

  // Component selection
  addComponentToChat: (component: ComponentSelection) => void;
  removeComponent: (componentId: string) => void;
  clearComponents: () => void;

  // Ask dialog
  openAskDialog: (component: ComponentSelection) => void;
  closeAskDialog: () => void;
  askAboutComponent: (component: ComponentSelection, question: string) => void;

  // Section management
  setCurrentSection: (sectionId: string, sectionTitle: string) => void;

  // Model/Provider
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;

  // UI actions
  toggleVisibility: () => void;
  setVisibility: (visible: boolean) => void;

  // Initialize welcome
  initializeWelcome: () => void;
}

export const useSimpleChatStore = create<SimpleChatState>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [],
        inputValue: "",
        isQueryLoading: false,
        selectedComponents: [],
        currentSectionId: "",
        currentSectionTitle: "",
        selectedProvider: "openai",
        selectedModel: "gpt-4o",
        isVisible: false,
        askDialogOpen: false,
        currentAskComponent: null,

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

        // Component selection
        addComponentToChat: (component) =>
          set(
            (state) => {
              // Don't add duplicates
              const exists = state.selectedComponents.some(
                (c) => c.id === component.id
              );
              if (exists) return state;

              return {
                selectedComponents: [...state.selectedComponents, component],
                isVisible: true, // Auto-open chat when something is added
              };
            },
            false,
            "addComponentToChat"
          ),

        removeComponent: (componentId) =>
          set(
            (state) => ({
              selectedComponents: state.selectedComponents.filter(
                (c) => c.id !== componentId
              ),
            }),
            false,
            "removeComponent"
          ),

        clearComponents: () =>
          set({ selectedComponents: [] }, false, "clearComponents"),

        // Ask dialog
        openAskDialog: (component) =>
          set(
            {
              askDialogOpen: true,
              currentAskComponent: component,
              inputValue: `What does this ${component.type} do?`, // Default question
            },
            false,
            "openAskDialog"
          ),

        closeAskDialog: () =>
          set(
            {
              askDialogOpen: false,
              currentAskComponent: null,
              inputValue: "",
            },
            false,
            "closeAskDialog"
          ),

        askAboutComponent: (component, question) => {
          const state = get();

          // Add user message
          const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            type: "user",
            content: question,
            timestamp: new Date(),
            selections: [component],
          };

          state.addMessage(userMessage);

          // Add component to context if not already there
          const exists = state.selectedComponents.some(
            (c) => c.id === component.id
          );
          if (!exists) {
            state.addComponentToChat(component);
          }

          // Close ask dialog and open main chat
          state.closeAskDialog();
          state.setVisibility(true);
        },

        // Section management
        setCurrentSection: (sectionId, sectionTitle) =>
          set(
            { currentSectionId: sectionId, currentSectionTitle: sectionTitle },
            false,
            "setCurrentSection"
          ),

        // Model/Provider actions
        setSelectedProvider: (provider) =>
          set({ selectedProvider: provider }, false, "setSelectedProvider"),

        setSelectedModel: (model) =>
          set({ selectedModel: model }, false, "setSelectedModel"),

        // UI actions
        toggleVisibility: () =>
          set(
            (state) => ({ isVisible: !state.isVisible }),
            false,
            "toggleVisibility"
          ),

        setVisibility: (visible) =>
          set({ isVisible: visible }, false, "setVisibility"),

        // Initialize welcome
        initializeWelcome: () => {
          const state = get();
          if (state.messages.length === 0) {
            const welcomeMessage: ChatMessage = {
              id: "welcome",
              type: "system",
              content: `🤖 Welcome to MDHD AI Assistant!

**How to use:**
📄 Hover over any code block, table, list, or other content
💬 Click "Ask" to ask a specific question about that component
➕ Click "+" to add it to your chat context

You can mix and match different components to ask complex questions!`,
              timestamp: new Date(),
            };

            state.addMessage(welcomeMessage);
          }
        },
      }),
      {
        name: "mdhd-simple-chat-store",
        partialize: (state) => ({
          selectedProvider: state.selectedProvider,
          selectedModel: state.selectedModel,
          isVisible: state.isVisible,
        }),
      }
    ),
    {
      name: "mdhd-simple-chat-store",
    }
  )
);

// Convenience hooks
export const useChatMessages = () =>
  useSimpleChatStore((state) => state.messages);
export const useSelectedComponents = () =>
  useSimpleChatStore((state) => state.selectedComponents);
export const useChatVisibility = () =>
  useSimpleChatStore((state) => state.isVisible);
export const useAskDialog = () =>
  useSimpleChatStore((state) => ({
    isOpen: state.askDialogOpen,
    component: state.currentAskComponent,
  }));

export const useChatActions = () =>
  useSimpleChatStore((state) => ({
    addMessage: state.addMessage,
    clearMessages: state.clearMessages,
    setInputValue: state.setInputValue,
    setIsQueryLoading: state.setIsQueryLoading,
    addComponentToChat: state.addComponentToChat,
    removeComponent: state.removeComponent,
    clearComponents: state.clearComponents,
    openAskDialog: state.openAskDialog,
    closeAskDialog: state.closeAskDialog,
    askAboutComponent: state.askAboutComponent,
    setCurrentSection: state.setCurrentSection,
    setSelectedProvider: state.setSelectedProvider,
    setSelectedModel: state.setSelectedModel,
    toggleVisibility: state.toggleVisibility,
    setVisibility: state.setVisibility,
    initializeWelcome: state.initializeWelcome,
  }));
