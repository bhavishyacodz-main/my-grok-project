import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { SupabaseAuthProvider } from "./lib/auth/supabase-context";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SupabaseAuthProvider>
        <App />
      </SupabaseAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
