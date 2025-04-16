import React from "react";
import ReactDOM from "react-dom/client";
import TheaterTranslationApp from "./TheaterTranslationApp";
import "./index.css"; // optional, falls du globale Styles hast

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <TheaterTranslationApp />
  </React.StrictMode>
);
