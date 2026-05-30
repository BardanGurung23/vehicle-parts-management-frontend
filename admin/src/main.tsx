import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./app/auth";
import { ThemeProvider } from "./app/theme";
import { router } from "./app/router";
import { persistor, store } from "./redux/store/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster richColors position="bottom-right" />
          </AuthProvider>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  </StrictMode>,
);
