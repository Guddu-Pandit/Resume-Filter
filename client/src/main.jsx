import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/authcontext";
import { ToastProvider } from "./context/ToastContext";
import { ChatProvider } from "./context/ChatContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ChatProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ChatProvider>
  </AuthProvider>
);
