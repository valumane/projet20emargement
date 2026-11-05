# Projet AAW – Sujet 20 : Émargement et absences

**Groupe :** ________ · **Trigramme :** ___ (préfixe de toutes vos commandes) · **Pile :** NodeJS + React · **Données :** un spreadsheet propre au groupe

## 1. Contexte

Le suivi des présences se fait sur papier et les justificatifs d'absence se perdent. Votre application gère l'émargement par demi-journée et les justificatifs. Elle a deux points d'entrée : le site web et un bot Discord.

## 2. Ressource gérée

Chaque utilisateur gère **ses présences** par demi-journée et **ses justificatifs d'absence**.

## 3. Exigences

### 3.1 Site non connecté
- Page d'accueil avec menu et présentation du site.
- Lien de connexion et lien vers la liste des étudiants dans le menu.
- Liste des étudiants avec leur taux de présence, filtrable par nom.
- Fiche d'un étudiant : présences, absences et date de dernière mise à jour.

### 3.2 Connexion
- Authentification via l'API Discord (OAuth2). Aucun mot de passe local.

### 3.3 Site connecté
- Un lien « Modifier » apparaît dans le menu.
- L'utilisateur émarge et déclare un motif d'absence **pour lui-même uniquement**.

### 3.4 Bot Discord
- Commande de consultation : sa présence à un jour donné.
- Commande de mise à jour : émarger ou déclarer une absence avec son motif.
- Toutes les commandes sont préfixées par votre trigramme (exemple : `/abc-presence`).
- Le bot est ajouté au serveur Discord de test du module.
- Le README liste toutes les commandes avec leurs paramètres.

### 3.5 Sécurité
- Un token de session stocké en base de données, avec une date d'expiration.
- Un token expiré est refusé par le site comme par le bot.

### 3.6 Administration
- Un rôle administrateur, géré dans vos données.
- L'administrateur modifie les présences de n'importe quel étudiant.
- L'administrateur déconnecte un utilisateur (invalidation de son token).
- **Action propre au sujet :** valider les justificatifs et consulter le taux d'absence par étudiant.

## 4. Éléments remis en cours

Le projet ne peut être ni démarré ni validé sans les éléments ci-dessous. Ils ne sont pas diffusés par écrit : venez les chercher en séance.

| Élément | Remis le |
| --- | --- |
| Spreadsheet de départ : structure des colonnes et présences d'exemple | ________ |
| Identifiants du serveur Discord de test et de l'application bot | ________ |
| Règle métier du sujet : fenêtre d'émargement, motifs valables et seuil d'alerte d'absentéisme | ________ |
| Scénarios de démonstration à jouer lors de la soutenance | ________ |

## 5. Jalons

| Jalon | Contenu attendu | Date |
| --- | --- | --- |
| J1 | Schéma de données et maquettes du site | ________ |
| J2 | Connexion Discord et liste des étudiants | ________ |
| J3 | Bot Discord fonctionnel | ________ |
| J4 | Backoffice administrateur | ________ |
| Soutenance | Démonstration et questions individuelles | ________ |

## 6. Livrables et évaluation

- Dépôt Git avec un historique de commits régulier et lisible, auquel chaque membre contribue.
- README : installation, configuration, liste des commandes du bot.
- Soutenance individuelle : démonstration en direct, puis modification de code demandée en séance sur votre propre projet.
