# ElyonSys 360

## 🔹 1. Présentation du projet
**Nom du projet** : ElyonSys 360  
**Type** : Application SaaS (multi-tenant)  
**Objectif** : Fournir une plateforme complète aux églises pour gérer leur fonctionnement interne, offrir un espace personnalisé à leurs membres, et disposer d’un site vitrine public pour les visiteurs.

## 🔹 2. Cibles
- Églises de toute taille
- Responsables d’églises (pasteurs, administrateurs)
- Membres d’églises
- Visiteurs et fidèles

## 🔹 3. Structure du projet
ElyonSys 360 sera composé de 4 modules principaux :

### 1. Site public de l’église
- Présentation de l’église
- Équipe pastorale
- Horaires de culte
- Événements publics
- Page contact
- Inscription des nouveaux visiteurs
- URL personnalisée par église (ex. `eglisedelavie.elyonsys360.com`)

### 2. Espace Administratif (Back-office)
- Gestion des membres
- Gestion des groupes et ministères
- Gestion des événements
- Gestion de la logistique & inventaire
- Comptabilité et dons (dîmes, offrandes, promesses)
- École du dimanche
- Gestion des cérémonies (Sainte Cène, baptêmes, mariages)
- Tableau de bord statistiques

### 3. Espace Membre
- Connexion personnelle
- Fiche de profil
- Historique de participation
- Groupes et ministères associés
- Suivi des dons/dîmes personnels
- Notifications (messages, événements)

### 4. Espace ElyonSys (Portail SaaS)
- **Inscription des églises** : Formulaire pour qu'une nouvelle église crée son compte.
- **Gestion des abonnements** : Choix et paiement du plan (Mensuel/Annuel).
- **Administration Globale (Super Admin)** : Gestion de toutes les églises inscrites.

## 🔹 4. Fonctionnalités principales
- **Multi-église** : Chaque église a son compte, sous-domaine et base logique.
- **Authentification sécurisée** : JWT / OAuth.
- **Rôles utilisateurs** : Admin, Staff, Membre, SuperAdmin.
- **Tableau de bord dynamique**.
- **Système de dons manuels** (intégration paiement future).
- **Moteur d’événements**.
- **Upload documents** (PDF, images).
- **CMS simplifié** pour le site public.

## 🔹 5. Technologies
- **Frontend Web** : ReactJS (Admin + Site Public)
- **Frontend Mobile** : React Native (Option)
- **Backend** : Node.js (Express/NestJS)
- **Base de données** : PostgreSQL (multi-tenant)
- **Auth** : JWT + rôles
- **Design UI** : Tailwind CSS ou Material UI


## 🎨 Palette de Couleurs

#### Couleurs principales

| Nom | Hex | Utilisation |
|-----|-----|-------------|
| **Navy** | `#0f133d` | Fond sombre principal (hero, CTA, footer, sidebar) |
| **Deep Navy** | `#12162b` | Texte titre sur fond clair, variante du navy |
| **Navy Text** | `#1a1f4d` | Titres de sections, texte navbar, éléments importants |
| **Purple** | `#2b2060` | Gradient secondaire (milieu des gradients) |
| **Accent Blue** | `#191e57` | Fin des gradients, fonds alternatifs |
| **Orange** | `#ea762a` | CTA principal, accents, boutons d'action, hover |
| **Orange Hover** | `#d56820` | État hover du bouton orange |

#### Couleurs de fond

| Nom | Hex | Utilisation |
|-----|-----|-------------|
| **Light BG** | `#f0f0f5` | Sections claires (à propos, features) |
| **White** | `#ffffff` | Cartes, fond de sections alternées |
| **Dark BG 1** | `#111638` | Sections en dark mode |
| **Dark BG 2** | `#0d1030` | Sections alternées en dark mode |

#### Couleurs de texte

| Nom | Hex/Classe | Utilisation |
|-----|-----------|-------------|
| **Titre clair** | `#1a1f4d` | Titres H1-H3 sur fond clair |
| **Titre sombre** | `#ffffff` | Titres sur fond gradient/dark |
| **Corps clair** | `text-gray-600` | Paragraphes sur fond clair |
| **Corps sombre** | `text-gray-400` | Paragraphes en dark mode |
| **Sous-texte** | `text-gray-500` | Descriptions secondaires |
| **Hero description** | `text-gray-300/90` | Texte sur fond gradient hero |

#### Tailwind Config
```js
colors: {
  lovable: {
    navy: '#0f133d',
    deep: '#12162b',
    orange: '#ea762a',
    purple: '#2b2060',
    accent: '#191e57',
    light: '#f9f9fb',
  }
}
---

### 🌍 Internationalisation (i18n)

L'application supporte **FR** et **EN** via `LanguageContext`.

- Fichier : `src/context/LanguageContext.jsx`
- Hook : `const { lang, toggleLang, t } = useLanguage()`
- Usage : `{t('clé_de_traduction')}`

---

### 📦 Dépendances UI

| Package | Usage |
|---------|-------|
| `tailwindcss` | Styles utilitaires |
| `framer-motion` | Animations d'entrée et hover |
| `lucide-react` | Icônes (Users, Calendar, Shield, etc.) |

---


## 🏗️ Structure du Projet

```
frontend/
├── src/
│   ├── context/
│   │   ├── ThemeContext.jsx       # Dark mode toggle
│   │   └── LanguageContext.jsx    # FR/EN translations
│   ├── layouts/
│   │   └── PublicLayout.jsx       # Navbar + Sidebar + Footer
│   ├── pages/
│   │   ├── Public/
│   │   │   └── Home.jsx           # Page d'accueil
│   │   ├── Admin/                 # Dashboard admin
│   │   └── Member/                # Dashboard membre
│   ├── components/                # Composants réutilisables
│   └── index.css                  # Styles globaux + imports fonts
├── tailwind.config.js             # Config Tailwind (fonts, colors)
└── package.json
```

---

## 🚀 Lancer l'application

```bash
# Frontend
cd frontend
npm install
npm start

# Backend
cd backend
npm install
node server.js
```

