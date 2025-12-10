import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { contactsRepository } from "@/db/repositories/contacts.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"

/**
 * GET /api/applications/[id]/contacts
 * Récupère tous les contacts d'une candidature
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const application = await applicationsRepository.getById(id, session.user.id)
    if (!application) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
    }

    const contacts = await contactsRepository.getByApplicationId(id, session.user.id)

    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Erreur lors de la récupération des contacts:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des contacts" },
      { status: 500 },
    )
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
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const application = await applicationsRepository.getById(id, session.user.id)
    if (!application) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
    }

    const body = await request.json()
    const { name, role, email, linkedinUrl, phone, notes } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du contact est requis" },
        { status: 400 },
      )
    }

    const contact = await contactsRepository.create(id, session.user.id, {
      name: name.trim(),
      role: role?.trim() || undefined,
      email: email?.trim() || undefined,
      linkedinUrl: linkedinUrl?.trim() || undefined,
      phone: phone?.trim() || undefined,
      notes: notes?.trim() || undefined,
    })

    // Créer une activité pour l'ajout de contact
    await activitiesRepository.create(session.user.id, {
      applicationId: id,
      type: "note_added",
      description: `Contact ajouté : ${name.trim()}`,
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création du contact:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du contact" },
      { status: 500 },
    )
  }
}

