"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { Company, CompanySize, CompanyType, WorkMode } from "@/db/schema"
import {
  COMPANY_SIZE_LABELS,
  COMPANY_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/constants/labels"

interface CompanyEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company | null
  onSuccess?: () => void
}

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
  { value: "1-10", label: COMPANY_SIZE_LABELS["1-10"] },
  { value: "11-50", label: COMPANY_SIZE_LABELS["11-50"] },
  { value: "51-200", label: COMPANY_SIZE_LABELS["51-200"] },
  { value: "201-500", label: COMPANY_SIZE_LABELS["201-500"] },
  { value: "501-1000", label: COMPANY_SIZE_LABELS["501-1000"] },
  { value: "1000+", label: COMPANY_SIZE_LABELS["1000+"] },
]

const COMPANY_TYPE_OPTIONS: { value: CompanyType; label: string }[] = [
  { value: "startup", label: COMPANY_TYPE_LABELS.startup },
  { value: "pme", label: COMPANY_TYPE_LABELS.pme },
  { value: "scale_up", label: COMPANY_TYPE_LABELS.scale_up },
  { value: "grand_groupe", label: COMPANY_TYPE_LABELS.grand_groupe },
  { value: "autre", label: COMPANY_TYPE_LABELS.autre },
]

const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = [
  { value: "remote", label: WORK_MODE_LABELS.remote },
  { value: "hybrid", label: WORK_MODE_LABELS.hybrid },
  { value: "on_site", label: WORK_MODE_LABELS.on_site },
]

export function CompanyEditDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyEditDialogProps) {
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")
  const [sector, setSector] = useState("")
  const [size, setSize] = useState<CompanySize | "">("")
  const [type, setType] = useState<CompanyType | "">("")
  const [location, setLocation] = useState("")
  const [workMode, setWorkMode] = useState<WorkMode | "">("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && company) {
      setName(company.name || "")
      setWebsite(company.website || "")
      setSector(company.sector || "")
      setSize(company.size || "")
      setType(company.type || "")
      setLocation(company.location || "")
      setWorkMode(company.workMode || "")
    }
  }, [open, company])

  const handleSubmit = async () => {
    if (!company) return

    if (!name.trim()) {
      toast.error("Le nom de l'entreprise est requis")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website: website.trim() || undefined,
          sector: sector.trim() || undefined,
          size: size || undefined,
          type: type || undefined,
          location: location.trim() || undefined,
          workMode: workMode || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      toast.success("Entreprise modifiée avec succès")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  if (!company) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'entreprise</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de l'entreprise "{company.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de l'entreprise <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Google, Microsoft, etc."
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Secteur / Industrie</Label>
              <Input
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ex: Technologie, Finance, etc."
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Paris, France"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Taille</Label>
              <Select value={size} onValueChange={(value) => setSize(value as CompanySize)}>
                <SelectTrigger id="size" disabled={saving}>
                  <SelectValue placeholder="Sélectionner une taille" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {COMPANY_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as CompanyType)}>
                <SelectTrigger id="type" disabled={saving}>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {COMPANY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workMode">Mode de travail</Label>
            <Select value={workMode} onValueChange={(value) => setWorkMode(value as WorkMode)}>
              <SelectTrigger id="workMode" disabled={saving}>
                <SelectValue placeholder="Sélectionner un mode de travail" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {WORK_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving ? "Enregistrement..." : "Modifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

