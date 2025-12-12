import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { documentsRepository } from "@/db/repositories/documents.repository"
import { CreateDocumentSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { Document } from "@/db/schema"

/**
 * GET /api/documents
 * Récupère tous les documents de l'utilisateur
 * Query params optionnels :
 * - type: Filtrer par type (cv, cover_letter)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as "cv" | "cover_letter" | null

    let documents: Document[]
    if (type === "cv" || type === "cover_letter") {
      documents = await documentsRepository.getByType(session.user.id, type)
    } else {
      documents = await documentsRepository.getAllByUserId(session.user.id)
    }

    return NextResponse.json({
      data: documents,
    } as ApiResponse<Document[]>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/documents
 * Crée un nouveau document
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(CreateDocumentSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { type, title, content } = validation.data

    const document = await documentsRepository.create(session.user.id, {
      type,
      title,
      content,
    })

    return NextResponse.json(
      {
        data: document,
      } as ApiResponse<Document>,
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

