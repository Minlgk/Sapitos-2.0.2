// Polyfill para global (para fundamental-react y otras libs)
if (typeof global === "undefined") {
  window.global = window;
}

import { createRoot } from "react-dom/client";
import "react-quill/dist/quill.snow.css";
import "jsvectormap/dist/css/jsvectormap.css";
import "react-toastify/dist/ReactToastify.css";
import "react-modal-video/css/modal-video.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
// import 'bootstrap/dist/css/bootstrap.min.css';
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";
import App from "./App.jsx";
import AuthHandler from "./components/AuthHandler";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthHandler>
      <App />
    </AuthHandler>
  </BrowserRouter>
);
