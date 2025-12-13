"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  MoreVertical,
  Edit,
  Download,
  Copy,
  Trash2,
  FileCode,
  FileBadge,
  Eye,
  History,
} from "lucide-react"
import type { Document, DocumentFormat } from "@/db/schema"

interface DocumentCardProps {
  document: Document
  onOpen?: (document: Document) => void
  onEdit?: (document: Document) => void
  onDelete?: (document: Document) => void
  onDownload?: (document: Document) => void
  onDuplicate?: (document: Document) => void
  onViewVersions?: (document: Document) => void
}

const formatIcons: Record<DocumentFormat, typeof FileText> = {
  markdown: FileCode,
  plain_text: FileText,
  html: FileBadge,
}

const formatLabels: Record<DocumentFormat, string> = {
  markdown: "Markdown",
  plain_text: "Texte",
  html: "HTML",
}

const typeLabels: Record<Document["type"], string> = {
  cv: "CV",
  cover_letter: "Lettre de motivation",
}

const typeColors: Record<Document["type"], string> = {
  cv: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  cover_letter: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
}

export function DocumentCard({
  document,
  onOpen,
  onEdit,
  onDelete,
  onDownload,
  onDuplicate,
  onViewVersions,
}: DocumentCardProps) {
  const FormatIcon = formatIcons[document.format] || FileText

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date))
  }

  const previewContent = document.content.substring(0, 150).replace(/[#*`\[\]]/g, "")

  return (
    <Card
      className="group hover:shadow-md transition-all duration-200 cursor-pointer border-2 hover:border-primary/50"
      onClick={() => onOpen?.(document)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2.5 rounded-lg ${typeColors[document.type]} group-hover:scale-110 transition-transform`}>
              <FormatIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                {document.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-xs font-normal">
                  {typeLabels[document.type]}
                </Badge>
                <Badge variant="outline" className="text-xs font-normal">
                  {formatLabels[document.format]}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen?.(document) }}>
                <Eye className="h-4 w-4 mr-2" />
                Ouvrir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(document) }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload?.(document) }}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.(document) }}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              {document.format === "markdown" && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewVersions?.(document) }}>
                  <History className="h-4 w-4 mr-2" />
                  Versions
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete?.(document) }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {previewContent}...
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Modifié le {formatDate(document.updatedAt)}</span>
          <span>{Math.ceil(document.content.length / 1000)}K</span>
        </div>
      </CardContent>
    </Card>
  )
}

