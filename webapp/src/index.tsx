import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TheaterTranslationApp from "./TheaterTranslationApp.tsx";
import AdminPanel from "./AdminPanel.tsx";
import "./index.css"; // optional, falls du globale Styles hast

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TheaterTranslationApp />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
