import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import TheaterTranslationApp from "./client";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <TheaterTranslationApp />
  </React.StrictMode>
);
