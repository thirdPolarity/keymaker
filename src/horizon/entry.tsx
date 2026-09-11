import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/orbitron";
import App from "../dream/App";
import "../dream/style.css";
import "./style.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><App variant="horizon" /></React.StrictMode>);
