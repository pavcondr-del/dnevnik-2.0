import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Hydrate вместо render для соответствия с pre-rendered HTML в index.html
ReactDOM.hydrateRoot(document.getElementById("root")!, <App />);
