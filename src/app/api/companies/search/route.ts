import { NextRequest, NextResponse } from "next/server"
import { companiesRepository } from "@/db/repositories/companies.repository"

/**
 * GET /api/companies/search?q=query
 * Recherche des entreprises par nom
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    const companies = await companiesRepository.searchByName(query.trim())
    return NextResponse.json(companies)
  } catch (error) {
    console.error("Erreur lors de la recherche d'entreprises:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la recherche d'entreprises" },
      { status: 500 },
    )
  }
}

