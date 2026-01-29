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
