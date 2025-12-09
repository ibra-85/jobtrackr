import { NextRequest, NextResponse } from "next/server"
import { companiesRepository } from "@/db/repositories/companies.repository"

/**
 * GET /api/companies
 * Récupère toutes les entreprises
 */
export async function GET(request: NextRequest) {
  try {
    const companies = await companiesRepository.getAll()
    return NextResponse.json(companies)
  } catch (error) {
    console.error("Erreur lors de la récupération des entreprises:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des entreprises" },
      { status: 500 },
    )
  }
}

/**
 * POST /api/companies
 * Crée une nouvelle entreprise
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, website } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est requis" },
        { status: 400 },
      )
    }

    const company = await companiesRepository.create({
      name: name.trim(),
      website: website?.trim() || undefined,
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création de l'entreprise:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de l'entreprise" },
      { status: 500 },
    )
  }
}

