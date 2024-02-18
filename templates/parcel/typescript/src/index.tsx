import React from "react";
import "./global.css";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

createRoot(document.getElementById("root")!).render(<App />);