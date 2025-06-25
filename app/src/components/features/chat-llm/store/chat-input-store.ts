import { create } from "zustand";
import type { ComponentSelection } from "@/components/features/markdown-render/types";

type State = {
  inputValue: string;
  selectedComponents: ComponentSelection[];
};

type Actions = {
  setInputValue: (inputValue: string) => void;
  addComponent: (component: ComponentSelection) => void;
  removeComponent: (component: ComponentSelection) => void;
  clearInput: () => void;
  clearComponents: () => void;
};

export const useChatInputStore = create<State & Actions>((set, get) => ({
  inputValue: "",
  selectedComponents: [],

  setInputValue: (inputValue) => set({ inputValue }),

  clearInput: () => set({ inputValue: "", selectedComponents: [] }),

  addComponent: (component) => {
    const { selectedComponents } = get();
    if (selectedComponents.some((c) => c.id === component.id)) {
      return;
    }
    set({ selectedComponents: [...selectedComponents, component] });
  },

  removeComponent: (component) =>
    set((state) => ({
      selectedComponents: state.selectedComponents.filter(
        (c) => c.id !== component.id
      ),
    })),

  clearComponents: () => set({ selectedComponents: [] }),
}));
