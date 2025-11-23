import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
// Initialize Firebase
import "./firebase.ts";
import { AuthProvider } from "./context/AuthContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";

// Ensure the root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
        <AppWrapper>
          <App />
        </AppWrapper>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);