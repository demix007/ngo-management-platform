export type ReportType =
  | 'beneficiaries'
  | 'programs'
  | 'donations'
  | 'grants'
  | 'partners'
  | 'projects'
  | 'financial'
  | 'impact'
  | 'comprehensive'

export type ReportFormat = 'pdf' | 'doc' | 'excel' | 'csv'

export interface ReportFilters {
  type: ReportType
  startDate?: Date
  endDate?: Date
  state?: string
  lga?: string
  programId?: string
  donorId?: string
  partnerId?: string
  status?: string
  [key: string]: unknown
}

export interface GeneratedReport {
  id: string
  title: string
  type: ReportType
  format: ReportFormat
  filters: ReportFilters
  generatedAt: Date
  generatedBy: string
  fileUrl?: string
  fileSize?: number
  status: 'pending' | 'completed' | 'failed'
  metadata?: Record<string, unknown>
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: ReportType
  defaultFilters?: Partial<ReportFilters>
  sections: ReportSection[]
}

export interface ReportSection {
  id: string
  title: string
  type: 'summary' | 'table' | 'chart' | 'text' | 'image'
  data?: unknown
  config?: Record<string, unknown>
}

