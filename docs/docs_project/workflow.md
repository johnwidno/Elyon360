# Workflows de l'Application - ElyonSys 360

Ce document décrit les flux de travail (workflows) logiques pour chaque grande fonctionnalité du logiciel, aidant à comprendre comment les données circulent.

## 1. Flux d'Inscription d'Église (Tenant Onboarding)
Ce flux permet à une nouvelle église de rejoindre la plateforme.
1. **Public Home** : L'utilisateur clique sur "Créer une église".
2. **Setup Form** : Saisie des infos de l'église (nom, logo, sous-domaine souhaité) et de l'administrateur.
3. **Paiement MonCash** : Redirection vers la passerelle de paiement.
4. **Validation (Backend)** : Le Webhook MonCash confirme le succès, crée l'église dans la base avec le statut `active`.
5. **Accès Backend** : L'ID de l'église est réservé pour toutes les futures données de ce tenant.

## 2. Flux de Connexion (Auth Workflow)
1. **Login Page** : L'utilisateur saisit son email/mot de passe.
2. **Identification Eglise** : Le système détecte l'église via le sous-domaine de l'URL actuelle.
3. **JWT Generation** : Le backend vérifie les accès, génère un JWT contenant le `churchId` et le `role`.
4. **Context Update** : Le `AuthProvider` côté React stocke l'utilisateur et active l'accès aux pages protégées.

## 3. Workflow des Cultes (Liturgie & Worship)
C'est le module de gestion des services religieux.
1. **Planification** : L'admin crée un `WorshipService` dans le dashboard.
2. **Construction** : Ajout de `ServiceBlocks` (Prière, Lecture, Chant). Chaque bloc est une petite pizza de données associée au culte parent.
3. **Prédication** : Ajout d'un `SermonMessage` rattaché au culte.
4. **Diffusion** : 
    - Mode Membre : Affichage du culte avec commentaires interactifs.
    - Mode Projection : Vue simplifiée pour les écrans de l'église.

## 4. Flux de Gestion Financière (Donations & Dépenses)
1. **Donation** : Un membre fait une offrande -> Enregistré dans `Donation` lié à `Church`.
2. **Budget** : L'admin définit un `Budget` annuel ou mensuel par catégorie.
3. **Dépense** : Enregistrement des frais de fonctionnement dans `Expense`.
4. **Reporting** : Le système fait la différence `Donations - Expenses` pour générer le rapport de balance visible sur le Dashboard.

## 5. Flux de l'École du Dimanche (Sunday School)
1. **Enregistrement** : Ajout d'un enfant/élève dans `SundaySchoolMember`.
2. **Rapport** : Chaque dimanche, le moniteur crée un `SundaySchoolReport`.
3. **Présence** : Saisie de l'assiduité dans `SundaySchoolAttendance`.
4. **Stats** : Calcul automatisé des moyennes de fréquentation mensuelle.

---
*Note: Chaque modification de données dans ces flux déclenche généralement une mise à jour d'historique (`StatusHistory` ou `ActivityLog`) pour l'audit.*
