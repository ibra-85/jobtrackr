// Schéma métier générique (indépendant de Supabase / Prisma / Drizzle)

export type User = {
  id: string
  email: string
  name?: string
  createdAt: Date
}

export type ApplicationStatus = "pending" | "in_progress" | "accepted" | "rejected"

export type ContractType = "cdi" | "cdd" | "stage" | "alternance" | "freelance" | "autre"

export type ApplicationSource =
  | "linkedin"
  | "indeed"
  | "welcome_to_the_jungle"
  | "site_carriere"
  | "cooptation"
  | "email"
  | "autre"

export type Application = {
  id: string
  userId: string
  companyId?: string
  title: string
  status: ApplicationStatus
  notes?: string
  appliedAt?: Date
  deadline?: Date
  contractType?: ContractType
  location?: string
  salaryRange?: string
  source?: ApplicationSource
  jobUrl?: string
  createdAt: Date
  updatedAt: Date
}

export type Company = {
  id: string
  name: string
  website?: string
  createdAt: Date
}

export type DocumentType = "cv" | "cover_letter"

export type Document = {
  id: string
  userId: string
  type: DocumentType
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export type ActivityType =
  | "application_created"
  | "application_updated"
  | "application_status_changed"
  | "application_deleted"
  | "interview_scheduled"
  | "note_added"

export type Activity = {
  id: string
  userId: string
  applicationId?: string
  type: ActivityType
  description: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export type ApplicationNote = {
  id: string
  applicationId: string
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export type ApplicationContact = {
  id: string
  applicationId: string
  userId: string
  name: string
  role?: string
  email?: string
  linkedinUrl?: string
  phone?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}



