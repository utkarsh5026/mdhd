import { motion } from "framer-motion";
import { AlertTriangle, FileX, RefreshCw, ChevronRight } from "lucide-react";

interface ErrorLoadingDocumentProps {
  error: string;
  documentPath?: string;
}

/**
 * ErrorLoadingDocument Component 🚨✨
 *
 * A sophisticated error display component that gracefully handles document loading failures
 * with engaging animations, clear error messaging, and helpful user guidance.
 *
 * Features:
 * - 🎭 Dynamic animations that capture attention without being jarring
 * - 🎨 Rich color gradients and visual hierarchy
 * - 📁 Clear display of the problematic document path
 * - 💡 Helpful suggestions and next steps for users
 * - 🔄 Smooth transitions and micro-interactions
 */
const ErrorLoadingDocument: React.FC<ErrorLoadingDocumentProps> = ({
  error,
  documentPath,
}) => {
  return (
    <div className="flex items-center justify-center min-h-96 w-full font-cascadia-code p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.23, 1, 0.32, 1],
          staggerChildren: 0.1,
        }}
        className="relative max-w-2xl w-full"
      >
        {/* Background with gradient and blur effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-yellow-500/10 rounded-3xl blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 via-transparent to-orange-500/5 rounded-3xl" />

        <div className="relative bg-card/95 backdrop-blur-md rounded-3xl border border-red-200/30 shadow-2xl overflow-hidden">
          {/* Animated top border */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
          />

          {/* Content container */}
          <div className="p-8 space-y-6">
            {/* Header with animated icon */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4"
            >
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md" />
                <AlertTriangle className="h-10 w-10 text-red-500 relative z-10" />
              </motion.div>

              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold text-foreground"
                >
                  Document Loading Failed
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground"
                >
                  We encountered an issue while trying to load your document
                </motion.p>
              </div>
            </motion.div>

            {/* Path display section */}
            {documentPath && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 rounded-2xl p-4"
              >
                <div className="flex items-start space-x-3">
                  <FileX className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-700 mb-1">
                      Problematic Document Path:
                    </p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="bg-red-100/80 dark:bg-red-900/30 rounded-2xl p-3 border border-red-200/50 dark:border-red-800/50"
                    >
                      <code className="text-sm text-red-800 dark:text-red-200 break-all font-mono">
                        {documentPath}
                      </code>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error details section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-2xl p-4"
            >
              <h3 className="text-lg font-semibold text-orange-700  mb-3 flex items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                </motion.div>
                Error Details
              </h3>
              <div className="bg-orange-100/80 dark:bg-orange-900/30 rounded-2xl p-4 border border-orange-200/50 dark:border-orange-800/50">
                <p className="text-orange-800 dark:text-orange-200 leading-relaxed">
                  {error}
                </p>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry Loading</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.history.back()}
                className="flex items-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                <span>Go Back</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorLoadingDocument;
