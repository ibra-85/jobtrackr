import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { companiesRepository } from "@/db/repositories/companies.repository"
import type { CompaniesListResponse } from "@/types/api"

/**
 * GET /api/companies/search?q=query
 * Recherche des entreprises par nom
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request) // Protéger la route
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        data: [],
      } as CompaniesListResponse)
    }

    const companies = await companiesRepository.searchByName(query.trim())
    return NextResponse.json({
      data: companies,
    } as CompaniesListResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

