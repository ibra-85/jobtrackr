import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { documentTemplatesRepository } from "@/db/repositories/document-templates.repository"
import type { ApiResponse } from "@/types/api"
import type { DocumentTemplate } from "@/db/schema"

/**
 * GET /api/documents/templates
 * Récupère tous les templates disponibles (publics + utilisateur)
 * Query params optionnels :
 * - type: Filtrer par type (cv, cover_letter)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as "cv" | "cover_letter" | null

    let templates: DocumentTemplate[]
    if (type === "cv" || type === "cover_letter") {
      templates = await documentTemplatesRepository.getByType(type, session.user.id)
    } else {
      templates = await documentTemplatesRepository.getAll(session.user.id)
    }

    return NextResponse.json({
      data: templates,
    } as ApiResponse<DocumentTemplate[]>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/documents/templates
 * Crée un nouveau template (privé à l'utilisateur)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()

    const { name, description, type, format, content, thumbnail } = body

    if (!name || !type || !format || !content) {
      return NextResponse.json(
        { error: "Nom, type, format et contenu requis" },
        { status: 400 }
      )
    }

    const template = await documentTemplatesRepository.create({
      name,
      description,
      type,
      format,
      content,
      isPublic: false, // Templates utilisateur privés par défaut
      userId: session.user.id,
      thumbnail,
    })

    return NextResponse.json(
      {
        data: template,
      } as ApiResponse<DocumentTemplate>,
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

