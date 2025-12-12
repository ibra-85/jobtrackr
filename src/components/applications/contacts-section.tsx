"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, Plus, MoreVertical, Edit, Trash2, Mail, Linkedin, Phone } from "lucide-react"
import { toast } from "sonner"
import type { ApplicationContact } from "@/db/schema"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ContactsSectionProps {
  applicationId: string
}

export function ContactsSection({ applicationId }: ContactsSectionProps) {
  const [contacts, setContacts] = useState<ApplicationContact[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ApplicationContact | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    linkedinUrl: "",
    phone: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [applicationId])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/applications/${applicationId}/contacts`)
      if (response.ok) {
        const result = await response.json()
        setContacts(result.data || [])
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors du chargement des contacts")
      }
    } catch (error) {
      console.error("Erreur lors du chargement des contacts:", error)
      toast.error("Erreur lors du chargement des contacts")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (contact?: ApplicationContact) => {
    if (contact) {
      setEditingContact(contact)
      setFormData({
        name: contact.name,
        role: contact.role || "",
        email: contact.email || "",
        linkedinUrl: contact.linkedinUrl || "",
        phone: contact.phone || "",
        notes: contact.notes || "",
      })
    } else {
      setEditingContact(null)
      setFormData({
        name: "",
        role: "",
        email: "",
        linkedinUrl: "",
        phone: "",
        notes: "",
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du contact est requis")
      return
    }

    setSaving(true)
    try {
      if (editingContact) {
        // Mettre à jour
        const response = await fetch(
          `/api/applications/${applicationId}/contacts/${editingContact.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          },
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erreur lors de la mise à jour")
        }

        const updateResult = await response.json()
        toast.success("Contact modifié avec succès")
        setContacts((prev) =>
          prev.map((contact) => (contact.id === editingContact.id ? updateResult.data : contact))
        )
      } else {
        // Créer
        const response = await fetch(`/api/applications/${applicationId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erreur lors de la création")
        }

        const createResult = await response.json()
        toast.success("Contact ajouté avec succès")
        setContacts((prev) => [createResult.data, ...prev])
      }

      setDialogOpen(false)
      setEditingContact(null)
    } catch (error) {
      console.error("Erreur:", error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Une erreur est survenue")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (contactId: string) => {
    setContactToDelete(contactId)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!contactToDelete) return

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/contacts/${contactToDelete}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      toast.success("Contact supprimé avec succès")
      setContacts((prev) => prev.filter((contact) => contact.id !== contactToDelete))
      fetchContacts()
    } catch (error) {
      console.error("Erreur:", error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Une erreur est survenue")
      }
    } finally {
      setContactToDelete(null)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contacts
          </CardTitle>
          <CardDescription>
            Contacts RH, recruteurs ou managers associés à cette candidature
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <p className="mb-4">Aucun contact pour cette candidature.</p>
              <Button
                variant="outline"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un contact
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">{contact.name}</div>
                      {contact.role && (
                        <div className="text-sm text-muted-foreground mb-2">{contact.role}</div>
                      )}
                      <div className="space-y-1">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-sm text-primary hover:underline flex items-center gap-2"
                          >
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </a>
                        )}
                        {contact.linkedinUrl && (
                          <a
                            href={contact.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-2"
                          >
                            <Linkedin className="h-3 w-3" />
                            LinkedIn
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-sm text-primary hover:underline flex items-center gap-2"
                          >
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </a>
                        )}
                      </div>
                      {contact.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {contact.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(contact)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(contact.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ajouté le {formatDate(contact.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Modifier le contact" : "Nouveau contact"}
            </DialogTitle>
            <DialogDescription>
              {editingContact
                ? "Modifie les informations du contact."
                : "Ajoute un contact associé à cette candidature."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Ex: RH, Recruteur tech, Manager"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/jean-dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes sur le contact</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Feedback, affinité, points importants..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? "Enregistrement..." : editingContact ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Supprimer le contact"
        description="Es-tu sûr de vouloir supprimer ce contact ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  )
}

