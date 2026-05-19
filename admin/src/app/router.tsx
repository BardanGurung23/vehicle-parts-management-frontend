import { useEffect, useState } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "./auth";
import { AppLayout } from "./shell/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterCustomerPage } from "../features/auth/RegisterCustomerPage";
import { CustomerDetailPage } from "../features/customers/CustomerDetailPage";
import { CustomerSearchPage } from "../features/customers/CustomerSearchPage";
import { StaffCustomerRegistrationPage } from "../features/customers/StaffCustomerRegistrationPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import PartsPage from "../features/parts/PartsPage";
import { CustomerProfilePage } from "../features/profile/CustomerProfilePage";
import { CustomerVehiclesPage } from "../features/profile/CustomerVehiclesPage";
import { StaffManagementPage } from "../features/staff/StaffManagementPage";
import Appointments from "../pages/Appointments";
import { BookAppointmentPage } from "../features/appointments/BookAppointmentPage";
import { MyAppointmentsPage } from "../features/appointments/MyAppointmentsPage";
import { PurchaseInvoicesPage } from "../features/purchase-invoices/PurchaseInvoicesPage";
import { MyReviewsPage } from "../features/reviews/MyReviewsPage";
import { CustomerReportsPage } from "../features/reports/CustomerReportsPage";
import { FinancialReportsPage } from "../features/reports/FinancialReportsPage";
import { WriteReviewPage } from "../features/reviews/WriteReviewPage";
import Vendors from "../pages/Vendors";
import { InvoiceDetailPage } from "../features/sales/InvoiceDetailPage";
import { MySalesPage } from "../features/sales/MySalesPage";
import { ShopPage } from "../features/sales/ShopPage";
import { RequestPartPage } from "../features/part-requests/RequestPartPage";
import { MyPartRequestsPage } from "../features/part-requests/MyPartRequestsPage";
import { PartRequestsPage } from "../pages/PartRequests";
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

function CustomerOnlyOutlet() {
  const { user } = useAuth();

  return user?.role === "Customer"
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
            path: "shop",
            element: <ShopPage />,
          },
          {
            path: "sales/:saleId",
            element: <InvoiceDetailPage />,
          },
          {
            element: <CustomerOnlyOutlet />,
            children: [
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
                element: <Navigate to="/app/profile/vehicles" replace />,
              },
              {
                path: "my-vehicles",
                element: <Navigate to="/app/profile/vehicles" replace />,
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
                path: "request-part",
                element: <RequestPartPage />,
              },
              {
                path: "my-part-requests",
                element: <MyPartRequestsPage />,
              },
              {
                path: "profile",
                element: <CustomerProfilePage />,
              },
              {
                path: "profile/vehicles",
                element: <CustomerVehiclesPage />,
              },
            ],
          },
          {
            element: <EmployeeOnlyOutlet />,
            children: [
              {
                path: "customers/register",
                element: <StaffCustomerRegistrationPage />,
              },
              {
                path: "customers/search",
                element: <CustomerSearchPage />,
              },
              {
                path: "customers/:customerId",
                element: <CustomerDetailPage />,
              },
              {
                path: "parts",
                element: <PartsPage />,
              },
              {
                path: "reports/customers",
                element: <CustomerReportsPage />,
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
                path: "purchase-invoices",
                element: <PurchaseInvoicesPage />,
              },
              {
                path: "reports/financial",
                element: <FinancialReportsPage />,
              },
              {
                path: "register-customer",
                element: <StaffCustomerRegistrationPage />,
              },
              {
                path: "customers",
                element: <Navigate to="/app/customers/search" replace />,
              },
              {
                path: "part-requests",
                element: <PartRequestsPage />,
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
