import { createRoot } from "react-dom/client";
import { registerServiceWorker } from "@/lib/register-service-worker";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

void registerServiceWorker();
