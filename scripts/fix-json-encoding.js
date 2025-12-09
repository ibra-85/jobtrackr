/**
 * Script pour corriger l'encodage d'un fichier JSON
 * Utilisation: node scripts/fix-json-encoding.js <input-file> <output-file>
 * 
 * Ce script tente de détecter et corriger l'encodage du fichier JSON
 * en essayant différents encodages (latin1, windows-1252, etc.)
 */

const fs = require('fs')
const path = require('path')

const inputFile = process.argv[2]
const outputFile = process.argv[3] || inputFile.replace('.json', '-fixed.json')

if (!inputFile) {
  console.error('Usage: node scripts/fix-json-encoding.js <input-file> [output-file]')
  process.exit(1)
}

if (!fs.existsSync(inputFile)) {
  console.error(`Fichier non trouvé: ${inputFile}`)
  process.exit(1)
}

console.log(`Lecture du fichier: ${inputFile}`)

// Essayer différents encodages
const encodings = ['latin1', 'windows-1252', 'iso-8859-1', 'cp1252']

let content = null
let usedEncoding = null

for (const encoding of encodings) {
  try {
    const buffer = fs.readFileSync(inputFile)
    content = buffer.toString(encoding)
    
    // Vérifier si le contenu semble correct (pas trop de caractères bizarres)
    // Le caractère de remplacement Unicode est \uFFFD
    const weirdCharCount = (content.match(/\uFFFD/g) || []).length
    const totalLength = content.length
    
    if (weirdCharCount / totalLength < 0.1) {
      // Moins de 10% de caractères bizarres, c'est probablement bon
      usedEncoding = encoding
      console.log(`Encodage détecté: ${encoding}`)
      break
    }
  } catch (error) {
    continue
  }
}

if (!content) {
  console.error('Impossible de lire le fichier avec les encodages testés')
  process.exit(1)
}

// Essayer de corriger les caractères mal encodés
// Remplacer les séquences communes de caractères mal encodés
const corrections = {
  'carrire': 'carrière',
}

// Parser le JSON pour vérifier qu'il est valide
let jsonData
try {
  jsonData = JSON.parse(content)
  console.log(`JSON valide! ${Array.isArray(jsonData) ? jsonData.length : 'Object'} entrées`)
} catch (error) {
  console.error('Erreur lors du parsing JSON:', error.message)
  process.exit(1)
}

// Corriger les caractères dans les données JSON
function fixEncoding(obj) {
  if (typeof obj === 'string') {
    let fixed = obj
    // Remplacer les caractères de remplacement Unicode (caractères mal encodés)
    fixed = fixed.replace(/\uFFFD/g, '')
    // Appliquer les corrections manuelles
    for (const [wrong, correct] of Object.entries(corrections)) {
      fixed = fixed.replace(new RegExp(wrong, 'g'), correct)
    }
    return fixed
  } else if (Array.isArray(obj)) {
    return obj.map(fixEncoding)
  } else if (obj && typeof obj === 'object') {
    const fixed = {}
    for (const [key, value] of Object.entries(obj)) {
      fixed[key] = fixEncoding(value)
    }
    return fixed
  }
  return obj
}

const fixedData = fixEncoding(jsonData)

// Écrire le fichier corrigé en UTF-8
const output = JSON.stringify(fixedData, null, 2)
fs.writeFileSync(outputFile, output, 'utf-8')

console.log(`Fichier corrigé écrit: ${outputFile}`)
console.log(`Encodage utilisé: ${usedEncoding || 'inconnu'}`)
console.log(`Taille: ${fs.statSync(outputFile).size} bytes`)

