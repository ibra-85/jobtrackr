import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { contactsRepository } from "@/db/repositories/contacts.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { UpdateApplicationContactSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { ApplicationContact } from "@/db/schema"

/**
 * PUT /api/applications/[id]/contacts/[contactId]
 * Met à jour un contact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { contactId } = await params

    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(UpdateApplicationContactSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { name, role, email, linkedinUrl, phone, notes } = validation.data

    const updateData: {
      name?: string
      role?: string
      email?: string
      linkedinUrl?: string
      phone?: string
      notes?: string
    } = {}

    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role && role !== "" ? role : undefined
    if (email !== undefined) updateData.email = email && email !== "" ? email : undefined
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl && linkedinUrl !== "" ? linkedinUrl : undefined
    if (phone !== undefined) updateData.phone = phone && phone !== "" ? phone : undefined
    if (notes !== undefined) updateData.notes = notes && notes !== "" ? notes : undefined

    const contact = await contactsRepository.update(contactId, session.user.id, updateData)

    // Créer une activité pour la modification de contact
    await activitiesRepository.create(session.user.id, {
      applicationId: contact.applicationId,
      type: "contact_updated",
      description: `Contact modifié : ${contact.name}`,
    })

    return NextResponse.json({
      data: contact,
    } as ApiResponse<ApplicationContact>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/applications/[id]/contacts/[contactId]
 * Supprime un contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { contactId } = await params

    // Récupérer le contact avant suppression pour avoir l'applicationId et le nom
    const contact = await contactsRepository.getById(contactId, session.user.id)
    if (!contact) {
      throw new NotFoundError("Contact")
    }

    await contactsRepository.delete(contactId, session.user.id)

    // Créer une activité pour la suppression de contact
    await activitiesRepository.create(session.user.id, {
      applicationId: contact.applicationId,
      type: "contact_deleted",
      description: `Contact supprimé : ${contact.name}`,
    })

    return NextResponse.json({
      data: { success: true },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

