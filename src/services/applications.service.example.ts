/**
 * EXEMPLE : Service pour la logique métier des candidatures.
 * 
 * Ce fichier montre comment structurer un service pour séparer
 * la logique métier des API routes.
 * 
 * Pour utiliser ce service :
 * 1. Renommer ce fichier en `applications.service.ts`
 * 2. Implémenter les méthodes manquantes dans le repository
 * 3. Mettre à jour les API routes pour utiliser ce service
 */

import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/lib/validation/schemas"
import type { Application, ApplicationStatus } from "@/db/schema"
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels"
import { NotFoundError } from "@/lib/api/errors"
import type { ApplicationWithCompany } from "@/types/api"

export class ApplicationsService {
  /**
   * Crée une nouvelle candidature avec logique métier associée
   */
  async createApplication(
    userId: string,
    data: CreateApplicationInput
  ): Promise<ApplicationWithCompany> {
    // Vérifier que l'entreprise existe si fournie
    if (data.companyId && data.companyId !== "") {
      const company = await companiesRepository.getById(data.companyId)
      if (!company) {
        throw new NotFoundError("Entreprise")
      }
    }

    // Créer la candidature
    const application = await applicationsRepository.create(userId, {
      title: data.title,
      companyId: data.companyId && data.companyId !== "" ? data.companyId : undefined,
      status: data.status || "pending",
      priority: data.priority ?? false,
      notes: data.notes && data.notes !== "" ? data.notes : undefined,
      appliedAt: data.appliedAt && data.appliedAt !== "" ? new Date(data.appliedAt) : undefined,
      deadline: data.deadline && data.deadline !== "" ? new Date(data.deadline) : undefined,
      contractType: data.contractType || undefined,
      location: data.location && data.location !== "" ? data.location : undefined,
      salaryRange: data.salaryRange && data.salaryRange !== "" ? data.salaryRange : undefined,
      source: data.source || undefined,
      jobUrl: data.jobUrl && data.jobUrl !== "" ? data.jobUrl : undefined,
    })

    // Créer l'activité de création
    await activitiesRepository.create(userId, {
      applicationId: application.id,
      type: "application_created",
      description: `Candidature créée : "${data.title}"`,
    })

    // Enrichir avec l'entreprise
    let company = undefined
    if (application.companyId) {
      company = await companiesRepository.getById(application.companyId)
    }

    return { ...application, company: company || undefined }
  }

  /**
   * Met à jour une candidature avec gestion des activités
   */
  async updateApplication(
    userId: string,
    id: string,
    data: UpdateApplicationInput
  ): Promise<ApplicationWithCompany> {
    // Vérifier que la candidature existe
    const existing = await applicationsRepository.getById(id, userId)
    if (!existing) {
      throw new NotFoundError("Candidature")
    }

    // Vérifier que l'entreprise existe si fournie
    if (data.companyId && data.companyId !== "") {
      const company = await companiesRepository.getById(data.companyId)
      if (!company) {
        throw new NotFoundError("Entreprise")
      }
    }

    // Préparer les données de mise à jour
    const updateData: Parameters<typeof applicationsRepository.update>[2] = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.companyId !== undefined) {
      updateData.companyId = data.companyId && data.companyId !== "" ? data.companyId : undefined
    }
    if (data.status !== undefined) updateData.status = data.status
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.notes !== undefined) {
      updateData.notes = data.notes && data.notes !== "" ? data.notes : undefined
    }
    if (data.appliedAt !== undefined) {
      updateData.appliedAt = data.appliedAt && data.appliedAt !== "" ? new Date(data.appliedAt) : undefined
    }
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline && data.deadline !== "" ? new Date(data.deadline) : undefined
    }
    if (data.contractType !== undefined) updateData.contractType = data.contractType || undefined
    if (data.location !== undefined) {
      updateData.location = data.location && data.location !== "" ? data.location : undefined
    }
    if (data.salaryRange !== undefined) {
      updateData.salaryRange = data.salaryRange && data.salaryRange !== "" ? data.salaryRange : undefined
    }
    if (data.source !== undefined) updateData.source = data.source || undefined
    if (data.jobUrl !== undefined) {
      updateData.jobUrl = data.jobUrl && data.jobUrl !== "" ? data.jobUrl : undefined
    }

    // Mettre à jour la candidature
    const updated = await applicationsRepository.update(id, userId, updateData)

    // Créer les activités selon les changements
    await this.createUpdateActivities(userId, id, existing, updated, data)

    // Enrichir avec l'entreprise
    let company = undefined
    if (updated.companyId) {
      company = await companiesRepository.getById(updated.companyId)
    }

    return { ...updated, company: company || undefined }
  }

  /**
   * Crée les activités appropriées selon les changements détectés
   */
  private async createUpdateActivities(
    userId: string,
    applicationId: string,
    existing: Application,
    updated: Application,
    changes: UpdateApplicationInput
  ): Promise<void> {
    // Changement de statut
    if (changes.status && existing.status !== changes.status) {
      await activitiesRepository.create(userId, {
        applicationId,
        type: "application_status_changed",
        description: `Statut changé de "${APPLICATION_STATUS_LABELS[existing.status]}" à "${APPLICATION_STATUS_LABELS[changes.status]}"`,
        metadata: {
          oldStatus: existing.status,
          newStatus: changes.status,
        },
      })
      return // Un seul changement principal par mise à jour
    }

    // Modification du titre
    if (changes.title && existing.title !== changes.title) {
      await activitiesRepository.create(userId, {
        applicationId,
        type: "application_updated",
        description: `Titre modifié : "${existing.title}" → "${changes.title}"`,
      })
      return
    }

    // Changement d'entreprise
    if (changes.companyId !== undefined && existing.companyId !== changes.companyId) {
      const oldCompany = existing.companyId
        ? await companiesRepository.getById(existing.companyId)
        : null
      const newCompany = changes.companyId && changes.companyId !== ""
        ? await companiesRepository.getById(changes.companyId)
        : null

      await activitiesRepository.create(userId, {
        applicationId,
        type: "application_updated",
        description: `Entreprise modifiée : "${oldCompany?.name || "Aucune"}" → "${newCompany?.name || "Aucune"}"`,
      })
      return
    }

    // Autres modifications (créer une activité générique)
    const hasOtherChanges = 
      changes.notes !== undefined ||
      changes.appliedAt !== undefined ||
      changes.deadline !== undefined ||
      changes.contractType !== undefined ||
      changes.location !== undefined ||
      changes.salaryRange !== undefined ||
      changes.source !== undefined ||
      changes.jobUrl !== undefined

    if (hasOtherChanges) {
      await activitiesRepository.create(userId, {
        applicationId,
        type: "application_updated",
        description: "Candidature modifiée",
      })
    }
  }

  /**
   * Supprime une candidature avec création d'activité
   */
  async deleteApplication(userId: string, id: string): Promise<void> {
    // Vérifier que la candidature existe
    const existing = await applicationsRepository.getById(id, userId)
    if (!existing) {
      throw new NotFoundError("Candidature")
    }

    // Créer l'activité AVANT la suppression
    await activitiesRepository.create(userId, {
      applicationId: id,
      type: "application_deleted",
      description: `Candidature supprimée : "${existing.title}"`,
      metadata: {
        deletedApplicationTitle: existing.title,
        deletedApplicationStatus: existing.status,
      },
    })

    // Supprimer la candidature
    await applicationsRepository.delete(id, userId)
  }

  /**
   * Récupère une candidature avec son entreprise
   */
  async getApplicationWithCompany(
    userId: string,
    id: string
  ): Promise<ApplicationWithCompany> {
    const application = await applicationsRepository.getById(id, userId)
    if (!application) {
      throw new NotFoundError("Candidature")
    }

    // Enrichir avec l'entreprise
    let company = undefined
    if (application.companyId) {
      company = await companiesRepository.getById(application.companyId)
    }

    return { ...application, company: company || undefined }
  }
}

// Instance singleton pour utilisation dans les API routes
export const applicationsService = new ApplicationsService()

