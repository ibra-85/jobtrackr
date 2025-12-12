import { pgTable, uuid, text, timestamp, jsonb, pgEnum, index, boolean } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "in_progress",
  "accepted",
  "rejected",
])

export const documentTypeEnum = pgEnum("document_type", ["cv", "cover_letter"])

export const contractTypeEnum = pgEnum("contract_type", [
  "cdi",
  "cdd",
  "stage",
  "alternance",
  "freelance",
  "autre",
])

export const applicationSourceEnum = pgEnum("application_source", [
  "linkedin",
  "indeed",
  "welcome_to_the_jungle",
  "site_carriere",
  "cooptation",
  "email",
  "autre",
])

export const importSourceEnum = pgEnum("import_source", ["url", "text", "manual"])

export const activityTypeEnum = pgEnum("activity_type", [
  "application_created",
  "application_updated",
  "application_status_changed",
  "application_deleted",
  "interview_scheduled",
  "note_added",
  "contact_added",
  "contact_updated",
  "contact_deleted",
])

// Better Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull().default("credential"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// Enums pour entreprises
export const companySizeEnum = pgEnum("company_size", [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
])

export const companyTypeEnum = pgEnum("company_type", [
  "startup",
  "pme",
  "scale_up",
  "grand_groupe",
  "autre",
])

export const workModeEnum = pgEnum("work_mode", [
  "remote",
  "hybrid",
  "on_site",
])

// Tables métier
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  website: text("website"),
  sector: text("sector"), // Secteur d'activité (ex: "Tech", "Finance", "E-commerce")
  size: companySizeEnum("size"), // Taille de l'entreprise
  type: companyTypeEnum("type"), // Type d'entreprise
  location: text("location"), // Localisation principale (ville, pays)
  workMode: workModeEnum("work_mode"), // Mode de travail principal
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    status: applicationStatusEnum("status").notNull().default("pending"),
    priority: boolean("priority").notNull().default(false), // Priorité manuelle ou suggérée
    // Champs supplémentaires
    notes: text("notes"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    deadline: timestamp("deadline", { withTimezone: true }),
    contractType: contractTypeEnum("contract_type"), // Ancien champ pour compatibilité
    contractTypes: jsonb("contract_types"), // Nouveau champ pour plusieurs types (stocké en JSON)
    location: text("location"),
    salaryRange: text("salary_range"),
    source: applicationSourceEnum("source"),
    jobUrl: text("job_url"),
    importSource: importSourceEnum("import_source"), // Source d'import : url, text, manual
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_applications_user_id").on(table.userId),
    statusIdx: index("idx_applications_status").on(table.status),
    priorityIdx: index("idx_applications_priority").on(table.priority),
  }),
)

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    type: documentTypeEnum("type").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_documents_user_id").on(table.userId),
  }),
)

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_activities_user_id").on(table.userId),
    applicationIdIdx: index("idx_activities_application_id").on(table.applicationId),
  }),
)

// Relations Better Auth
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

// Relations métier
export const companiesRelations = relations(companies, ({ many }) => ({
  applications: many(applications),
}))


export const activitiesRelations = relations(activities, ({ one }) => ({
  application: one(applications, {
    fields: [activities.applicationId],
    references: [applications.id],
  }),
}))

// Table pour les notes personnelles (plusieurs notes par candidature)
export const applicationNotes = pgTable(
  "application_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    applicationIdIdx: index("idx_application_notes_application_id").on(table.applicationId),
    userIdIdx: index("idx_application_notes_user_id").on(table.userId),
  }),
)

// Table pour les contacts associés aux candidatures
export const applicationContacts = pgTable(
  "application_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role"), // Ex: "RH", "Recruteur tech", "Manager", etc.
    email: text("email"),
    linkedinUrl: text("linkedin_url"),
    phone: text("phone"),
    notes: text("notes"), // Notes sur le contact (feedback, affinité, etc.)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    applicationIdIdx: index("idx_application_contacts_application_id").on(table.applicationId),
    userIdIdx: index("idx_application_contacts_user_id").on(table.userId),
  }),
)

// Relations pour notes et contacts
export const applicationNotesRelations = relations(applicationNotes, ({ one }) => ({
  application: one(applications, {
    fields: [applicationNotes.applicationId],
    references: [applications.id],
  }),
}))

export const applicationContactsRelations = relations(applicationContacts, ({ one }) => ({
  application: one(applications, {
    fields: [applicationContacts.applicationId],
    references: [applications.id],
  }),
}))

// Table pour les entretiens
export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(), // Ex: "Entretien technique", "Entretien RH", etc.
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    duration: text("duration"), // Ex: "30 min", "1h", etc.
    location: text("location"), // Ex: "Bureau Paris", "Remote (Zoom)", etc.
    type: text("type"), // Ex: "phone", "video", "on_site", "technical", "hr", etc.
    interviewerName: text("interviewer_name"),
    interviewerEmail: text("interviewer_email"),
    notes: text("notes"), // Notes préparatoires ou post-entretien
    status: text("status").default("scheduled"), // "scheduled", "completed", "cancelled", "rescheduled"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    applicationIdIdx: index("idx_interviews_application_id").on(table.applicationId),
    userIdIdx: index("idx_interviews_user_id").on(table.userId),
    scheduledAtIdx: index("idx_interviews_scheduled_at").on(table.scheduledAt),
  }),
)

export const applicationsRelationsWithNotes = relations(applications, ({ one, many }) => ({
  company: one(companies, {
    fields: [applications.companyId],
    references: [companies.id],
  }),
  activities: many(activities),
  notes: many(applicationNotes),
  contacts: many(applicationContacts),
  interviews: many(interviews),
}))

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}))

