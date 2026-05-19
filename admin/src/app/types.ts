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
  vehicleNumber?: string;
  vehicleModel?: string;
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
  mileage?: number | null;
  manufactureYear?: number | null;
  lastServiceDate?: string | null;
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
  mileage?: number;
  manufactureYear?: number;
  lastServiceDate?: string;
}

export interface VehicleInsightItem {
  code: string;
  category: string;
  title: string;
  description: string;
  riskLevel: "Low" | "Medium" | "High" | string;
  recommendedAction: string;
  predictedTimeframe: string;
}

export interface VehicleInsights {
  vehicleId: number;
  vehicleNumber: string;
  model?: string | null;
  healthScore: number;
  healthStatus: "Good" | "Moderate" | "Critical" | string;
  usagePattern: string;
  mileage?: number | null;
  manufactureYear?: number | null;
  vehicleAgeYears?: number | null;
  estimatedAnnualMileage?: number | null;
  lastServiceDate?: string | null;
  generatedAt: string;
  insights: VehicleInsightItem[];
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

export interface LowStockAlert {
  partId: number;
  partNumber: string;
  partName: string;
  categoryName?: string | null;
  stockQuantity: number;
  threshold: number;
}

export interface OverdueCreditAlert {
  saleId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  customerEmail?: string | null;
  outstandingAmount: number;
  paymentStatus: string;
  dueDate?: string | null;
  daysOverdue: number;
}

export interface PredictiveAlert {
  predictiveAlertId: number;
  customerId: number;
  customerName: string;
  vehicleId: number;
  vehicleNumber: string;
  partId?: number | null;
  partName?: string | null;
  alertMessage: string;
  riskLevel: string;
  status: string;
  createdAt: string;
}

export interface AlertSummary {
  activeAlertCount: number;
  lowStockAlertCount: number;
  overdueCreditAlertCount: number;
  predictiveAlertCount: number;
  generatedAt: string;
  lowStockAlerts: LowStockAlert[];
  overdueCreditAlerts: OverdueCreditAlert[];
  predictiveAlerts: PredictiveAlert[];
}

export interface DashboardSummary {
  inventory?: DashboardInventorySummary | null;
  staff?: DashboardStaffSummary | null;
  alerts?: AlertSummary | null;
  recentRegisteredCustomers?: CustomerSearchResult[] | null;
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
  mileage?: number | null;
  manufactureYear?: number | null;
  lastServiceDate?: string | null;
}

export interface Part {
  partId: number;
  partNumber: string;
  partName: string;
  description?: string | null;
  imageUrl?: string | null;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  partCategoryId?: number | null;
  categoryName?: string | null;
  createdAt: string;
}

export interface PartCategory {
  partCategoryId: number;
  categoryName: string;
  description?: string | null;
}

export interface CreatePartInput {
  partNumber: string;
  partName: string;
  description?: string;
  imageUrl?: string;
  imageFile?: File | null;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  partCategoryId?: number | null;
}

export interface UpdatePartInput {
  partName: string;
  description?: string;
  imageUrl?: string;
  imageFile?: File | null;
  removeImage?: boolean;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  partCategoryId?: number | null;
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

export interface CreateSaleItemInput {
  partId: number;
  quantity: number;
}

export interface CreateSaleInput {
  customerId?: number;
  vehicleId?: number;
  paymentStatus?: string;
  dueDate?: string;
  items: CreateSaleItemInput[];
  notes?: string;
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

export interface PurchaseInvoiceItem {
  purchaseInvoiceItemId: number;
  partId: number;
  partName: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseInvoice {
  purchaseInvoiceId: number;
  vendorId: number;
  vendorName: string;
  createdByUserId: number;
  createdByName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  status: string;
  items: PurchaseInvoiceItem[];
}

export interface CreatePurchaseInvoiceItemRequest {
  partId: number;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseInvoiceRequest {
  vendorId: number;
  status?: string;
  items: CreatePurchaseInvoiceItemRequest[];
}

export interface PartRequest {
  requestId: number;
  customerId: number;
  customerName: string;
  vehicleId?: number;
  vehicleNumber?: string;
  requestedPartName: string;
  requestDetails?: string;
  status: string;
  requestedAt: string;
  resolvedAt?: string;
}

export interface CreatePartRequestInput {
  vehicleId?: number;
  requestedPartName: string;
  requestDetails?: string;
}

export interface FinancialReportEntry {
  label: string;
  revenue: number;
  discounts: number;
  purchaseCosts: number;
  grossProfit: number;
  saleCount: number;
  purchaseInvoiceCount: number;
}

export interface FinancialReport {
  reportType: string;
  periodLabel: string;
  rangeStart: string;
  rangeEndExclusive: string;
  revenue: number;
  discounts: number;
  purchaseCosts: number;
  grossProfit: number;
  saleCount: number;
  purchaseInvoiceCount: number;
  entries: FinancialReportEntry[];
}

export interface SaleItem {
  partId: number;
  partName: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface SendSaleInvoiceEmailResponse {
  saleId: number;
  invoiceNumber: string;
  recipientEmail: string;
  message: string;
}

export interface Sale {
  saleId: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string | null;
  vehicleNumber?: string | null;
  saleDate: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  dueDate?: string | null;
  notes?: string | null;
  items: SaleItem[];
}

export interface CustomerReportEntry {
  customerId: number;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  totalSpent: number;
  saleCount: number;
  appointmentCount: number;
  pendingInvoiceCount: number;
  overdueInvoiceCount: number;
  outstandingAmount: number;
  lastActivityAt?: string | null;
}

export interface CustomerReports {
  reportType: string;
  periodLabel: string;
  rangeStart: string;
  rangeEndExclusive: string;
  highSpenderThreshold: number;
  regularCustomerCount: number;
  highSpenderCount: number;
  pendingCreditCustomerCount: number;
  overdueCreditCustomerCount: number;
  regularCustomers: CustomerReportEntry[];
  highSpenders: CustomerReportEntry[];
  pendingCredits: CustomerReportEntry[];
}
