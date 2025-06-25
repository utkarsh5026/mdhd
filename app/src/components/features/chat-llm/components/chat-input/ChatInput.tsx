import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { IoSend } from "react-icons/io5";
import ModelProvider from "./ModelProvider";
import { useState } from "react";
import type { LLMProviderId } from "@/components/features/chat-llm/types";

interface ChatInputProps {
  isInitialized: boolean;
  isQueryLoading: boolean;
  getProviderIcon: (providerId: LLMProviderId) => React.ReactNode;
  handleSendMessage: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  isInitialized,
  isQueryLoading,
  getProviderIcon,
  handleSendMessage,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  return (
    <div className="flex-shrink-0 p-4 border-t border-border">
      <div className="mb-4">
        <div className="flex gap-2">
          {/* Model Selection */}
          <div className="flex-1">
            <ModelProvider
              modelPopoverOpen={modelPopoverOpen}
              setModelPopoverOpen={setModelPopoverOpen}
              getProviderIcon={getProviderIcon}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Textarea
            placeholder={
              !isInitialized ? "Initializing..." : "Ask about your document..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!isInitialized || isQueryLoading}
            className="text-sm rounded-2xl border-1 border-border bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/30 resize-none"
          />
          <motion.div
            animate={{
              scale:
                !isInitialized || isQueryLoading || !inputValue.trim()
                  ? 0.95
                  : 1,
            }}
            whileHover={
              !isInitialized || isQueryLoading || !inputValue.trim()
                ? {}
                : {
                    scale: 1.05,
                    rotate: [0, -2, 2, 0],
                  }
            }
            whileTap={
              !isInitialized || isQueryLoading || !inputValue.trim()
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
              disabled={!isInitialized || isQueryLoading || !inputValue.trim()}
              size="sm"
              className="shrink-0 px-3 rounded-2xl relative overflow-hidden group bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 border border-primary/40 text-primary hover:from-primary/30 hover:via-primary/50 hover:to-primary/30 hover:border-primary/60 hover:text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300 ease-out cursor-pointer"
            >
              <motion.div
                animate={
                  isQueryLoading
                    ? {
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={
                  isQueryLoading
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
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
