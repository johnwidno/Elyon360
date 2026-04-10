# Étapes d'Implémentation : Module de Gestion des Cultes

Ce document détaille les phases successives pour le développement du module **Gestion des Cultes**.

## Phase 1 : Fondations Backend & Modèles de Données
- Créer les migrations pour `WorshipService`, `ServiceBlock`, `SermonMessage`, `MessageComment`.
- Configurer les contrôleurs pour la création d'un culte et la gestion des blocs.

## Phase 2 : Dashboard Admin & Création de Culte
- Créer la vue `/admin/cultes` (liste des cultes à venir/passés).
- Implémenter le formulaire de création : Date, Heure, Thème, Type, Image de couverture.

## Phase 3 : Interface de Planification par Blocs (Block-Based Editor)
- Développer la structure de liste verticale avec `@hello-pangea/dnd`.
- Créer les types de blocs de base : Titre, Prière, Accueil, Annonce.

## Phase 4 : Blocs Spécialisés (Integration Chants & Bible)
- Développer le bloc **Chant** : Recherche en temps réel dans la base `songs`, affichage de l'accordéon avec paroles.
- Développer le bloc **Lecture Biblique** : Sélecteur de Bible (Livre/Chapitre/Verset) avec insertion automatique du texte formaté.

## Phase 5 : Préparation Collaborative du Message
- Intégrer l'éditeur TipTap pour le prédicateur.
- Développer le système de commentaires contextuels (surlignage du texte -> clic -> ajout de commentaire).
- Implémenter les mentions `@utilisateur` et le système de notifications.

## Phase 6 : Vue Membre & Engagement Communautaire
- Créer l'interface pour les membres : Consultation du programme validé.
- Permettre aux membres de lire les points du message et de poser des questions avant le culte.

## Phase 7 : Statistiques & Export
- Décliner le programme en un export PDF propre.
- Implémenter les métriques d'engagement (nombre de commentaires, questions, taux de participation).
- Mode projection : Vue simple stylisée pour diffusion sur écran géant (Optionnel mais recommandé).

## Phase 8 : Tests, Internationalisation & Lancement (Terminé)
- Audit i18n (FR/EN) sur tout le module.
- Optimisations de performance pour le drag & drop et l'édition en direct.
