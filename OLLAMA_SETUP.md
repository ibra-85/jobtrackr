# Configuration Ollama pour JobTrackr

Ce guide explique comment configurer Ollama en local pour utiliser l'IA dans le parser d'offres d'emploi.

## Installation d'Ollama

1. **Télécharger Ollama** : https://ollama.com/download
2. **Installer** selon votre système d'exploitation
3. **Vérifier l'installation** :
   ```bash
   ollama --version
   ```

## Télécharger un modèle

Ollama nécessite un modèle de langage. Voici quelques modèles recommandés (du plus léger au plus performant) :

### Modèles légers (recommandés pour le dev)
```bash
# Llama 3.2 (3B) - Très rapide, bon pour le dev
ollama pull llama3.2

# Phi-3 (3.8B) - Rapide et efficace
ollama pull phi3

# Qwen2.5 (1.5B) - Très léger
ollama pull qwen2.5:1.5b
```

### Modèles plus performants (si vous avez plus de RAM)
```bash
# Mistral (7B) - Bon équilibre performance/rapidité
ollama pull mistral

# Llama 3.1 (8B) - Plus performant
ollama pull llama3.1:8b

# Qwen2.5 (7B) - Très performant
ollama pull qwen2.5:7b
```

## Démarrer Ollama

Ollama doit être démarré pour que l'application puisse l'utiliser :

```bash
# Démarrer Ollama (démarre automatiquement un serveur sur http://localhost:11434)
ollama serve
```

**Note** : Sur Windows et macOS, Ollama démarre généralement automatiquement en arrière-plan après l'installation.

## Configuration dans JobTrackr

1. **Créer ou modifier `.env.local`** :
   ```env
   # Modèle Ollama à utiliser (par défaut: llama3.2)
   OLLAMA_MODEL=llama3.2
   ```

2. **Vérifier que Ollama est accessible** :
   - Ouvrir http://localhost:11434 dans votre navigateur
   - Vous devriez voir une page avec des informations sur Ollama

## Utilisation dans l'application

1. **Ouvrir le dialog d'import d'offre** depuis le formulaire de candidature
2. **Coller le texte d'une offre d'emploi**
3. **Cliquer sur "Analyser avec IA"** (bouton avec icône cerveau)
4. L'IA va extraire automatiquement :
   - Titre du poste
   - Nom de l'entreprise
   - Localisation
   - Type de contrat
   - Fourchette salariale
   - URL de l'offre
   - Source (LinkedIn, Indeed, etc.)
   - Description

## Fallback automatique

Si Ollama n'est pas disponible ou si une erreur survient, l'application bascule automatiquement vers le parsing classique (regex). Vous pouvez toujours utiliser le bouton "Analyser (classique)" manuellement.

## Dépannage

### Ollama n'est pas accessible
- Vérifier que Ollama est démarré : `ollama list` (doit afficher vos modèles)
- Vérifier l'URL : http://localhost:11434
- Vérifier les logs dans la console du navigateur

### Le modèle n'existe pas
- Vérifier que le modèle est téléchargé : `ollama list`
- Télécharger le modèle : `ollama pull <nom-du-modèle>`
- Vérifier la variable `OLLAMA_MODEL` dans `.env.local`

### Erreur de parsing
- Vérifier que le texte de l'offre est suffisamment long (minimum 50 caractères)
- Essayer avec le parsing classique en fallback
- Vérifier les logs serveur pour plus de détails

## Ressources

- [Documentation Ollama](https://ollama.com/docs)
- [Bibliothèque de modèles](https://ollama.com/library)
- [AI SDK Vercel](https://sdk.vercel.ai/docs)

