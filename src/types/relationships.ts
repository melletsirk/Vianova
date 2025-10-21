// Types for user relationships and invitations

export type UserRole = 'patient' | 'caregiver' | 'professional' | 'superadmin'

export type RelationshipStatus = 'pending' | 'active' | 'rejected' | 'cancelled'

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

// Extended user data with profile information
export interface UserProfile {
  uid: string
  email: string
  role: UserRole
  name?: string
  phone?: string
  profileComplete: boolean
  createdAt: Date
  updatedAt?: Date
}

// Relationship between users (Patient-Caregiver-Professional)
export interface Relationship {
  id: string
  patientId: string
  patientName?: string
  patientEmail?: string
  caregiverId?: string
  caregiverName?: string
  caregiverEmail?: string
  professionalId?: string
  professionalName?: string
  professionalEmail?: string
  status: RelationshipStatus
  createdAt: Date
  createdBy: string
  acceptedAt?: Date
  notes?: string
}

// Invitation to connect users
export interface Invitation {
  id: string
  fromUserId: string
  fromUserName?: string
  fromUserEmail: string
  fromUserRole: UserRole
  toEmail: string
  toUserId?: string
  toRole: UserRole
  patientId: string // Reference to the patient in the relationship
  status: InvitationStatus
  code: string // 6-digit unique code
  message?: string
  createdAt: Date
  expiresAt: Date
  acceptedAt?: Date
  rejectedAt?: Date
}

// Connection request (alternative to invitation)
export interface ConnectionRequest {
  id: string
  fromUserId: string
  fromUserRole: UserRole
  toUserId: string
  toUserRole: UserRole
  patientId: string
  status: 'pending' | 'accepted' | 'rejected'
  message?: string
  createdAt: Date
  respondedAt?: Date
}

// Helper type for displaying connections
export interface UserConnection {
  userId: string
  userName: string
  userEmail: string
  userRole: UserRole
  relationshipId: string
  status: RelationshipStatus
  connectedAt: Date
}

// Patient data types
export interface DailyEntry {
  id: string
  date: string // YYYY-MM-DD
  mood: number // 1-10
  pain: number // 1-10
  energy: number // 1-10
  notes?: string
  symptoms?: string[]
  medications?: string[]
  createdAt: Date
  updatedAt?: Date
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: Date
  endDate?: Date
  notes?: string
  active: boolean
  createdAt: Date
}

export interface Appointment {
  id: string
  title: string
  date: Date
  time: string
  professionalId: string
  professionalName: string
  type: 'consultation' | 'therapy' | 'checkup' | 'emergency'
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  createdAt: Date
}

export interface Alert {
  id: string
  type: 'medication' | 'appointment' | 'symptom' | 'emergency'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  patientId: string
  createdBy: string // user who created the alert
  createdAt: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface PatientStats {
  totalEntries: number
  averageMood: number
  averagePain: number
  averageEnergy: number
  streakDays: number // consecutive days with entries
  lastEntryDate?: string
  medicationsActive: number
  upcomingAppointments: number
  unresolvedAlerts: number
}

export interface Message {
  id: string
  patientId: string
  professionalId: string
  professionalName: string
  type: 'recommendation' | 'followup' | 'general'
  title: string
  content: string
  read: boolean
  readAt?: Date
  createdAt: Date
  updatedAt?: Date
}

// Care tasks for caregivers
export interface CareTask {
  id: string
  patientId: string
  caregiverId: string
  time: string // HH:MM format
  task: string
  urgent: boolean
  category: 'medication' | 'nutrition' | 'comfort' | 'other'
  completed: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt?: Date
}

// Permissions matrix
export const CONNECTION_PERMISSIONS: Record<UserRole, UserRole[]> = {
  patient: ['caregiver', 'professional'],
  caregiver: ['patient', 'professional'],
  professional: ['patient'],
  superadmin: [] // Super admin doesn't connect with regular users
}

// Check if a role can connect with another role
export function canConnect(fromRole: UserRole, toRole: UserRole): boolean {
  return CONNECTION_PERMISSIONS[fromRole]?.includes(toRole) ?? false
}

// Generate a 6-digit invitation code
export function generateInvitationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check if invitation is expired
export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

// Get expiration date (7 days from now)
export function getInvitationExpirationDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date
}