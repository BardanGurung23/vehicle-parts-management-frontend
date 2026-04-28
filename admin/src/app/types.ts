export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  customerId?: number | null;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserProfile;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterCustomerInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  address?: string;
}

export interface CreateCustomerInput {
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  vehicleNumber: string;
  vehicleModel?: string;
}

export interface RegisterCustomerResponse {
  userId: number;
  customerId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface VehicleSummary {
  vehicleId: number;
  vehicleNumber: string;
  model?: string | null;
}

export interface CustomerDetail {
  customerId: number;
  userId?: number | null;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  address?: string | null;
  registeredAt: string;
  vehicles: VehicleSummary[];
}

export interface UpdateCustomerProfileInput {
  fullName: string;
  phoneNumber: string;
  email: string;
  address?: string;
}

export interface AddVehicleInput {
  vehicleNumber: string;
  vehicleModel?: string;
}

export interface CustomerSearchInput {
  customerId?: number;
  phoneNumber?: string;
  vehicleNumber?: string;
  name?: string;
}

export interface CustomerSearchResult {
  customerId: number;
  userId?: number | null;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  vehicleCount: number;
  vehicles: VehicleSummary[];
}

export interface DashboardCountItem {
  label: string;
  count: number;
}

export interface DashboardInventoryPart {
  partId: number;
  partNumber: string;
  partName: string;
  stockQuantity: number;
  reorderLevel: number;
  categoryName?: string | null;
  createdAt: string;
}

export interface DashboardInventorySummary {
  trackedPartCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalUnitsOnHand: number;
  inventoryCost: number;
  stockStatus: DashboardCountItem[];
  topCategories: DashboardCountItem[];
  lowStockParts: DashboardInventoryPart[];
  recentParts: DashboardInventoryPart[];
}

export interface DashboardStaffSummary {
  totalStaffCount: number;
  activeStaffCount: number;
  roleBreakdown: DashboardCountItem[];
  recentStaff: StaffUser[];
}

export interface DashboardSummary {
  inventory?: DashboardInventorySummary | null;
  staff?: DashboardStaffSummary | null;
  currentCustomer?: CustomerDetail | null;
}

export interface RoleOption {
  roleId: number;
  name: string;
  description?: string | null;
}

export interface CreateStaffUserInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleId: number;
}

export interface StaffUser {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  roleId: number;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateStaffRoleInput {
  roleId: number;
}

export interface Vehicle {
  vehicleId: number;
  vehicleNumber: string;
  model: string;
}

export interface Appointment {
  appointmentId: number;
  customerId: number;
  customerName: string;
  vehicleId: number;
  vehicleNumber: string;
  vehicleModel: string;
  appointmentDate: string;
  serviceType: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  hasReview: boolean;
}

export interface CreateAppointmentRequest {
  vehicleId: number;
  appointmentDate: string;
  serviceType: string;
  notes?: string;
}

export interface ServiceReview {
  reviewId: number;
  appointmentId: number;
  customerId: number;
  customerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface CreateReviewRequest {
  appointmentId: number;
  rating: number;
  comment?: string;
}

export interface Vendor {
  vendorId: number;
  vendorName: string;
  contactPerson?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface CreateVendorRequest {
  vendorName: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}
