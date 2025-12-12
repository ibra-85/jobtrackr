import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { documentsRepository } from "@/db/repositories/documents.repository"
import { UpdateDocumentSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { Document } from "@/db/schema"

/**
 * GET /api/documents/[id]
 * Récupère un document par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    const document = await documentsRepository.getById(id, session.user.id)
    if (!document) {
      throw new NotFoundError("Document")
    }

    return NextResponse.json({
      data: document,
    } as ApiResponse<Document>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/documents/[id]
 * Met à jour un document
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(UpdateDocumentSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const document = await documentsRepository.update(id, session.user.id, validation.data)

    return NextResponse.json({
      data: document,
    } as ApiResponse<Document>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/documents/[id]
 * Supprime un document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    await documentsRepository.delete(id, session.user.id)

    return NextResponse.json({
      data: { success: true },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

