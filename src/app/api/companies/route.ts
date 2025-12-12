import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { CreateCompanySchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { CompaniesListResponse, CompanyResponse } from "@/types/api"

/**
 * GET /api/companies
 * Récupère toutes les entreprises de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request) // Protéger la route
    const companies = await companiesRepository.getAll()
    return NextResponse.json({
      data: companies,
    } as CompaniesListResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/companies
 * Crée une nouvelle entreprise
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request) // Protéger la route
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(CreateCompanySchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { name, website, sector, size, type, location, workMode } = validation.data

    const company = await companiesRepository.create({
      name,
      website: website && website !== "" ? website : undefined,
      sector: sector && sector !== "" ? sector : undefined,
      size: size || undefined,
      type: type || undefined,
      location: location && location !== "" ? location : undefined,
      workMode: workMode || undefined,
    })

    return NextResponse.json(
      {
        data: company,
      } as CompanyResponse,
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

