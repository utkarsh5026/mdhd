import Homepage from "@/components/layout/home";
import { useTheme } from "./hooks";
import "./index.css";
import { Toaster } from "sonner";

const App = () => {
  useTheme();

  return (
    <>
      <Homepage />
      <Toaster />
    </>
  );
};

export default App;
