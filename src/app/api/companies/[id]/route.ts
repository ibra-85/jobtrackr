import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { UpdateCompanySchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { CompanyResponse } from "@/types/api"

/**
 * GET /api/companies/[id]
 * Récupère une entreprise par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(request)
    const { id } = await params

    const company = await companiesRepository.getById(id)
    if (!company) {
      throw new NotFoundError("Entreprise")
    }

    return NextResponse.json({
      data: company,
    } as CompanyResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/companies/[id]
 * Met à jour une entreprise
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(UpdateCompanySchema, body)
    if (!validation.success) {
      return validation.error
    }

    // Vérifier que l'entreprise existe
    const existingCompany = await companiesRepository.getById(id)
    if (!existingCompany) {
      throw new NotFoundError("Entreprise")
    }

    const { name, website, sector, size, type, location, workMode } = validation.data

    const updatedCompany = await companiesRepository.update(id, {
      name: name || existingCompany.name,
      website: website && website !== "" ? website : undefined,
      sector: sector && sector !== "" ? sector : undefined,
      size: size || undefined,
      type: type || undefined,
      location: location && location !== "" ? location : undefined,
      workMode: workMode || undefined,
    })

    return NextResponse.json({
      data: updatedCompany,
    } as CompanyResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

