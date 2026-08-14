import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import "./index.css";

import { Provider } from "react-redux";
import { store } from "./redux/store";

// Import Auth Provider
import { AuthProvider } from "./context/AuthContext";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration);
        registration.addEventListener("updatefound", () => {
          console.log("SW update found");
        });
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

    <BrowserRouter>

      <Provider store={store} >

        <AuthProvider>

          <App />

        </AuthProvider>

      </Provider>

    </BrowserRouter>

  </React.StrictMode>
);
