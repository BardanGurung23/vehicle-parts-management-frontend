import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  createBrowserRouter,
} from "react-router-dom";
import { useAuth } from "./auth";
import { AppLayout } from "./shell/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterCustomerPage } from "../features/auth/RegisterCustomerPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { StaffManagementPage } from "../features/staff/StaffManagementPage";
import { LoadingScreen } from "../shared/components/LoadingScreen";

function PublicOnlyOutlet() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Navigate to="/app" replace /> : <Outlet />;
}

function ProtectedOutlet() {
  const { isAuthenticated, refreshProfile, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    if (!isAuthenticated) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    void refreshProfile()
      .catch(() => {
        if (isActive) {
          logout();
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, logout, refreshProfile]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <LoadingScreen message="Validating your session..." />;
  }

  return <Outlet />;
}

function AdminOnlyOutlet() {
  const { isAdmin } = useAuth();

  return isAdmin ? <Outlet /> : <Navigate to="/app" replace />;
}

export const router = createBrowserRouter([
  {
    element: <PublicOnlyOutlet />,
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterCustomerPage />,
      },
    ],
  },
  {
    element: <ProtectedOutlet />,
    children: [
      {
        path: "/app",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            element: <AdminOnlyOutlet />,
            children: [
              {
                path: "staff",
                element: <StaffManagementPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);