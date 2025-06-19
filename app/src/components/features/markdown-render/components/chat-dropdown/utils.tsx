import {
  IoCodeSlashOutline,
  IoLayersOutline,
  IoDocumentTextOutline,
  IoListOutline,
  IoChatbubbleOutline,
  IoImageOutline,
} from "react-icons/io5";
import { ComponentType } from "../../services/component-service";

/**
 * Get icon for component type
 */
export const getComponentIcon = (type: ComponentType) => {
  switch (type) {
    case "code":
      return <IoCodeSlashOutline className="w-4 h-4" />;
    case "table":
      return <IoLayersOutline className="w-4 h-4" />;
    case "heading":
      return <IoDocumentTextOutline className="w-4 h-4" />;
    case "list":
      return <IoListOutline className="w-4 h-4" />;
    case "blockquote":
      return <IoChatbubbleOutline className="w-4 h-4" />;
    case "image":
      return <IoImageOutline className="w-4 h-4" />;
    default:
      return <IoDocumentTextOutline className="w-4 h-4" />;
  }
};

/**
 * Get color scheme for component type
 */
export const getComponentColorScheme = (type: ComponentType) => {
  switch (type) {
    case "code":
      return "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "table":
      return "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
    case "heading":
      return "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
    case "list":
      return "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "blockquote":
      return "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800";
    case "image":
      return "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
    default:
      return "bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800";
  }
};

export const getQuestionsForComponentType = (
  componentType: ComponentType
): string[] => {
  const commonQuestions = [
    "Explain this in simple terms",
    "What is the purpose of this?",
    "How does this work?",
    "Can you provide more context?",
  ];

  const typeSpecificQuestions: Record<ComponentType, string[]> = {
    code: [
      "What does this code do?",
      "Explain this code step by step",
      "Are there any potential issues with this code?",
      "How can this code be improved?",
      "What language/framework is this?",
    ],
    table: [
      "What does this data show?",
      "Explain the relationships in this table",
      "What are the key insights from this data?",
      "How should I interpret this table?",
    ],
    heading: [
      "What is covered in this section?",
      "Summarize this section",
      "What are the main points here?",
    ],
    list: [
      "Explain each item in this list",
      "What's the significance of these points?",
      "How are these items related?",
      "Prioritize these items by importance",
    ],
    blockquote: [
      "Who said this quote?",
      "What's the context of this quote?",
      "Explain the meaning of this quote",
    ],
    image: [
      "Describe what's in this image",
      "What does this image represent?",
      "How does this image relate to the content?",
    ],
    paragraph: [
      "Summarize this paragraph",
      "What are the key points here?",
      "Explain this in simpler terms",
    ],
    section: [
      "Summarize this entire section",
      "What are the main topics covered here?",
      "How does this section relate to the overall content?",
      "What are the key takeaways from this section?",
    ],
  };

  return [...(typeSpecificQuestions[componentType] || []), ...commonQuestions];
};
