import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";

document.title = "Keymaker — Phosphor";
document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#080a0d");
createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
