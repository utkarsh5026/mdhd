import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * NoFileSelectedYet Component 😊
 *
 * This delightful component greets users when no document is selected yet.
 * It provides a warm welcome to the Card View Documentation, encouraging users
 * to explore and select a document from the sidebar. 📚✨
 *
 * The component features a charming animation that smoothly transitions
 * into view, making the experience feel lively and engaging.
 *
 * Users are presented with a friendly message and two buttons:
 * - One to open the sidebar for document selection,
 * - Another to browse available documents directly.
 *
 * This component aims to enhance user experience by guiding them
 * towards their reading journey in a fun and inviting way! 🌟
 */
const NoFileSelectedYet: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full font-cascadia-code">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center p-8 max-w-lg"
      >
        <div className="bg-primary/10 w-16 h-16 flex items-center justify-center rounded-full mb-4 mx-auto">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-medium mb-4">
          Welcome to Card View Documentation
        </h2>
        <p className="text-muted-foreground mb-6">
          Select a document from the sidebar to get started with our enhanced
          reading experience.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Button variant="outline" size="sm" className="rounded-full">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Open Sidebar
          </Button>
          <Button
            variant="default"
            size="sm"
            className="rounded-full bg-primary/90 hover:bg-primary"
          >
            Browse Documents
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NoFileSelectedYet;
