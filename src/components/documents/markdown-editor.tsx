"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Link2, 
  Code,
  Eye,
  Edit3
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Écris ton contenu en Markdown...",
  disabled = false,
  className = "",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.getElementById("markdown-textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end) || "texte"
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), label: "Gras" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), label: "Italique" },
    { icon: Heading1, action: () => insertMarkdown("# ", ""), label: "Titre 1" },
    { icon: Heading2, action: () => insertMarkdown("## ", ""), label: "Titre 2" },
    { icon: List, action: () => insertMarkdown("- ", ""), label: "Liste à puces" },
    { icon: ListOrdered, action: () => insertMarkdown("1. ", ""), label: "Liste numérotée" },
    { icon: Link2, action: () => insertMarkdown("[", "](url)"), label: "Lien" },
    { icon: Code, action: () => insertMarkdown("`", "`"), label: "Code inline" },
  ]

  return (
    <div className={`space-y-2 ${className}`}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <div className="flex items-center justify-between border-b">
          <TabsList className="h-auto p-1">
            <TabsTrigger value="edit" className="gap-2">
              <Edit3 className="h-4 w-4" />
              Éditer
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Prévisualiser
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="space-y-2 mt-0">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
            {toolbarButtons.map((btn, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={btn.action}
                disabled={disabled}
                title={btn.label}
              >
                <btn.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {/* Editor */}
          <Textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[500px] font-mono text-sm resize-y"
          />

          {/* Help text */}
          <div className="text-xs text-muted-foreground px-2">
            <p>
              <strong>Markdown supporté :</strong> **gras**, *italique*, # Titres, [liens](url), listes, etc.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card className="min-h-[500px] p-6 overflow-y-auto">
            {value ? (
              <article className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Aucun contenu à prévisualiser
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Character count */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>{value.length} caractères</span>
        <span>{value.split(/\s+/).filter(Boolean).length} mots</span>
      </div>
    </div>
  )
}

