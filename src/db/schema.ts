// Schéma métier générique (indépendant de Supabase / Prisma / Drizzle)

export type User = {
  id: string
  email: string
  name?: string
  createdAt: Date
}

export type ApplicationStatus = "pending" | "in_progress" | "accepted" | "rejected"

export type Application = {
  id: string
  userId: string
  companyId?: string
  title: string
  status: ApplicationStatus
  createdAt: Date
  updatedAt: Date
}

export type Company = {
  id: string
  name: string
  website?: string
  createdAt: Date
}



