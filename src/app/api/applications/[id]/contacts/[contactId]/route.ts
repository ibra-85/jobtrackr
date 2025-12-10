import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { contactsRepository } from "@/db/repositories/contacts.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"

/**
 * PUT /api/applications/[id]/contacts/[contactId]
 * Met à jour un contact
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { contactId } = await params

    const body = await request.json()
    const { name, role, email, linkedinUrl, phone, notes } = body

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Le nom du contact ne peut pas être vide" },
        { status: 400 },
      )
    }

    const updateData: {
      name?: string
      role?: string
      email?: string
      linkedinUrl?: string
      phone?: string
      notes?: string
    } = {}

    if (name !== undefined) updateData.name = name.trim()
    if (role !== undefined) updateData.role = role?.trim() || undefined
    if (email !== undefined) updateData.email = email?.trim() || undefined
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl?.trim() || undefined
    if (phone !== undefined) updateData.phone = phone?.trim() || undefined
    if (notes !== undefined) updateData.notes = notes?.trim() || undefined

    const contact = await contactsRepository.update(contactId, session.user.id, updateData)

    // Créer une activité pour la modification de contact
    await activitiesRepository.create(session.user.id, {
      applicationId: contact.applicationId,
      type: "note_added",
      description: `Contact modifié : ${contact.name}`,
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Erreur lors de la mise à jour du contact:", error)
    if (error instanceof Error && error.message.includes("non trouvé")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour du contact" },
      { status: 500 },
    )
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
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { contactId } = await params

    // Récupérer le contact avant suppression pour avoir l'applicationId et le nom
    const contact = await contactsRepository.getById(contactId, session.user.id)
    if (!contact) {
      return NextResponse.json({ error: "Contact non trouvé" }, { status: 404 })
    }

    await contactsRepository.delete(contactId, session.user.id)

    // Créer une activité pour la suppression de contact
    await activitiesRepository.create(session.user.id, {
      applicationId: contact.applicationId,
      type: "note_added",
      description: `Contact supprimé : ${contact.name}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression du contact:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression du contact" },
      { status: 500 },
    )
  }
}

