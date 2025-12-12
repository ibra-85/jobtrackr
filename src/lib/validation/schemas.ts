import { z } from "zod"

/**
 * Schémas de validation Zod pour les applications et entreprises
 */

// Enums
export const ApplicationStatusSchema = z.enum(["pending", "in_progress", "accepted", "rejected"])

export const ContractTypeSchema = z.enum([
  "cdi",
  "cdd",
  "stage",
  "alternance",
  "freelance",
  "autre",
])

export const ApplicationSourceSchema = z.enum([
  "linkedin",
  "indeed",
  "welcome_to_the_jungle",
  "site_carriere",
  "cooptation",
  "email",
  "autre",
])

export const ImportSourceSchema = z.enum(["url", "text", "manual"])

export const CompanySizeSchema = z.enum([
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
])

export const CompanyTypeSchema = z.enum([
  "startup",
  "pme",
  "scale_up",
  "grand_groupe",
  "autre",
])

export const WorkModeSchema = z.enum(["remote", "hybrid", "on_site"])

// Schéma pour créer une entreprise
export const CreateCompanySchema = z.object({
  name: z
    .string()
    .min(1, "Le nom de l'entreprise est requis")
    .max(255, "Le nom de l'entreprise est trop long (maximum 255 caractères)")
    .trim(),
  website: z
    .string()
    .url("L'URL du site web n'est pas valide")
    .optional()
    .or(z.literal("")),
  sector: z.string().max(255, "Le secteur est trop long").optional().or(z.literal("")),
  size: CompanySizeSchema.optional(),
  type: CompanyTypeSchema.optional(),
  location: z.string().max(255, "La localisation est trop longue").optional().or(z.literal("")),
  workMode: WorkModeSchema.optional(),
})

// Schéma pour mettre à jour une entreprise
export const UpdateCompanySchema = CreateCompanySchema.partial()

// Schéma pour créer une candidature
export const CreateApplicationSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre du poste est requis")
    .max(255, "Le titre est trop long (maximum 255 caractères)")
    .trim(),
  companyId: z.string().uuid("L'ID de l'entreprise n'est pas valide").optional().or(z.literal("")),
  status: ApplicationStatusSchema.optional().default("pending"),
  priority: z.boolean().optional().default(false),
  notes: z.string().max(10000, "Les notes sont trop longues").optional().or(z.literal("")),
  appliedAt: z
    .string()
    .refine(
      (val) => val === "" || !isNaN(Date.parse(val)),
      "La date de candidature n'est pas valide",
    )
    .optional()
    .or(z.literal("")),
  deadline: z
    .string()
    .refine(
      (val) => val === "" || !isNaN(Date.parse(val)),
      "La date limite n'est pas valide",
    )
    .optional()
    .or(z.literal("")),
  contractType: ContractTypeSchema.optional(), // Ancien champ pour compatibilité
  contractTypes: z.array(ContractTypeSchema).optional(), // Nouveau champ pour plusieurs types
  location: z.string().max(255, "La localisation est trop longue").optional().or(z.literal("")),
  salaryRange: z.string().max(100, "La fourchette salariale est trop longue").optional().or(z.literal("")),
  source: ApplicationSourceSchema.optional(),
  jobUrl: z
    .string()
    .url("L'URL de l'offre n'est pas valide")
    .optional()
    .or(z.literal("")),
  importSource: ImportSourceSchema.optional(),
})

// Schéma pour mettre à jour une candidature
export const UpdateApplicationSchema = CreateApplicationSchema.partial().extend({
  title: z
    .string()
    .min(1, "Le titre du poste est requis")
    .max(255, "Le titre est trop long (maximum 255 caractères)")
    .trim()
    .optional(),
})

// Schéma pour changer le statut d'une candidature
export const UpdateApplicationStatusSchema = z.object({
  status: ApplicationStatusSchema,
})

// Schéma pour créer une note
export const CreateApplicationNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu de la note est requis")
    .max(10000, "La note est trop longue (maximum 10000 caractères)")
    .trim(),
})

// Schéma pour mettre à jour une note
export const UpdateApplicationNoteSchema = CreateApplicationNoteSchema

// Schéma pour créer un contact
export const CreateApplicationContactSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du contact est requis")
    .max(255, "Le nom est trop long (maximum 255 caractères)")
    .trim(),
  role: z.string().max(255, "Le rôle est trop long").optional().or(z.literal("")),
  email: z
    .string()
    .email("L'adresse email n'est pas valide")
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("L'URL LinkedIn n'est pas valide")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50, "Le numéro de téléphone est trop long").optional().or(z.literal("")),
  notes: z.string().max(5000, "Les notes sont trop longues").optional().or(z.literal("")),
})

// Schéma pour mettre à jour un contact
export const UpdateApplicationContactSchema = CreateApplicationContactSchema.partial().extend({
  name: z
    .string()
    .min(1, "Le nom du contact est requis")
    .max(255, "Le nom est trop long (maximum 255 caractères)")
    .trim()
    .optional(),
})

// Enums pour les entretiens
export const InterviewStatusSchema = z.enum(["scheduled", "completed", "cancelled", "rescheduled"])

export const InterviewTypeSchema = z.enum([
  "phone",
  "video",
  "on_site",
  "technical",
  "hr",
  "final",
  "autre",
])

// Schéma pour créer un entretien
export const CreateInterviewSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre de l'entretien est requis")
    .max(255, "Le titre est trop long (maximum 255 caractères)")
    .trim(),
  scheduledAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "La date de l'entretien n'est pas valide"),
  duration: z.string().max(50, "La durée est trop longue").optional().or(z.literal("")),
  location: z.string().max(255, "La localisation est trop longue").optional().or(z.literal("")),
  type: InterviewTypeSchema.optional(),
  interviewerName: z.string().max(255, "Le nom est trop long").optional().or(z.literal("")),
  interviewerEmail: z
    .string()
    .email("L'adresse email n'est pas valide")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(10000, "Les notes sont trop longues").optional().or(z.literal("")),
  status: InterviewStatusSchema.optional().default("scheduled"),
})

// Schéma pour mettre à jour un entretien
export const UpdateInterviewSchema = CreateInterviewSchema.partial().extend({
  title: z
    .string()
    .min(1, "Le titre de l'entretien est requis")
    .max(255, "Le titre est trop long (maximum 255 caractères)")
    .trim()
    .optional(),
  scheduledAt: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), "La date de l'entretien n'est pas valide")
    .optional()
    .or(z.literal("")),
})

// Types TypeScript inférés depuis les schémas
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>
export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>
export type CreateApplicationNoteInput = z.infer<typeof CreateApplicationNoteSchema>
export type UpdateApplicationNoteInput = z.infer<typeof UpdateApplicationNoteSchema>
export type CreateApplicationContactInput = z.infer<typeof CreateApplicationContactSchema>
export type UpdateApplicationContactInput = z.infer<typeof UpdateApplicationContactSchema>
export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>
export type UpdateInterviewInput = z.infer<typeof UpdateInterviewSchema>

