# ElyonSys 360

> Plateforme SaaS de gestion pour les églises modernes.

---

## 🎨 Brand Guidelines — Design System

Ce document définit les **polices, couleurs et styles** utilisés dans toute l'application ElyonSys 360.
**Toute nouvelle page ou composant doit respecter ces règles.**

---

### 🔤 Typographie (Fonts)

| Rôle | Police | Poids | Utilisation |
|------|--------|-------|-------------|
| **Titres principaux** | `Plus Jakarta Sans` | `800` (Extra Bold) | H1, H2, Titles des sections, titres de pages |
| **Sous-titres** | `Plus Jakarta Sans` | `700` (Bold) | H3, H4, titres de cartes, labels importants |
| **Corps de texte** | `Inter` | `400` (Regular) | Paragraphes, descriptions, texte courant |
| **Corps de texte - emphasis** | `Inter` | `600` (Semi-bold) | Boutons, labels, nav links |
| **Texte secondaire** | `Inter` | `400` | Descriptions courtes, sous-textes, placeholders |

#### Import CSS
```css
/* Déjà dans index.css */
@import url('...family=Inter:wght@100;400;900&...family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
```

#### Tailwind Config
```js
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],     // Corps par défaut
  jakarta: ['Plus Jakarta Sans', 'sans-serif'],                     // Titres
}
```

#### Usage en JSX
```jsx
// Titres principaux
<h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="font-extrabold">
// ou via Tailwind
<h1 className="font-jakarta font-extrabold">

// Corps de texte (automatique via font-sans par défaut)
<p className="text-base">
```

---

### 🎨 Palette de Couleurs

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
```

---

### 🌈 Gradients

| Nom | CSS | Usage |
|-----|-----|-------|
| **Hero / CTA / Footer** | `linear-gradient(135deg, #0f133d 0%, #2b2060 40%, #191e57 100%)` | Fond principal sombre |
| **Sidebar Mobile** | `linear-gradient(180deg, #0f133d 0%, #2b2060 60%, #191e57 100%)` | Menu mobile overlay |

---

### 🔘 Boutons

| Type | Style | Usage |
|------|-------|-------|
| **CTA Principal** | `bg-[#ea762a] text-white rounded-full font-bold shadow-xl` | Créer mon église, actions primaires |
| **Secondaire (outline)** | `border-2 border-white/20 text-white rounded-full font-bold` | Se connecter (sur fond sombre) |
| **Navbar Solid** | `bg-[#1a1f4d] text-white rounded-lg font-bold` | Créer mon église (navbar) |
| **Navbar Outline** | `border border-gray-300 text-[#1a1f4d] rounded-full font-semibold` | S'inscrire (navbar) |
| **Toggle (rond)** | `w-9 h-9 rounded-full border flex items-center justify-center` | Dark mode, FR/EN |

---

### 📐 Mise en page & Espacements

| Élément | Valeur |
|---------|--------|
| **Max Width** | `max-w-7xl` (1280px) |
| **Padding horizontal** | `px-5 sm:px-6 lg:px-8` |
| **Section padding vertical** | `py-16 sm:py-24 md:py-28` |
| **Hero height (mobile)** | `min-h-[90vh]` |
| **Navbar height** | `h-14 sm:h-16` |
| **Sidebar mobile width** | `w-[280px]` |
| **Card border radius** | `rounded-2xl` |
| **Card padding** | `p-6 sm:p-7` |
| **Gap grille** | `gap-5 sm:gap-6` |

---

### 🌙 Dark Mode

L'application supporte le **dark mode** via `class` strategy Tailwind.

| Élément | Light Mode | Dark Mode |
|---------|------------|-----------|
| Navbar BG | `bg-white/80` | `bg-[#0f133d]/90` |
| Section BG | `bg-[#f0f0f5]` / `bg-white` | `bg-[#111638]` / `bg-[#0d1030]` |
| Titre text | `text-[#1a1f4d]` | `text-white` |
| Corps text | `text-gray-600` | `text-gray-400` |
| Card | `bg-white border-gray-100` | `bg-white/5 border-white/10` |
| Borders | `border-gray-200` | `border-white/10` |

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

### 📱 Breakpoints Responsive

| Breakpoint | Taille | Usage |
|------------|--------|-------|
| **Mobile** | `< 640px` | 1 colonne, hamburger menu, 90vh hero |
| **Tablet** (sm) | `640px+` | 2 colonnes features, boutons côte à côte |
| **Desktop** (md) | `768px+` | Navbar complète |
| **Large** (lg) | `1024px+` | 4 colonnes features, layout split |

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
