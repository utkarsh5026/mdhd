import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingAnimation from "@/components/utils/init/LoadingAnimation";
import AppHeader from "@/components/layout/AppHeader";
import AppWrapper from "@/components/utils/welcome/Wrapper";
import { useInit } from "./stores";
import { useTheme } from "@/hooks/ui/use-theme";

/**
 * 🌟 App Component
 *
 * The main application component that orchestrates the entire user experience.
 * It manages document selection, navigation, and UI state transitions.
 *
 * ✨ Features:
 * - Loads and displays markdown documents
 * - Handles navigation between home and document views
 * - Manages responsive sidebar for easy document browsing
 * - Provides smooth loading transitions
 * - Supports URL-based navigation through React Router
 */
export const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  useTheme();

  const loading = useInit();

  /* 
  🏠 Handle navigation to home
   */
  const navigateToHome = () => {
    navigate("/");
    setSidebarOpen(false);
  };

  /* 
    🔄 Toggle sidebar visibility
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AppWrapper>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {loading && <LoadingAnimation />}

        <AppHeader
          toggleSidebar={toggleSidebar}
          onNavigateHome={navigateToHome}
          className="transition-opacity duration-500"
        />

        {/* Main content with sidebar */}
        <div
          className={`flex flex-1 overflow-hidden relative ${
            loading
              ? "opacity-0"
              : "opacity-100 transition-opacity duration-500"
          }`}
        ></div>

        {/* Simple footer */}
        <footer
          className={`border-t mt-auto py-3 px-4 border-border font-cascadia-code ${
            loading
              ? "opacity-0"
              : "opacity-100 transition-opacity duration-500"
          }`}
        >
          <div className="max-w-7xl mx-auto text-center text-xs text-muted-foreground">
            <p>
              Made with ❤️ by{" "}
              <a
                href="https://github.com/utkarsh5026"
                target="_blank"
                rel="noopener noreferrer"
              >
                Utkarsh Priyadarshi
              </a>
            </p>
          </div>
        </footer>
      </div>
    </AppWrapper>
  );
};

export default App;
