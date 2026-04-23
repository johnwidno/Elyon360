# Journal des Changements (Changelog) - ElyonSys 360

## [2026.04.21] - Transformation PWA et Nettoyage Majeur
### Ajouté
- **Module PWA (Progressive Web App)** :
    - Configuration de `manifest.json` avec branding ElyonSys.
    - Implémentation d'un Service Worker pour le cache et le mode hors-ligne.
    - Ajout d'un hook `usePWA` pour gérer l'installation.
    - Ajout d'un bouton "Download App" sur la page d'accueil publique et dans la Navbar.
- **Documentation Projet** :
    - Création du dossier `docs/` centralisé.
    - Génération du guide d'architecture et d'implémentation.

### Changé
- **Nettoyage (Cleanup)** :
    - Suppression de plus de 150 fichiers de debug, logs et scripts temporaires.
    - Réorganisation des scripts de maintenance dans `backend/maintenance/`.
    - Centralisation des documents Word dans `docs/specs/`.

---

## [2026.04.17] - Modernisation du Profil Membre
### Ajouté
- **Refonte Interface Profil Public** :
    - Design premium "Pixel-Perfect" basé sur le prototype utilisateur.
    - Intégration d'un sidebar persistant bleu nuit (#0B1437).
    - Système de "Bulletins Orange" pour les titres de sections.
    - Bannière minimaliste et photo de profil circulaire avec bordure.

### Corrigé
- **Workflow de lecture (Culte)** : Amélioration du mode focus et correction de la sélection de texte pour les commentaires style Google Docs.
