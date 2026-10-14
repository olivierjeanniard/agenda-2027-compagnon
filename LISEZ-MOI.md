# Agenda 2027 — Compagnon numérique
Guide de mise en ligne, étape par étape, sans compétence technique requise.

## Ce que contient ce dossier
- `public/index.html` — la page que verront tes lecteurs après avoir scanné le QR code.
- `api/extract.js` — le programme qui appelle l'IA de façon sécurisée (ta clé n'est jamais visible par les utilisateurs).
- `package.json` — fichier de configuration technique, à ne pas modifier.

## Étape 1 — Créer une clé API Anthropic (5 minutes)
1. Va sur **console.anthropic.com** et crée un compte (ou connecte-toi).
2. Dans le menu, va dans **"API Keys"** puis **"Create Key"**.
3. Copie la clé générée (elle commence par `sk-ant-...`) — tu en auras besoin à l'étape 3. Garde-la secrète, ne la partage jamais publiquement.
4. Dans **"Billing"**, ajoute un moyen de paiement et crédite un petit montant pour démarrer (5 à 10 $ suffisent largement pour tester avec plusieurs centaines de scans).

## Étape 2 — Créer un compte Vercel (gratuit)
1. Va sur **vercel.com** et inscris-toi (tu peux utiliser ton compte GitHub, Google, ou un email).
2. C'est gratuit pour ce niveau d'usage — pas de carte bancaire nécessaire pour démarrer.

## Étape 3 — Déployer le site
Deux options, choisis celle qui te convient :

### Option A — La plus simple (glisser-déposer)
1. Sur le tableau de bord Vercel, clique sur **"Add New" → "Project"**.
2. Choisis **"Deploy from a template"** ou l'option d'import direct de dossier si elle est proposée, sinon utilise l'Option B ci-dessous (Vercel demande en général un dépôt GitHub).

### Option B — Via GitHub (recommandée, un peu plus fiable)
1. Crée un compte gratuit sur **github.com** si tu n'en as pas.
2. Crée un nouveau dépôt (bouton **"New repository"**), nomme-le par exemple `agenda-2027-compagnon`.
3. Mets tous les fichiers de ce dossier dedans (GitHub propose un glisser-déposer direct dans le navigateur, pas besoin de ligne de commande : ouvre le dépôt, clique **"Add file" → "Upload files"**, puis dépose tout le contenu de ce dossier en conservant la structure `api/` et `public/`).
4. Retourne sur Vercel → **"Add New" → "Project"** → connecte ton compte GitHub → sélectionne le dépôt `agenda-2027-compagnon` → clique **"Import"**.

## Étape 4 — Ajouter ta clé API en secret
1. Toujours dans Vercel, avant ou après le premier déploiement, va dans **Project Settings → Environment Variables**.
2. Ajoute une variable :
   - Nom : `ANTHROPIC_API_KEY`
   - Valeur : ta clé copiée à l'étape 1
3. Clique **"Save"**, puis relance un déploiement si nécessaire (bouton **"Redeploy"**).

## Étape 5 — Récupérer ton adresse et faire le QR code
1. Une fois déployé, Vercel te donne une adresse du type `agenda-2027-compagnon.vercel.app`.
2. Tu peux la garder telle quelle, ou connecter un nom de domaine personnel (ex. `agenda2027.fr`) dans **Project Settings → Domains** si tu en achètes un (OVH, Namecheap, ~10€/an).
3. Donne-moi l'adresse finale : je génère le QR code exact et je le réintègre dans le PDF intérieur, à la dernière page.

## Coûts à prévoir
- **Vercel** : gratuit dans le cadre de cet usage (hobby plan).
- **API Anthropic** : facturé à l'usage, de l'ordre de quelques centimes pour des dizaines de scans. Sur console.anthropic.com, tu peux fixer un plafond de dépense mensuel pour être serein.
- **Nom de domaine (optionnel)** : ~10€/an si tu veux une adresse personnalisée plutôt que `.vercel.app`.

## Une fois en ligne
Teste depuis ton téléphone : scanne une vraie photo de note manuscrite, vérifie que le fichier `.ics` téléchargé s'importe bien dans Calendrier iPhone ou Google Agenda. Dis-moi si tout fonctionne — je pourrai t'aider à ajuster le texte, le design, ou les limites d'usage gratuit si besoin.
