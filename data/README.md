# Dossier Data

Ce dossier contient les fichiers de données statiques de l'application.

## job-titles.json

Fichier JSON contenant la liste des postes/métiers pour l'autocomplétion.

### Format attendu

```json
[
  {
    "code_ogr": 10200,
    "libelle": "Abatteur / Abatteuse de carrière",
    "libelle_court": "Abatteur / Abatteuse de carrière",
    "transition_eco": "Emploi Brun",
    "transition_num": null,
    "transition_demo": null,
    "emploi_reglemente": null,
    "emploi_cadre": null,
    "classification": "SYNONYME",
    "origine": "",
    "code_rome_parent": "F1402",
    "peu_usite": "N"
  }
]
```

### Correction de l'encodage

Si votre fichier JSON contient des caractères `` à la place des accents :

1. Placez votre fichier JSON dans ce dossier avec le nom `job-titles.json`
2. Exécutez le script de correction :
   ```bash
   node scripts/fix-json-encoding.js data/job-titles.json data/job-titles-fixed.json
   ```
3. Vérifiez le fichier `job-titles-fixed.json`
4. Si c'est correct, remplacez `job-titles.json` par le fichier corrigé

### Alternative : Correction manuelle

Si le script ne fonctionne pas, vous pouvez :

1. Ouvrir le fichier dans un éditeur de texte (VS Code, Notepad++, etc.)
2. Détecter l'encodage actuel (généralement Windows-1252 ou ISO-8859-1)
3. Convertir en UTF-8
4. Sauvegarder

### Vérification

Pour vérifier que le fichier est correctement encodé :

```bash
# Vérifier l'encodage
file -i data/job-titles.json

# Devrait afficher: charset=utf-8
```

