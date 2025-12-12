/**
 * Utilitaires pour générer automatiquement des rappels pour les candidatures
 */

import type { Application, Interview } from "@/db/schema"
import { remindersRepository } from "@/db/repositories/reminders.repository"

/**
 * Génère automatiquement des rappels pour une candidature
 */
export async function generateAutomaticReminders(
  userId: string,
  application: Application
): Promise<void> {
  // Supprimer les anciens rappels automatiques pour cette candidature
  await remindersRepository.deleteAutomaticByApplicationId(application.id, userId)

  const now = new Date()

  // 1. Rappel de relance après candidature (7 jours si pas de réponse)
  if (application.appliedAt && application.status === "pending") {
    const followUpDate = new Date(application.appliedAt)
    followUpDate.setDate(followUpDate.getDate() + 7)

    // Ne créer le rappel que s'il est dans le futur
    if (followUpDate > now) {
      await remindersRepository.create(userId, {
        applicationId: application.id,
        type: "follow_up",
        title: `Relancer : ${application.title}`,
        description: `Pas de nouvelle depuis la candidature envoyée le ${new Date(application.appliedAt).toLocaleDateString("fr-FR")}`,
        dueDate: followUpDate,
        isAutomatic: true,
      })
    }
  }

  // 2. Rappel avant deadline (3 jours avant)
  if (application.deadline) {
    const deadlineDate = new Date(application.deadline)
    const reminderDate = new Date(deadlineDate)
    reminderDate.setDate(reminderDate.getDate() - 3)

    // Ne créer le rappel que s'il est dans le futur et pas déjà dépassé
    if (reminderDate > now && deadlineDate > now) {
      await remindersRepository.create(userId, {
        applicationId: application.id,
        type: "deadline",
        title: `Deadline approche : ${application.title}`,
        description: `La date limite de candidature est le ${deadlineDate.toLocaleDateString("fr-FR")}`,
        dueDate: reminderDate,
        isAutomatic: true,
      })
    }
  }
}

/**
 * Génère un rappel pour un entretien (1 jour avant)
 */
export async function generateInterviewReminder(
  userId: string,
  interview: Interview
): Promise<void> {
  const interviewDate = new Date(interview.scheduledAt)
  const reminderDate = new Date(interviewDate)
  reminderDate.setDate(reminderDate.getDate() - 1)
  reminderDate.setHours(9, 0, 0, 0) // 9h du matin

  const now = new Date()

  // Ne créer le rappel que s'il est dans le futur
  if (reminderDate > now && interview.status === "scheduled") {
    await remindersRepository.create(userId, {
      applicationId: interview.applicationId,
      interviewId: interview.id,
      type: "interview",
      title: `Entretien demain : ${interview.title}`,
      description: `Entretien prévu le ${interviewDate.toLocaleDateString("fr-FR")} à ${interviewDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      dueDate: reminderDate,
      isAutomatic: true,
    })
  }
}

