# Plan de Bienvenue - Comprendre l'Architecture pas à pas

Ce document est conçu pour les nouveaux développeurs arrivant sur ElyonSys 360. Il vous guide à travers les différentes couches du logiciel, de la base vers le haut.

---

## ÉTAPE 1 : La Fondation (Base de Données)
Tout commence par la donnée. Avec plus de 60 tables, le système est vaste.
- **Le Noyau** : Identifiez le modèle `Church` (le client SaaS) et le modèle `User` (les membres/admins).
- **Les Modules** : Comprenez que chaque fonctionnalité (Culte, Finance, École du dimanche) possède son propre set de tables interconnectées.
- **Le Lien** : Presque toutes les tables possèdent un `churchId` pour garantir que les données appartiennent à une église précise.

## ÉTAPE 2 : La Muraille (Multi-Tenancy)
Comment empêcher une église de voir les données d'une autre ?
- **Au niveau du Backend** : Un middleware (dans `backend/middleware/`) intercepte toutes les requêtes. Il vérifie le domaine ou le header `X-Tenant-ID` et injecte une clause `WHERE churchId = ...` dans toutes les requêtes SQL automatiquement.
- **Au niveau du Frontend** : L'instance Axios dans `src/api/axios.js` s'occupe d'envoyer l'identifiant de l'église à chaque appel.

## ÉTAPE 3 : Le Cœur Logiciel (Backend API)
Le backend est organisé de manière très simple pour rester maintenable :
- **Routes** : Les points d'entrée (ex: `/api/member/profile`).
- **Controllers** : Là où la magie opère (calculs, logique métier).
- **Models** : Les schémas Sequelize qui parlent à la base de données.
- **Maintenance** : Si vous devez réparer quelque chose, regardez dans `backend/maintenance/`.

## ÉTAPE 4 : La Vitrine (Frontend React)
L'interface est une Application Single Page (SPA) :
- **Routing** : Géré dans `App.js`.
- **Layouts** : Les structures globales (Sidebar, Navbar) se trouvent dans `src/layouts/`.
- **Pages** : Les écrans réels (ex: Dashboard, Liste des membres).
- **State** : Le `AuthProvider` gère qui est connecté et à quelle église il appartient.

## ÉTAPE 5 : Les Finitions Premium (UI & PWA)
Pour rendre l'app "Premium" :
- **Look** : Utilisation intensive de Tailwind et Framer Motion pour les animations fluides.
- **Mobilité** : Le fichier `manifest.json` et le `service-worker.js` transforment le site en une application installable (PWA) sur téléphone.

---

## ÉTAPE 6 : L'Évolutivité (Ajouter un Module)
Comment ajouter une nouvelle fonctionnalité proprement sans casser le reste ?
1.  **Data First** : Créez votre nouveau modèle dans `backend/models/` et liez-le au `Church` pour l'isolation SaaS.
2.  **API Bridge** : Créez un contrôleur et une route backend. Testez-les avec une requête simple.
3.  **UI Component** : Créez un nouveau dossier dans `frontend/src/pages/Member/` ou `Admin/`.
4.  **Register** : Ajoutez votre nouvelle route dans `App.js` et créez un lien dans le sidebar correspondant (`Home.jsx` ou `AdminHome.jsx`).
5.  **Multi-langue** : Ajoutez les textes de votre module dans `LanguageContext.jsx` pour qu'ils soient traduisibles immédiatement.

---

## ÉTAPE 7 : L'Intégration (Ajouter une API Externe)
Comment connecter ElyonSys à des services tiers (MonCash, PayPal, Bible, etc.) ?
1.  **Secret Store** : Ajoutez vos clés API et URLs de base dans le fichier `backend/.env`. Ne les écrivez jamais en dur dans le code.
2.  **Service dédié** : Créez un fichier dans `backend/services/` (ex: `moncashService.js`) pour centraliser toute la logique de communication avec l'API externe (authentification, signatures, requêtes).
3.  **Proxy Backend** : Créez une route dans `backend/routes/` qui appelle votre service. Cela protège vos clés secrètes car le frontend ne parle qu'à votre backend, pas directement à l'API tierce (sauf cas spécifiques comme Stripe Elements).
4.  **Frontend Connector** : Créez un fichier dans `frontend/src/api/` (ex: `paymentApi.js`) pour permettre à vos composants React d'appeler votre nouvelle route backend.
5.  **Feedback Visuel** : Gérez toujours les états de chargement et les erreurs de connexion API dans l'UI pour une expérience utilisateur fluide.

---

## RÉSUMÉ POUR LE DÉVELOPPEUR :
1.  **Voulez-vous modifier un champ ?** Allez dans `backend/models/`.
2.  **Voulez-vous changer un texte ?** Allez dans `frontend/src/context/LanguageContext.jsx`.
3.  **Voulez-vous créer une page ?** Créez le composant dans `pages/` et liez-le dans `App.js`.
4.  **Voulez-vous ajouter un module ?** Suivez l'Étape 6.
5.  **Voulez-vous intégrer une API externe ?** Suivez l'Étape 7.

*Bienvenue parmi nous ! ElyonSys 360 est conçu pour être à la fois robuste et facile à étendre.*
