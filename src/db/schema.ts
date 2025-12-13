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

export type ImportSource = "url" | "text" | "manual"

export type Application = {
  id: string
  userId: string
  companyId?: string
  title: string
  status: ApplicationStatus
  priority?: boolean // Priorité manuelle ou suggérée
  notes?: string
  appliedAt?: Date
  deadline?: Date
  contractType?: ContractType // Ancien champ pour compatibilité
  contractTypes?: ContractType[] // Nouveau champ pour plusieurs types
  location?: string
  salaryRange?: string
  source?: ApplicationSource
  jobUrl?: string
  importSource?: ImportSource // Source d'import : url, text, manual
  createdAt: Date
  updatedAt: Date
}

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+"

export type CompanyType = "startup" | "pme" | "scale_up" | "grand_groupe" | "autre"

export type WorkMode = "remote" | "hybrid" | "on_site"

export type Company = {
  id: string
  name: string
  website?: string
  sector?: string
  size?: CompanySize
  type?: CompanyType
  location?: string
  workMode?: WorkMode
  createdAt: Date
}

export type DocumentType = "cv" | "cover_letter"
export type DocumentFormat = "markdown" | "plain_text" | "html"

export type Document = {
  id: string
  userId: string
  type: DocumentType
  title: string
  content: string
  format: DocumentFormat
  templateId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export type DocumentTemplate = {
  id: string
  name: string
  description?: string | null
  type: DocumentType
  format: DocumentFormat
  content: string
  isPublic: boolean
  userId?: string | null
  thumbnail?: string | null
  createdAt: Date
  updatedAt: Date
}

export type DocumentVersion = {
  id: string
  documentId: string
  version: string
  title: string
  content: string
  format: DocumentFormat
  changelog?: string | null
  createdAt: Date
}

export type ActivityType =
  | "application_created"
  | "application_updated"
  | "application_status_changed"
  | "application_deleted"
  | "interview_scheduled"
  | "note_added"
  | "contact_added"
  | "contact_updated"
  | "contact_deleted"

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

export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "rescheduled"

export type InterviewType = "phone" | "video" | "on_site" | "technical" | "hr" | "final" | "autre"

export type Interview = {
  id: string
  applicationId: string
  userId: string
  title: string
  scheduledAt: Date
  duration?: string
  location?: string
  type?: InterviewType
  interviewerName?: string
  interviewerEmail?: string
  notes?: string
  status: InterviewStatus
  createdAt: Date
  updatedAt: Date
}

export type ReminderType = "follow_up" | "deadline" | "interview" | "custom"

export type ReminderStatus = "pending" | "completed" | "dismissed"

export type Reminder = {
  id: string
  userId: string
  applicationId?: string
  interviewId?: string
  type: ReminderType
  title: string
  description?: string
  dueDate: Date
  status: ReminderStatus
  isAutomatic: boolean
  createdAt: Date
  completedAt?: Date
}

// Types pour la gamification
export type BadgeType =
  | "first_application"
  | "first_interview"
  | "first_acceptance"
  | "applications_10"
  | "applications_50"
  | "applications_100"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "cv_created"
  | "letter_created"
  | "ai_used"
  | "profile_complete"

export type UserBadge = {
  id: string
  userId: string
  badgeType: BadgeType
  earnedAt: Date
}

export type UserPoint = {
  id: string
  userId: string
  points: number
  reason: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export type UserStreak = {
  id: string
  userId: string
  currentStreak: number
  longestStreak: number
  lastActivityDate?: Date
  updatedAt: Date
}

export type GoalType = "applications_count" | "interviews_count" | "streak_days" | "points_earned"

export type GoalPeriod = "daily" | "weekly" | "monthly"

export type UserGoal = {
  id: string
  userId: string
  type: GoalType
  period: GoalPeriod
  target: number
  current: number
  startDate: Date
  endDate?: Date
  completed: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}



