import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App";
import "./src/style.css";
import { SelectionOverlay } from "./src/utils/selection-overlay";

/**
 * Main entry point for the application
 *
 * This file imports and renders the main App component.
 * It can be extended with various providers as needed.
 *
 * Uncomment any providers needed for your specific application.
 */

const domNode = document.getElementById("root");
const root = createRoot(domNode);

root.render(
  <>
    <App />
    <SelectionOverlay />
  </>
);
