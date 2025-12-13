import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { documentsRepository } from "@/db/repositories/documents.repository"

/**
 * GET /api/documents/[id]/export
 * Exporte un document en PDF ou autre format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "pdf"

    const document = await documentsRepository.getById(id, session.user.id)
    if (!document) {
      throw new NotFoundError("Document")
    }

    // Pour le moment, on génère un simple fichier texte
    // TODO: Implémenter la vraie génération PDF avec puppeteer ou pdfkit
    if (format === "pdf") {
      // Générer du HTML stylisé
      const html = generateHTMLFromDocument(document)
      
      // Pour l'instant, retourner du HTML
      // Dans une vraie implémentation, utiliser puppeteer pour générer un PDF
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="${document.title}.html"`,
        },
      })
    } else if (format === "markdown" && document.format === "markdown") {
      return new NextResponse(document.content, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${document.title}.md"`,
        },
      })
    } else {
      return new NextResponse(document.content, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="${document.title}.txt"`,
        },
      })
    }
  } catch (error) {
    return handleApiError(error)
  }
}

function generateHTMLFromDocument(document: any) {
  const isMarkdown = document.format === "markdown"
  
  // Convertir markdown en HTML basique si nécessaire
  let contentHTML = document.content
  if (isMarkdown) {
    // Conversion markdown simple (pour une vraie implémentation, utiliser marked ou remark)
    contentHTML = document.content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
  }

  const type = document.type === "cv" ? "Curriculum Vitae" : "Lettre de motivation"

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }
    
    header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    
    header h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    header p {
      color: #6b7280;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    main {
      white-space: pre-wrap;
      font-size: 12px;
      line-height: 1.8;
    }
    
    h1, h2, h3 {
      color: #1e40af;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    h1 { font-size: 24px; }
    h2 { font-size: 20px; }
    h3 { font-size: 16px; }
    
    p {
      margin-bottom: 10px;
    }
    
    ul, ol {
      margin-left: 20px;
      margin-bottom: 10px;
    }
    
    li {
      margin-bottom: 5px;
    }
    
    strong {
      font-weight: 600;
      color: #1f2937;
    }
    
    footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      @page {
        margin: 20mm;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>${document.title}</h1>
    <p>${type}</p>
  </header>
  
  <main>
    ${contentHTML}
  </main>
  
  <footer>
    <p>Document généré par JobTrackr le ${new Date().toLocaleDateString('fr-FR')}</p>
  </footer>
</body>
</html>`
}

