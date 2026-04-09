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

export interface RegisterCustomerResponse {
  userId: number;
  customerId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
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