import '@/lib/sentry';
import { createRoot } from "react-dom/client";
import AppErrorBoundary from '@/components/shared/AppErrorBoundary';
import { registerServiceWorker } from "@/lib/register-service-worker";
import { initializeTagManager } from "@/lib/tag-manager";
import App from "./App.tsx";
import "./index.css";

initializeTagManager();

createRoot(document.getElementById("root")!).render(<AppErrorBoundary><App /></AppErrorBoundary>);

void registerServiceWorker();
