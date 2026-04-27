import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./app/auth";
import { router } from "./app/router";
import { persistor, store } from "./redux/store/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <RouterProvider router={router} />
          <ToastContainer position="bottom-right" newestOnTop={false} />
        </AuthProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
