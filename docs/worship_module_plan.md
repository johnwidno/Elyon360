# Plan d'Implémentation : Module de Gestion des Cultes

Cet artefact définit l'architecture et les fonctionnalités du nouveau module **Gestion des Cultes** pour ElyonSys 360.

## 1. Vision du Module
Transformer la préparation du culte en une expérience collaborative et structurée, permettant une transition fluide de la planification administrative à l'expérience spirituelle de la communauté.

## 2. Architecture Technique

### Modèles de Données (Backend)
- **WorshipService** : `id`, `theme`, `date`, `time`, `type`, `description`, `image_url`, `status` (brouillon, validé).
- **ServiceBlock** : `id`, `service_id`, `type` (Chant, LectureBiblique, Prière, Accueil, etc.), `order_index`, `metadata` (JSON pour les détails spécifiques par type).
- **SermonMessage** : `id`, `service_id`, `preacher_id`, `title`, `content_html`, `points` (JSON), `attachments` (JSON).
- **MessageComment** : `id`, `message_id`, `author_id`, `content`, `parent_id` (pour threads), `highlight_range` (pour surlignage).

### Technologies recommandées
- **Drag & Drop** : `@hello-pangea/dnd` ou `dnd-kit` pour le réordonnancement des blocs.
- **Éditeur Collaboratif** : `TipTap` pour l'édition de texte riche et la gestion des commentaires/surlignages.

## 3. Interfaces Utilisateurs (Frontend)

### Interface Admin / Leader (Blocs)
- **Service Builder** : Vue en liste verticale de blocs réordonnables.
- **Song Integration** : Recherche dans la base de données des chants avec affichage des paroles.
- **Bible Integration** : Sélecteur dynamique de livre/chapitre/verset avec auto-remplissage du texte.

### Interface Prédicateur (Collaborative)
- **Sermon Dashboard** : Éditeur plein écran avec barre latérale pour les commentaires des membres.
- **Document Support** : Zone de téléchargement pour PDF/PPT.

### Interface Membre (Engagement)
- **Worship Feed** : Liste des cultes à venir avec accès aux grandes lignes du message.
- **Interaction Sociale** : Commentaires, questions et mentions @utilisateur.

## 4. Statistiques et Analytics
- **Suivi de Participation** : Présence par culte.
- **Taux d'Engagement** : Volume d'interactions et de commentaires.
