import { createRoot } from "react-dom/client";
import { registerServiceWorker } from "@/lib/register-service-worker";
import { initializeTagManager } from "@/lib/tag-manager";
import App from "./App.tsx";
import "./index.css";

initializeTagManager();

createRoot(document.getElementById("root")!).render(<App />);

void registerServiceWorker();
