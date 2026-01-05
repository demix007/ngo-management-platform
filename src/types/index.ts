// User and Authentication Types
export type UserRole = 
  | 'national_admin'
  | 'state_admin'
  | 'field_officer'
  | 'm_e'
  | 'finance'
  | 'donor'

export interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  state?: string
  lga?: string
  phoneNumber?: string
  photoURL?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  twoFactorEnabled: boolean
}

// Beneficiary Types
export interface Beneficiary {
  id: string
  // Bio data
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other'
  phoneNumber?: string
  email?: string
  
  // Photos & ID
  photos?: string[] // Array of photo URLs
  idDocument?: {
    type: 'national_id' | 'voters_card' | 'drivers_license' | 'passport' | 'other'
    number?: string
    documentUrl?: string
  }
  
  // Address
  address: {
    street: string
    city: string
    state: string
    lga: string
    country: string
    postalCode?: string
  }
  gpsLocation?: {
    latitude: number
    longitude: number
  }
  
  // Program & Financial
  programParticipations: string[] // Program IDs
  programsReceived?: Array<{
    programId: string
    programName: string
    startDate: Date
    endDate?: Date
    amountSpent: number
    status: 'completed' | 'ongoing' | 'cancelled'
  }>
  amountSpent: number // Total amount spent across all programs
  
  // Medical/Bail
  medicalBills?: Array<{
    id: string
    description: string
    amount: number
    date: Date
    cleared: boolean
    clearedDate?: Date
    documentUrl?: string
  }>
  bailBills?: Array<{
    id: string
    description: string
    amount: number
    date: Date
    cleared: boolean
    clearedDate?: Date
    documentUrl?: string
  }>
  
  // Follow-up reports
  followUpReports?: Array<{
    id: string
    date: Date
    reporter: string
    report: string
    status: 'positive' | 'needs_attention' | 'critical'
    nextFollowUpDate?: Date
  }>
  
  // Impact & Reintegration
  impactNotes?: string
  reintegrationSuccessScore?: number // 0-100
  reintegrationDetails?: {
    dateCompleted?: Date
    employmentStatus?: 'employed' | 'self_employed' | 'unemployed' | 'student'
    housingStatus?: 'stable' | 'temporary' | 'homeless'
    familyReunited?: boolean
    communitySupport?: boolean
  }
  
  // Legacy fields (for backward compatibility)
  impactMetrics: {
    programsCompleted: number
    totalBenefitAmount: number
    lastProgramDate?: Date
  }
  
  status: 'active' | 'inactive' | 'archived'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  notes?: string
}

// Program Types
export type ProgramType = 
  | 'health'
  | 'prison_clearance'
  | 'women_empowerment'
  | 'education'
  | 'other'

export interface Program {
  id: string
  // Basic Info
  title: string // Program title
  objectives: string[] // Program objectives
  description?: string
  type: ProgramType
  startDate: Date
  endDate?: Date
  
  // Location
  states: string[]
  lgas: string[]
  location?: {
    address?: string
    city?: string
    gpsLocation?: {
      latitude: number
      longitude: number
    }
  }
  
  // Partners & Beneficiaries
  partners: string[] // Partner IDs
  partnerNames?: string[] // For display purposes
  targetBeneficiaries: number
  actualBeneficiaries: number
  beneficiaryIds: string[] // Beneficiary IDs enrolled in this program
  
  // Budget & Expenditures
  budget: {
    allocated: number
    spent: number
    currency: string
  }
  expenditures?: Array<{
    id: string
    description: string
    amount: number
    date: Date
    category: 'personnel' | 'equipment' | 'transport' | 'venue' | 'materials' | 'other'
    receiptUrl?: string
  }>
  
  // Media & Documentation
  media?: Array<{
    id: string
    type: 'photo' | 'video' | 'document'
    url: string
    caption?: string
    uploadedAt: Date
  }>
  documentation?: Array<{
    id: string
    title: string
    type: 'report' | 'proposal' | 'agreement' | 'other'
    url: string
    uploadedAt: Date
  }>
  
  // Monitoring & Evaluation
  monitoringReports?: Array<{
    id: string
    title: string
    reportDate: Date
    reporter: string
    content: string
    metrics?: Record<string, number | string>
    attachments?: string[]
  }>
  evaluationReports?: Array<{
    id: string
    title: string
    reportDate: Date
    evaluator: string
    content: string
    findings: string[]
    recommendations: string[]
    attachments?: string[]
  }>
  
  // Impact
  impactScore?: number // 0-100 impact score
  impactMetrics?: {
    beneficiariesReached: number
    objectivesAchieved: number
    totalObjectives: number
    satisfactionScore?: number
    outcomes?: string[]
  }
  
  // Status & Metadata
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
}

// Event Types
export interface Event {
  id: string
  programId: string
  name: string
  description: string
  eventDate: Date
  location: {
    address: string
    state: string
    lga: string
    gpsLocation?: {
      latitude: number
      longitude: number
    }
  }
  attendees: string[] // Beneficiary IDs
  budget: {
    allocated: number
    spent: number
  }
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Donation Types
export interface Donor {
  id: string
  name: string
  type: 'individual' | 'corporate' | 'government' | 'ngo'
  email: string
  phoneNumber?: string
  address?: string
  contactPerson?: string
  taxId?: string
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface Donation {
  id: string
  // Donor Information
  donorId: string
  donorName?: string // For display purposes
  
  // Financial Information
  amount: number
  currency: string
  donationDate: Date
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'online'
  receiptNumber: string
  
  // Program Assignment
  programId?: string
  programName?: string // For display purposes
  
  // Expenditures & Balance
  expenditures?: Array<{
    id: string
    description: string
    amount: number
    date: Date
    programId?: string
    category: 'personnel' | 'equipment' | 'transport' | 'venue' | 'materials' | 'other'
    receiptUrl?: string
  }>
  balanceRemaining: number // Calculated: amount - sum of expenditures
  
  // Donor Reporting & Restrictions
  donorRestrictions?: string[] // Any restrictions on how the donation can be used
  donorReporting?: {
    lastReportDate?: Date
    nextReportDue?: Date
    reportFrequency?: 'monthly' | 'quarterly' | 'annually'
    reports?: Array<{
      id: string
      reportDate: Date
      content: string
      attachments?: string[]
    }>
  }
  
  // Donation History (for tracking related donations)
  relatedDonationIds?: string[]
  
  // Status & Metadata
  purpose?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Grant {
  id: string
  // Grant Provider Information
  grantor: string
  grantName: string
  grantorContact?: {
    email?: string
    phoneNumber?: string
    address?: string
    contactPerson?: string
  }
  
  // Financial Information
  amount: number
  currency: string
  startDate: Date
  endDate: Date
  purpose: string
  
  // Program Assignment
  programIds: string[]
  programNames?: string[] // For display purposes
  
  // Terms & Conditions
  termsAndConditions?: string
  conditions: string[]
  
  // Disbursement Schedule
  disbursementSchedule?: Array<{
    id: string
    scheduledDate: Date
    amount: number
    status: 'pending' | 'disbursed' | 'overdue'
    actualDisbursementDate?: Date
    notes?: string
  }>
  
  // Milestones
  milestones?: Array<{
    id: string
    title: string
    description: string
    targetDate: Date
    status: 'pending' | 'in_progress' | 'completed' | 'overdue'
    completionDate?: Date
    deliverables?: string[]
  }>
  
  // Deliverables
  deliverables?: Array<{
    id: string
    title: string
    description: string
    dueDate: Date
    status: 'pending' | 'submitted' | 'approved' | 'rejected'
    submissionDate?: Date
    documentUrl?: string
    notes?: string
  }>
  
  // Reporting Requirements
  reportingRequirements: {
    frequency: 'monthly' | 'quarterly' | 'annually'
    nextReportDue: Date
    lastReportDate?: Date
    reports?: Array<{
      id: string
      reportDate: Date
      reportType: 'usage' | 'financial' | 'compliance' | 'milestone'
      content: string
      attachments?: string[]
      status: 'draft' | 'submitted' | 'approved' | 'rejected'
    }>
  }
  
  // Usage Report
  usageReport?: {
    totalDisbursed: number
    totalSpent: number
    balanceRemaining: number
    spendingByProgram?: Record<string, number>
    spendingByCategory?: Record<string, number>
    lastUpdated: Date
  }
  
  // Compliance Tracking
  complianceTracking?: {
    isCompliant: boolean
    complianceIssues?: Array<{
      id: string
      issue: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      status: 'open' | 'resolved'
      resolvedDate?: Date
      notes?: string
    }>
    lastComplianceCheck?: Date
  }
  
  // Status & Metadata
  status: 'active' | 'completed' | 'suspended'
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Partnership Types
export type PartnerCategory = 
  | 'government_ministry'
  | 'hospital'
  | 'correctional_center'
  | 'ngo'
  | 'cso'
  | 'international_agency'
  | 'foundation'
  | 'media_partner'
  | 'donor_sponsor'
  | 'private'

export type PartnerStatus = 'active' | 'dormant' | 'past'

export type RelationshipRating = 
  | 'excellent'
  | 'very_good'
  | 'good'
  | 'fair'
  | 'poor'

export interface Partner {
  id: string
  // Basic Information
  name: string // Name of institution
  category: PartnerCategory // Category (Govt / NGO / International / Private)
  
  // Contact Information
  focalPerson: {
    name: string
    title?: string
    email: string
    phoneNumber?: string
  }
  contactDetails: {
    email: string
    phoneNumber?: string
    alternatePhone?: string
    website?: string
  }
  address: {
    street?: string
    city: string
    state: string
    lga?: string
    country: string
    postalCode?: string
  }
  
  // MoU/Agreement Documents
  mouDocuments?: Array<{
    id: string
    title: string
    documentUrl: string
    signedDate?: Date
    expiryDate?: Date
    status: 'draft' | 'signed' | 'expired' | 'renewed'
    uploadedAt: Date
  }>
  
  // Programs
  programsPartneredOn: string[] // Program IDs
  programNames?: string[] // For display purposes
  
  // Status & Rating
  status: PartnerStatus // Active / Dormant / Past
  relationshipRating?: RelationshipRating
  
  // Additional Information
  remarks?: string
  
  // Metadata
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Dashboard Types
export interface DashboardMetrics {
  totalBeneficiaries: number
  activePrograms: number
  totalDonations: number
  totalGrants: number
  programsByState: Record<string, number>
  beneficiariesByState: Record<string, number>
  donationsByMonth: Array<{
    month: string
    amount: number
  }>
  impactMetrics: {
    programsCompleted: number
    beneficiariesServed: number
    totalFunding: number
  }
}

export interface DashboardFilters {
  state?: string
  lga?: string
  programId?: string
  startDate?: Date
  endDate?: Date
}

// Audit Log Types
export interface AuditLog {
  id: string
  userId: string
  userEmail: string
  action: string
  resourceType: string
  resourceId: string
  changes?: Record<string, { old: unknown; new: unknown }>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

// Form Types
export interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'gps'
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface CustomForm {
  id: string
  name: string
  programId?: string
  fields: FormField[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Offline Sync Types
export interface PendingSync {
  id: string
  collection: string
  documentId: string
  action: 'create' | 'update' | 'delete'
  data: unknown
  timestamp: Date
  retryCount: number
  status: 'pending' | 'syncing' | 'failed' | 'completed'
}

// Calendar & Workflow Types
export type CalendarEventType =
  | 'monitoring_visit'
  | 'grant_reporting_deadline'
  | 'donor_feedback'
  | 'monthly_program'
  | 'weekly_program'
  | 'birthday'
  | 'anniversary'
  | 'official_date'
  | 'blp_event'
  | 'meeting'
  | 'training'
  | 'other'

export type CalendarEventScope = 'national' | 'state' | 'program' | 'lga'

export type ReminderFrequency = 'none' | 'daily' | 'weekly' | 'monthly'

export interface CalendarEvent {
  id: string
  // Basic Information
  title: string
  description?: string
  type: CalendarEventType
  scope: CalendarEventScope
  
  // Date & Time
  startDate: Date
  endDate?: Date
  allDay: boolean
  startTime?: string // HH:mm format
  endTime?: string // HH:mm format
  timezone?: string
  
  // Location & Scope Details
  state?: string
  lga?: string
  programId?: string
  programName?: string // For display purposes
  location?: {
    address?: string
    city?: string
    state?: string
    gpsLocation?: {
      latitude: number
      longitude: number
    }
  }
  
  // Reminders
  reminders: Array<{
    id: string
    type: 'email' | 'sms' | 'push' | 'in_app'
    frequency: ReminderFrequency
    daysBefore: number // Days before event to send reminder
    enabled: boolean
    lastSent?: Date
    nextSend?: Date
  }>
  
  // Recurrence
  isRecurring: boolean
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number // Every N days/weeks/months/years
    endDate?: Date
    occurrences?: number
    daysOfWeek?: number[] // 0 = Sunday, 6 = Saturday
    dayOfMonth?: number
    monthOfYear?: number
  }
  
  // Attendees & Participants
  attendees?: Array<{
    id: string
    name: string
    email?: string
    role?: string
    rsvpStatus?: 'pending' | 'accepted' | 'declined' | 'tentative'
  }>
  assignedTo?: string[] // User IDs
  assignedToNames?: string[] // For display purposes
  
  // Related Entities
  relatedBeneficiaryIds?: string[]
  relatedPartnerIds?: string[]
  relatedGrantIds?: string[]
  relatedDonationIds?: string[]
  
  // Status & Metadata
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  color?: string // Hex color for calendar display
  tags?: string[]
  
  // Attachments & Documentation
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
    uploadedAt: Date
  }>
  
  // Notes & Follow-up
  notes?: string
  followUpRequired: boolean
  followUpDate?: Date
  followUpNotes?: string
  
  // Metadata
  createdBy: string
  createdAt: Date
  updatedAt: Date
  lastReminderSent?: Date
}

// Project Types
export type ProjectType = 
  | 'construction'
  | 'renovation'
  | 'hospitals'
  | 'water_projects'
  | 'skill_empowerment'
  | 'community_outreach'
  | 'grants'
  | 'institutional_support'

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'

export interface Project {
  id: string
  name: string
  type: ProjectType
  description?: string
  objectives?: string[]
  location?: {
    address?: string
    city?: string
    state?: string
    lga?: string
    country?: string
    gpsLocation?: {
      latitude: number
      longitude: number
    }
  }
  budget: {
    allocated: number
    spent: number
    currency: string
    breakdown?: Array<{
      id: string
      category: string
      amount: number
      description?: string
    }>
  }
  timeline: {
    startDate: Date
    endDate?: Date
    milestones?: Array<{
      id: string
      title: string
      description?: string
      targetDate: Date
      status: 'pending' | 'in_progress' | 'completed' | 'overdue'
      completionDate?: Date
    }>
  }
  contractors?: Array<{
    id: string
    name: string
    type: 'contractor' | 'partner' | 'supplier'
    contactPerson?: string
    email?: string
    phoneNumber?: string
    contractAmount?: number
    contractStartDate?: Date
    contractEndDate?: Date
    status: 'active' | 'completed' | 'terminated'
  }>
  partnerIds?: string[]
  partnerNames?: string[]
  documents?: Array<{
    id: string
    title: string
    type: 'contract' | 'proposal' | 'report' | 'permit' | 'certificate' | 'other'
    documentUrl: string
    uploadedAt: Date
    uploadedBy?: string
    description?: string
  }>
  activityLog?: Array<{
    id: string
    date: Date
    user: string
    userName?: string
    action: string
    description: string
    attachments?: string[]
  }>
  progress: {
    percentage: number
    lastUpdated: Date
    notes?: string
  }
  media?: Array<{
    id: string
    type: 'photo' | 'video'
    url: string
    caption?: string
    uploadedAt: Date
    uploadedBy?: string
  }>
  completionCertificate?: {
    certificateUrl: string
    issuedDate?: Date
    issuedBy?: string
    certificateNumber?: string
  }
  impactSummary?: {
    beneficiariesReached?: number
    communitiesImpacted?: number
    outcomes?: string[]
    metrics?: Record<string, number | string>
    notes?: string
  }
  status: ProjectStatus
  createdBy: string
  createdAt: Date
  updatedAt: Date
  notes?: string
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'

export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked'

export interface WorkflowStep {
  id: string
  title: string
  description?: string
  order: number
  status: WorkflowStepStatus
  assignedTo?: string[] // User IDs
  assignedToNames?: string[] // For display purposes
  dueDate?: Date
  completedDate?: Date
  completedBy?: string
  dependencies?: string[] // IDs of steps that must be completed first
  estimatedDuration?: number // In hours
  actualDuration?: number // In hours
  notes?: string
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
    uploadedAt: Date
  }>
  checklist?: Array<{
    id: string
    item: string
    completed: boolean
    completedAt?: Date
  }>
}

export interface Workflow {
  id: string
  // Basic Information
  title: string
  description?: string
  category: 'program' | 'grant' | 'donation' | 'monitoring' | 'reporting' | 'compliance' | 'other'
  
  // Steps & Process
  steps: WorkflowStep[]
  currentStepId?: string
  
  // Related Entities
  programId?: string
  programName?: string // For display purposes
  grantId?: string
  donationId?: string
  partnerId?: string
  beneficiaryId?: string
  
  // Timeline
  startDate: Date
  targetEndDate?: Date
  actualEndDate?: Date
  
  // Status & Progress
  status: WorkflowStatus
  progress: number // 0-100 percentage
  completionPercentage: number // Calculated from completed steps
  
  // Assignment & Ownership
  assignedTo?: string[] // User IDs
  assignedToNames?: string[] // For display purposes
  ownerId: string // User ID of workflow owner
  ownerName?: string // For display purposes
  
  // Priority & Tags
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
  
  // Notifications & Reminders
  reminders?: Array<{
    id: string
    type: 'email' | 'sms' | 'push' | 'in_app'
    trigger: 'step_due' | 'step_overdue' | 'workflow_due' | 'workflow_overdue'
    daysBefore?: number
    enabled: boolean
    lastSent?: Date
  }>
  
  // Templates & Reusability
  isTemplate: boolean
  templateId?: string // If created from a template
  canBeReused: boolean
  
  // Attachments & Documentation
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
    uploadedAt: Date
  }>
  
  // Notes & History
  notes?: string
  history?: Array<{
    id: string
    action: string
    performedBy: string
    performedByName?: string
    timestamp: Date
    details?: string
    stepId?: string
  }>
  
  // Metadata
  createdBy: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  cancelledAt?: Date
  cancelledBy?: string
  cancelledReason?: string
}

