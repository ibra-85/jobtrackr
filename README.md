# JobTrackr

Application SaaS pour gérer vos candidatures, générer des CV/lettres optimisés avec l'IA, et suivre vos actions dans votre recherche d'emploi.

## 🚀 Getting Started

### Prérequis

- Node.js 20+ 
- npm, yarn, pnpm ou bun
- Un compte [Neon](https://neon.tech) (gratuit)

### Installation

1. Clone le repository :
```bash
git clone <url-du-repo>
cd jobtrackr
```

2. Installe les dépendances :
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Configure les variables d'environnement :
```bash
cp .env.example .env.local
```

4. Remplis `.env.local` avec tes informations :
   - **DATABASE_URL** : Récupère l'URL de connexion depuis ton dashboard Neon
   - **BETTER_AUTH_URL** et **NEXT_PUBLIC_BETTER_AUTH_URL** : URL de base de l'application (http://localhost:3000 en dev)
   - **BETTER_AUTH_SECRET** : Génère une clé secrète avec `openssl rand -base64 32`

5. Crée les tables dans Neon :
```bash
# Génère les migrations Drizzle
npm run db:generate

# Applique les migrations à la base de données
npm run db:push
```

6. Lance le serveur de développement :
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

7. Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur

### 📚 Configuration Neon

**Résumé rapide** :
1. Crée un projet sur [neon.tech](https://neon.tech)
2. Récupère l'URL de connexion PostgreSQL depuis le dashboard
3. Ajoute-la dans `.env.local` comme `DATABASE_URL`
4. Exécute les migrations avec `npm run db:push`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

