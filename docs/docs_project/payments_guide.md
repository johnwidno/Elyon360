# Guide Intégration Paiements (MonCash & SaaS)

Ce document explique le fonctionnement du système de paiement et d'activation des églises sur ElyonSys 360.

## 1. Flux d'Activation SaaS
Le système permet aux églises de s'inscrire et de payer leur abonnement via MonCash.
1.  **Inscription** : Une église remplit le formulaire de création.
2.  **Paiement** : L'utilisateur est redirigé vers l'interface MonCash.
3.  **Webhook / Vérification** : Le backend reçoit une confirmation (`moncash/webhook` ou `payment/verify`).
4.  **Activation** : Le statut de la `Church` passe de `pending` à `active`.

## 2. Modèles de Données Clés
- **Church** : Contient les informations de l'entité, dont `moncashOrderId` (ID de commande temporaire) et `moncashTransactionId` (ID finalisé après paiement).
- **SubscriptionTransaction** : Historique de tous les paiements effectués. Chaque transaction est liée à une `Church` et un `Plan`.
- **Plan** : Définit les limites (nombre de membres, fonctionnalités, prix).

## 3. Configuration & Sécurité
- **Middleware Tenant** : Dans `backend/middleware/tenant.js`, les routes de paiement MonCash sont exclues de certains filtres pour permettre les redirections externes sans perte de session.
- **Variables d'Environnement** : Les clés API MonCash (`MONCASH_CLIENT_ID`, `MONCASH_SECRET`) doivent être configurées dans le `.env` du backend.

## 4. Maintenance des Paiements
En cas de litige ou de bug de réseau :
- Le script `maintenance/scripts/activate_church.js` permet de forcer l'activation d'une église manuellement.
- Le script `maintenance/scripts/detailed_activation_test.js` simule un flux de paiement complet pour les tests.

---
*Note: Toujours vérifier l'intégrité du `moncashOrderId` avant de valider une transaction côté serveur.*
