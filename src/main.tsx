import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// @ts-expect-error - no type declarations
import "@fontsource/archivo-black";

createRoot(document.getElementById("root")!).render(<App />);
