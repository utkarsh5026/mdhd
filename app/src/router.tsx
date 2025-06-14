import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import HomePage from "@/components/home/HomePage";
import DocumentPreview from "@/components/document-reading/preview/DocumentPreview";
import ErrorBoundary from "@/components/utils/error/ErrorBoundary";

/**
 * Application Router Configuration
 *
 * Defines the routing structure for the entire application with improved error handling:
 * - Root route: The main application container with a global error boundary
 * - Home page: Shows dashboard, reading history, to-do list, and analytics
 * - Document routes: Shows document preview and fullscreen reading views
 * - Each route has dedicated error handling for better user experience
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "documents/:documentPath/*",
        element: <DocumentPreview />,
        errorElement: <ErrorBoundary />,
      },
      {
        index: true,
        element: <HomePage />,
        errorElement: <ErrorBoundary />,
      },
    ],
  },
]);

export default router;
