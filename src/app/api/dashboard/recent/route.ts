import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import type { ApplicationsListResponse } from "@/types/api"

/**
 * GET /api/dashboard/recent
 * Récupère les candidatures récentes pour le dashboard
 * Optimisé avec JOIN pour éviter N+1 queries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Utiliser la méthode optimisée avec JOIN
    const allApplications = await applicationsRepository.getAllWithCompaniesByUserId(session.user.id)

    // Prendre les 5 plus récentes (déjà triées par createdAt DESC)
    const recentApplications = allApplications.slice(0, 5)

    return NextResponse.json({
      data: recentApplications,
    } as ApplicationsListResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

