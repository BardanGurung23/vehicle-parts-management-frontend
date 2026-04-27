import { useEffect, useState } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "./auth";
import { AppLayout } from "./shell/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterCustomerPage } from "../features/auth/RegisterCustomerPage";
import { CustomerDetailPage } from "../features/customers/CustomerDetailPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import PartsPage from "../features/parts/PartsPage";
import { StaffManagementPage } from "../features/staff/StaffManagementPage";
import Appointments from "../pages/Appointments";
import { BookAppointmentPage } from "../features/appointments/BookAppointmentPage";
import { MyAppointmentsPage } from "../features/appointments/MyAppointmentsPage";
import { AddVehiclePage } from "../features/vehicles/AddVehiclePage";
import { MyVehiclesPage } from "../features/vehicles/MyVehiclesPage";
import { MyReviewsPage } from "../features/reviews/MyReviewsPage";
import { WriteReviewPage } from "../features/reviews/WriteReviewPage";
import Vendors from "../pages/Vendors";
import { MySalesPage } from "../features/sales/MySalesPage";
import { ShopPage } from "../features/sales/ShopPage";
import { RequestPartPage } from "../features/part-requests/RequestPartPage";
import { MyPartRequestsPage } from "../features/part-requests/MyPartRequestsPage";
import { CustomersListPage } from "../pages/Customer/CustomersListPage";
import { ProfilePage } from "../features/customers/ProfilePage";
import { StaffCustomerRegistrationPage } from "../features/customers/StaffCustomerRegistrationPage";
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
          toast.error(
            "Your session could not be validated. Please sign in again.",
          );
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

function EmployeeOnlyOutlet() {
  const { user } = useAuth();

  return user?.role === "Admin" || user?.role === "Staff"
    ? <Outlet />
    : <Navigate to="/app" replace />;
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
            path: "book-appointment",
            element: <BookAppointmentPage />,
          },
          {
            path: "my-appointments",
            element: <MyAppointmentsPage />,
          },
          {
            path: "add-vehicle",
            element: <AddVehiclePage />,
          },
          {
            path: "my-vehicles",
            element: <MyVehiclesPage />,
          },
          {
            path: "my-reviews",
            element: <MyReviewsPage />,
          },
          {
            path: "write-review/:appointmentId",
            element: <WriteReviewPage />,
          },
          {
            path: "my-sales",
            element: <MySalesPage />,
          },
          {
            path: "shop",
            element: <ShopPage />,
          },
          {
            path: "request-part",
            element: <RequestPartPage />,
          },
          {
            path: "my-part-requests",
            element: <MyPartRequestsPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            element: <EmployeeOnlyOutlet />,
            children: [
              {
                path: "customers/:customerId",
                element: <CustomerDetailPage />,
              },
              {
                path: "parts",
                element: <PartsPage />,
              },
            ],
          },
          {
            element: <AdminOnlyOutlet />,
            children: [
              {
                path: "staff",
                element: <StaffManagementPage />,
              },
              {
                path: "appointments",
                element: <Appointments />,
              },
              {
                path: "vendors",
                element: <Vendors />,
              },
              {
                path: "register-customer",
                element: <StaffCustomerRegistrationPage />,
              },
              {
                path: "customers",
                element: <CustomersListPage />,
              },
              {
                path: "part-requests",
                element: <MyPartRequestsPage />,
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
