import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { contactsRepository } from "@/db/repositories/contacts.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { CreateApplicationContactSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { ApplicationContact } from "@/db/schema"

/**
 * GET /api/applications/[id]/contacts
 * Récupère tous les contacts d'une candidature
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const application = await applicationsRepository.getById(id, session.user.id)
    if (!application) {
      throw new NotFoundError("Candidature")
    }

    const contacts = await contactsRepository.getByApplicationId(id, session.user.id)

    return NextResponse.json({
      data: contacts,
    } as ApiResponse<ApplicationContact[]>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/applications/[id]/contacts
 * Crée un nouveau contact pour une candidature
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const application = await applicationsRepository.getById(id, session.user.id)
    if (!application) {
      throw new NotFoundError("Candidature")
    }

    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(CreateApplicationContactSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { name, role, email, linkedinUrl, phone, notes } = validation.data

    const contact = await contactsRepository.create(id, session.user.id, {
      name,
      role: role && role !== "" ? role : undefined,
      email: email && email !== "" ? email : undefined,
      linkedinUrl: linkedinUrl && linkedinUrl !== "" ? linkedinUrl : undefined,
      phone: phone && phone !== "" ? phone : undefined,
      notes: notes && notes !== "" ? notes : undefined,
    })

    // Créer une activité pour l'ajout de contact
    await activitiesRepository.create(session.user.id, {
      applicationId: id,
      type: "contact_added",
      description: `Contact ajouté : ${name}`,
    })

    return NextResponse.json(
      {
        data: contact,
      } as ApiResponse<ApplicationContact>,
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

