import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { db } from "@/db/index"
import { user } from "@/db/drizzle-schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const UpdateUserSchema = z.object({
  name: z.string().min(1, "Le nom ne peut pas être vide").max(255, "Le nom est trop long"),
})

/**
 * PATCH /api/auth/user
 * Met à jour le profil utilisateur
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()

    // Valider les données avec Zod
    const validation = UpdateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name } = validation.data

    // Mettre à jour le nom de l'utilisateur
    await db
      .update(user)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))

    return NextResponse.json({
      data: {
        id: session.user.id,
        name,
        email: session.user.email,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/auth/user
 * Récupère le profil utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    if (!userData) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        image: userData.image,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

