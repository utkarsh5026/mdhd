import MDHDHomepage from "@/components/layout/HomePage";
import { useTheme } from "./hooks";
import "./index.css";

const App = () => {
  useTheme();
  return <MDHDHomepage />;
};

export default App;
