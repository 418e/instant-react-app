import React from "react";
import "./global.css";
import { createRoot } from "react-dom/client";
import App from "./app";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  throw new Error("Could not find root element");
}