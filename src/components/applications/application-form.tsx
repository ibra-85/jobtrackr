"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type {
  Application,
  ApplicationStatus,
  Company,
  ContractType,
  ApplicationSource,
} from "@/db/schema"
import { Search, Check, ChevronsUpDown, Building2, Plus, Star } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { APPLICATION_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS } from "@/lib/constants/labels"
import { DatePicker } from "@/components/ui/date-picker"
import MultipleSelector, { Option } from "@/components/ui/multiselect"

interface ApplicationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  application?: Application & { company?: Company }
  onSuccess: () => void
}

// Suggestions de postes communs pour l'autocomplete
// Liste exhaustive basée sur des postes réels du marché français
const jobTitleSuggestions = [
  // Développement & IT
  "Développeur Full Stack",
  "Développeur Frontend",
  "Développeur Backend",
  "Développeur React",
  "Développeur Next.js",
  "Développeur TypeScript",
  "Développeur Node.js",
  "Développeur Python",
  "Développeur Java",
  "Développeur C#",
  "Développeur PHP",
  "Développeur Ruby",
  "Développeur Go",
  "Développeur Rust",
  "Développeur Mobile iOS",
  "Développeur Mobile Android",
  "Développeur Flutter",
  "Développeur React Native",
  "Ingénieur Logiciel",
  "Ingénieur Développement",
  "Architecte Logiciel",
  "Architecte Solutions",
  "Architecte Cloud",
  "Chef de Projet Technique",
  "Tech Lead",
  "Lead Developer",
  "Senior Developer",
  "Développeur Junior",
  "Développeur Confirmé",
  
  // DevOps & Infrastructure
  "DevOps Engineer",
  "Ingénieur DevOps",
  "SRE (Site Reliability Engineer)",
  "Ingénieur Cloud",
  "Ingénieur Infrastructure",
  "Administrateur Système",
  "Ingénieur Réseau",
  "Ingénieur Sécurité",
  "Cybersecurity Engineer",
  "Ingénieur Sécurité Informatique",
  
  // Data & Analytics
  "Data Engineer",
  "Data Scientist",
  "Data Analyst",
  "Analyste de Données",
  "Ingénieur Machine Learning",
  "ML Engineer",
  "Data Architect",
  "Business Intelligence Analyst",
  "BI Developer",
  "Statisticien",
  
  // Product & Management
  "Product Manager",
  "Product Owner",
  "Chef de Produit",
  "Product Designer",
  "Scrum Master",
  "Agile Coach",
  "Chef de Projet",
  "Project Manager",
  "Program Manager",
  "Delivery Manager",
  "Engineering Manager",
  "CTO (Chief Technology Officer)",
  "VP Engineering",
  
  // Design
  "UX/UI Designer",
  "UX Designer",
  "UI Designer",
  "Designer Graphique",
  "Designer Web",
  "Designer Produit",
  "Designer d'Interface",
  "Motion Designer",
  "Designer 3D",
  "Designer UX/UI Senior",
  
  // Marketing & Communication
  "Marketing Manager",
  "Chef de Projet Marketing",
  "Digital Marketing Manager",
  "Marketing Digital",
  "Community Manager",
  "Social Media Manager",
  "Content Manager",
  "Content Marketing Manager",
  "SEO Manager",
  "SEM Manager",
  "Growth Hacker",
  "Marketing Analyst",
  "Brand Manager",
  "Product Marketing Manager",
  
  // Sales & Business
  "Business Analyst",
  "Analyste Fonctionnel",
  "Consultant IT",
  "Consultant Technique",
  "Sales Engineer",
  "Ingénieur Commercial",
  "Business Developer",
  "Account Manager",
  "Key Account Manager",
  "Sales Manager",
  "Business Development Manager",
  
  // QA & Testing
  "QA Engineer",
  "Testeur Logiciel",
  "Ingénieur QA",
  "Test Automation Engineer",
  "QA Lead",
  "Test Manager",
  
  // Support & Customer Success
  "Customer Success Manager",
  "Support Technique",
  "Technical Support Engineer",
  "Customer Support",
  "Help Desk",
  
  // Autres IT
  "Database Administrator",
  "DBA",
  "Ingénieur Base de Données",
  "ERP Consultant",
  "SAP Consultant",
  "Salesforce Consultant",
  "Solution Architect",
  "System Administrator",
  "Network Engineer",
  "IT Consultant",
  "Freelance Developer",
  "Développeur Freelance",
]

export function ApplicationForm({
  open,
  onOpenChange,
  application,
  onSuccess,
}: ApplicationFormProps) {
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState<ApplicationStatus>("pending")
  const [priority, setPriority] = useState(false)
  const [companyId, setCompanyId] = useState<string>("none")
  const [companySearch, setCompanySearch] = useState("")
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const [titleOpen, setTitleOpen] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState("")
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [jobTitlesFromAPI, setJobTitlesFromAPI] = useState<string[]>([])
  const [loadingJobTitles, setLoadingJobTitles] = useState(false)
  // Nouveaux champs
  const [notes, setNotes] = useState("")
  const [appliedAt, setAppliedAt] = useState<Date | undefined>(undefined)
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [contractType, setContractType] = useState<ContractType | "">("") // Ancien champ pour compatibilité
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]) // Nouveau champ multi-select
  const [location, setLocation] = useState("")
  const [salaryRange, setSalaryRange] = useState("")
  const [source, setSource] = useState<ApplicationSource | "">("")
  const [jobUrl, setJobUrl] = useState("")

  const isEditing = !!application

  // Charger les suggestions de postes depuis l'API (recherche dynamique)
  const loadJobTitles = useCallback(async (searchQuery?: string) => {
    setLoadingJobTitles(true)
    try {
      const queryParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
      const response = await fetch(`/api/job-titles?limit=100${queryParam}`)
      if (response.ok) {
        const data = await response.json()
        // Extraire les libellés des postes
        const titles = data.map((item: { label: string }) => item.label)
        setJobTitlesFromAPI(titles)
      } else {
        // En cas d'erreur, utiliser la liste statique
        console.warn("Impossible de charger les postes depuis l'API, utilisation de la liste statique")
        setJobTitlesFromAPI([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des postes:", error)
      // En cas d'erreur, utiliser la liste statique
      setJobTitlesFromAPI([])
    } finally {
      setLoadingJobTitles(false)
    }
  }, [])

  // Charger les entreprises lors de l'ouverture du formulaire
  useEffect(() => {
    if (open) {
      loadCompanies()
      // Charger les premiers postes (sans recherche)
      loadJobTitles()
    }
  }, [open, loadJobTitles])

  // Recherche dynamique des postes quand l'utilisateur tape
  useEffect(() => {
    if (title.trim().length >= 1) {
      // Debounce pour éviter trop de requêtes (réduit à 200ms pour plus de réactivité)
      const timeout = setTimeout(() => {
        loadJobTitles(title.trim())
      }, 200)

      return () => clearTimeout(timeout)
    } else if (title.trim().length === 0) {
      // Recharger les premiers résultats si le champ est vide
      loadJobTitles()
    }
  }, [title, loadJobTitles])

  // Initialiser les valeurs du formulaire
  useEffect(() => {
    if (application) {
      setTitle(application.title)
      setStatus(application.status)
      setPriority(application.priority || false)
      setCompanyId(application.companyId || "none")
      if (application.company) {
        setCompanySearch(application.company.name)
      } else {
        setCompanySearch("")
      }
      setNotes(application.notes || "")
      setAppliedAt(application.appliedAt ? new Date(application.appliedAt) : undefined)
      setDeadline(application.deadline ? new Date(application.deadline) : undefined)
      setContractType(application.contractType || "") // Ancien champ
      setContractTypes(application.contractTypes || []) // Nouveau champ
      setLocation(application.location || "")
      setSalaryRange(application.salaryRange || "")
      setSource(application.source || "")
      setJobUrl(application.jobUrl || "")
    } else {
      setTitle("")
      setStatus("pending")
      setPriority(false)
      setCompanyId("none")
      setCompanySearch("")
      setNotes("")
      setAppliedAt("")
      setDeadline("")
      setContractType("") // Ancien champ
      setContractTypes([]) // Nouveau champ
      setLocation("")
      setSalaryRange("")
      setSource("")
      setJobUrl("")
    }
    setNewCompanyName("")
  }, [application, open])

  // Utiliser directement les résultats de l'API (déjà filtrés et triés)
  // Si l'API n'a pas encore chargé, utiliser la liste statique avec filtrage simple
  const filteredJobTitles = useMemo(() => {
    // Si on a des résultats de l'API, les utiliser directement (déjà filtrés par l'API)
    if (jobTitlesFromAPI.length > 0) {
      return jobTitlesFromAPI
    }
    
    // Sinon, utiliser la liste statique avec un filtrage simple
    if (!title.trim()) {
      return jobTitleSuggestions.slice(0, 20)
    }
    
    const lowerTitle = title.toLowerCase()
    return jobTitleSuggestions
      .filter((job) => {
        // Normaliser pour la recherche (enlever / et accents)
        const normalized = job
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[\/\-\s]+/g, " ")
        const normalizedQuery = lowerTitle
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[\/\-\s]+/g, " ")
        return normalized.includes(normalizedQuery)
      })
      .slice(0, 50)
  }, [title, jobTitlesFromAPI])

  // Filtrer les entreprises basées sur la recherche
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies
    const lowerSearch = companySearch.toLowerCase()
    return companies.filter((company) =>
      company.name.toLowerCase().includes(lowerSearch)
    )
  }, [companySearch, companies])

  const loadCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const result = await response.json()
        setCompanies(result.data || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des entreprises:", error)
    }
  }

  const searchCompanies = async (query: string) => {
    if (!query.trim()) {
      loadCompanies()
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const result = await response.json()
        setCompanies(result.data || [])
      }
    } catch (error) {
      console.error("Erreur lors de la recherche d'entreprises:", error)
    } finally {
      setSearching(false)
    }
  }

  // Debounce pour la recherche d'entreprises
  useEffect(() => {
    // Ne pas rechercher si le popover n'est pas ouvert
    if (!companyOpen) {
      return
    }

    // Nettoyer le timeout précédent
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Créer un nouveau timeout
    const timeout = setTimeout(() => {
      if (companySearch.trim()) {
        searchCompanies(companySearch)
      } else {
        loadCompanies()
      }
    }, 300) // Attendre 300ms après la dernière frappe

    setSearchTimeout(timeout)

    // Nettoyer le timeout au démontage
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [companySearch, companyOpen])

  const createCompany = async (name: string) => {
    if (!name.trim()) {
      toast.error("Le nom de l'entreprise est requis")
      return
    }

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la création")
      }

      const result = await response.json()
      const newCompany = result.data
      setCompanies((prev) => {
        const updated = [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name))
        return updated
      })
      setCompanyId(newCompany.id)
      setCompanySearch(newCompany.name)
      setNewCompanyName("")
      setCompanyOpen(false)
      toast.success(`Entreprise "${newCompany.name}" créée avec succès`)
    } catch (error) {
      console.error("Erreur lors de la création de l'entreprise:", error)
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
      )
    }
  }

  const handleCompanySelect = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    if (company) {
      setCompanyId(companyId)
      setCompanySearch(company.name)
      setCompanyOpen(false)
    }
  }

  const selectedCompany = companies.find((c) => c.id === companyId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/applications/${application.id}` : "/api/applications"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          status,
          priority,
          companyId: companyId && companyId !== "none" ? companyId : undefined,
          notes: notes.trim() || undefined,
          appliedAt: appliedAt ? appliedAt.toISOString() : undefined,
          deadline: deadline ? deadline.toISOString() : undefined,
          contractType: contractType || undefined, // Ancien champ pour compatibilité
          contractTypes: contractTypes.length > 0 ? contractTypes : undefined, // Nouveau champ
          location: location.trim() || undefined,
          salaryRange: salaryRange.trim() || undefined,
          source: source || undefined,
          jobUrl: jobUrl.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Une erreur est survenue")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl">
            {isEditing ? "Modifier la candidature" : "Nouvelle candidature"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEditing
              ? "Modifie les informations de ta candidature."
              : "Ajoute une nouvelle candidature à suivre."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-5 py-4 px-2 overflow-y-auto flex-1 pr-2 scrollbar-thin">
            <div className="space-y-2 relative">
              <Label htmlFor="title" className="text-sm font-semibold">
                Titre du poste *
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    const value = e.target.value
                    setTitle(value)
                    if (value.trim() && filteredJobTitles.length > 0) {
                      setTitleOpen(true)
                    } else {
                      setTitleOpen(false)
                    }
                  }}
                  onFocus={() => {
                    if (title.trim() && filteredJobTitles.length > 0) {
                      setTitleOpen(true)
                    }
                  }}
                  onBlur={(e) => {
                    // Ne pas fermer si on clique sur une suggestion
                    const relatedTarget = e.relatedTarget as HTMLElement
                    if (!relatedTarget?.closest('[role="option"]')) {
                      setTimeout(() => setTitleOpen(false), 200)
                    }
                  }}
                  placeholder="Ex: Développeur Full Stack"
                  required
                  disabled={loading}
                  className="h-9 pr-8"
                  autoComplete="off"
                />
                <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {titleOpen && filteredJobTitles.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  <Command shouldFilter={false}>
                    <CommandList>
                      <CommandGroup>
                        {filteredJobTitles.slice(0, 8).map((jobTitle) => (
                          <CommandItem
                            key={jobTitle}
                            value={jobTitle}
                            onSelect={() => {
                              setTitle(jobTitle)
                              setTitleOpen(false)
                            }}
                            className="cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setTitle(jobTitle)
                              setTitleOpen(false)
                            }}
                          >
                            {jobTitle}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-semibold">
                Entreprise
              </Label>
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyOpen}
                    className="w-full justify-between h-9 font-normal"
                    type="button"
                    disabled={loading}
                  >
                    {selectedCompany ? (
                      <span className="truncate flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0" />
                        {selectedCompany.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Rechercher ou créer une entreprise...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Rechercher une entreprise..."
                      value={companySearch}
                      onValueChange={(value) => {
                        setCompanySearch(value)
                        setNewCompanyName(value)
                        // Le debounce est géré par useEffect
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {companySearch.trim() ? (
                          <div className="py-4 px-2">
                            <p className="text-sm text-muted-foreground mb-3 text-center">
                              Aucune entreprise trouvée pour "{companySearch}"
                            </p>
                            <Button
                              size="sm"
                              onClick={() => createCompany(companySearch)}
                              className="w-full"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Créer "{companySearch}"
                            </Button>
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              Commencez à taper pour rechercher ou créer une entreprise
                            </p>
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredCompanies.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => handleCompanySelect(company.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                companyId === company.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">{company.name}</div>
                              {company.website && (
                                <div className="text-xs text-muted-foreground">
                                  {company.website}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                        {companySearch.trim() && 
                         filteredCompanies.length > 0 && 
                         !filteredCompanies.some(c => c.name.toLowerCase() === companySearch.toLowerCase()) && (
                          <CommandItem
                            onSelect={() => createCompany(companySearch)}
                            className="cursor-pointer text-primary font-medium"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Créer "{companySearch}"
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedCompany && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCompanyId("none")
                    setCompanySearch("")
                  }}
                  className="h-7 text-xs"
                >
                  Retirer l'entreprise
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-semibold">
                  Statut
                </Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)} disabled={loading}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-semibold">
                  Priorité
                </Label>
                <div className="flex items-center space-x-2 h-9">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={priority}
                      onCheckedChange={(checked) => setPriority(checked === true)}
                      disabled={loading}
                      id="priority"
                    />
                    <span className="text-sm flex items-center gap-1.5">
                      <Star className={`h-4 w-4 ${priority ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                      Prioritaire
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Nouveaux champs supplémentaires */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Date de candidature
                </Label>
                <DatePicker
                  value={appliedAt}
                  onChange={setAppliedAt}
                  placeholder="Sélectionner une date"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Date limite
                </Label>
                <DatePicker
                  value={deadline}
                  onChange={setDeadline}
                  placeholder="Sélectionner une date"
                  disabled={loading}
                  min={appliedAt}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractTypes" className="text-sm font-semibold">
                  Types de contrat
                </Label>
                <MultipleSelector
                  options={CONTRACT_TYPE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                  value={contractTypes.map(ct => ({ value: ct, label: CONTRACT_TYPE_OPTIONS.find(o => o.value === ct)?.label || ct }))}
                  onChange={(options) => setContractTypes(options.map(o => o.value as ContractType))}
                  placeholder="Sélectionner un ou plusieurs types..."
                  disabled={loading}
                  maxDisplayed={3}
                  hideClearAllButton
                  hidePlaceholderWhenSelected
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source" className="text-sm font-semibold">
                  Source
                </Label>
                <Select
                  value={source}
                  onValueChange={(v) => setSource(v as ApplicationSource)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="indeed">Indeed</SelectItem>
                    <SelectItem value="welcome_to_the_jungle">Welcome to the Jungle</SelectItem>
                    <SelectItem value="site_carriere">Site carrière</SelectItem>
                    <SelectItem value="cooptation">Cooptation</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold">
                Localisation
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="Ex: Paris, Remote, Hybride..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryRange" className="text-sm font-semibold">
                Fourchette salariale
              </Label>
              <Input
                id="salaryRange"
                type="text"
                placeholder="Ex: 45k-60k€, 300-400€/jour..."
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                disabled={loading}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobUrl" className="text-sm font-semibold">
                Lien vers l'offre
              </Label>
              <Input
                id="jobUrl"
                type="url"
                placeholder="https://..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                disabled={loading}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold">
                Notes personnelles
              </Label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Notes sur l'entreprise, le poste, le ressenti, feedback d'entretien..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 flex-shrink-0 border-t pt-4 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              size="sm"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              size="sm"
            >
              {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

