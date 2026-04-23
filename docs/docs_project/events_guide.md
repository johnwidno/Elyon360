# Guide Module Cultes et Événements

Le module de Cultes est l'un des plus sophistiqués d'ElyonSys 360, permettant de construire des liturgies interactives et de les projeter.

## 1. Structure d'un Culte (Liturgie)
Un culte n'est pas un simple événement, c'est une collection ordonnée de blocs :
- **WorshipService** : L'entité parente (date, thème, église).
- **ServiceBlock** : Un élément de la liturgie (Prière, Lecture, Annonce, Chant). Chaque bloc possède un `order` pour définir sa séquence.
- **SermonMessage** : Le contenu textuel riche associé au sermon du jour.
- **Song** : Lié aux blocs de type "Chant".

## 2. Mode Focus et Interaction
L'interface de lecture (MemberWorship) permet des interactions avancées :
- **Commentaires sur sélection** : Style Google Docs. La logique repose sur la capture des `Selection` DOM et l'enregistrement des offsets dans le modèle `MessageComment`.
- **Maximize Mode** : Un mode sans distraction (Zéro UI) pour les prédicateurs et les lecteurs.

## 3. Projection & Public View
Le système génère des vues publiques (`/public/worship/:id`) optimisées pour être affichées sur grand écran.
- Les blocs sont transmis en temps réel (ou via navigation) pour que l'assemblée puisse suivre les paroles des chants et les versets bibliques.

## 4. Maintenance & Données
- Pour injecter des types d'événements par défaut : `maintenance/scripts/seed_event_types.js`.
- Pour corriger des problèmes de liens entre sermons et cultes : `maintenance/scripts/definitive_event_fix.js`.

---
*Note: Les textes des sermons supportent le formatage riche. Assurez-vous que le composant de rendu (`marked-sermon`) traite correctement les sauts de ligne et le gras.*
