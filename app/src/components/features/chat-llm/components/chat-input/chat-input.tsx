import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowUp, IoStop } from "react-icons/io5";
import { RiSparklingFill } from "react-icons/ri";
import ModelProvider from "./model-provider";
import { useState, useCallback } from "react";
import { useChatInput, useMessage } from "../../hooks";
import { getProviderIcon } from "../utils";

interface ChatInputProps {
  isInitialized: boolean;
  isQueryLoading: boolean;
  handleSendMessage: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  isInitialized,
  isQueryLoading,
  handleSendMessage,
}) => {
  const { inputValue, handleInputChange } = useChatInput();
  const { stopMessage } = useMessage();
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  const handleStopMessage = useCallback(() => {
    stopMessage();
  }, [stopMessage]);

  const isButtonDisabled =
    !isInitialized || (!isQueryLoading && !inputValue.trim());
  const showStopButton = isQueryLoading;

  return (
    <div className="flex-shrink-0 p-4 border-t border-border bg-gradient-to-t from-background/50 to-background backdrop-blur-sm">
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
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              placeholder={
                !isInitialized
                  ? "Initializing AI..."
                  : "Ask me anything about your document..."
              }
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={!isInitialized}
              className="text-sm rounded-2xl border-2 border-border/50 bg-card/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary/50 resize-none min-h-[44px] pr-4 shadow-sm transition-all duration-200"
              rows={1}
            />
            {/* AI Sparkle indicator when initialized */}
            {isInitialized && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-3 right-3 text-primary/40"
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <RiSparklingFill className="w-3 h-3" />
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* AI Action Button */}
          <motion.div
            animate={{
              scale: isButtonDisabled ? 0.95 : 1,
            }}
            whileHover={
              isButtonDisabled
                ? {}
                : {
                    scale: 1.05,
                    y: -1,
                  }
            }
            whileTap={isButtonDisabled ? {} : { scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
          >
            <Button
              onClick={showStopButton ? handleStopMessage : handleSendMessage}
              disabled={isButtonDisabled}
              size="sm"
              className={`h-11 w-11 p-0 rounded-2xl relative overflow-hidden group border-2 shadow-lg transition-all duration-300 ease-out ${
                showStopButton
                  ? "bg-destructive hover:bg-destructive/90 border-destructive shadow-destructive/25"
                  : "bg-primary hover:bg-primary/90 border-primary shadow-primary/25"
              }`}
            >
              {/* Background glow effect */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  background: showStopButton
                    ? [
                        "radial-gradient(circle, hsl(var(--destructive)) 0%, transparent 70%)",
                        "radial-gradient(circle, hsl(var(--destructive)) 0%, transparent 50%)",
                      ]
                    : [
                        "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
                        "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 50%)",
                      ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />

              {/* Icon with smooth transition */}
              <AnimatePresence mode="wait">
                {showStopButton ? (
                  <motion.div
                    key="stop"
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 text-destructive-foreground"
                  >
                    <IoStop className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 text-primary-foreground"
                  >
                    <motion.div
                      animate={
                        !isButtonDisabled && !showStopButton
                          ? {
                              y: [0, -2, 0],
                              scale: [1, 1.1, 1],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <IoArrowUp className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ripple effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                whileHover={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Inner glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/5 to-white/10 pointer-events-none" />
            </Button>
          </motion.div>
        </div>

        {/* Loading indicator with AI text */}
        <AnimatePresence>
          {isQueryLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-xs text-muted-foreground pl-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RiSparklingFill className="w-3 h-3 text-primary" />
              </motion.div>
              <span>AI is thinking...</span>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-primary font-medium"
              >
                Click stop to interrupt
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatInput;
