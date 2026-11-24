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

## Démarrage local : API CSV et bot Discord

Prérequis : Node.js 20 ou supérieur et une application Discord installée sur votre serveur de test avec le scope `applications.commands`.

1. Exécuter `npm install`.
2. Au premier démarrage seulement, copier `.env.example` vers `.env` sans écraser une configuration existante.
3. Compléter `DISCORD_TOKEN`, `APP_ID`, `GUILD_ID` et `TRIGRAMME` (trois lettres minuscules). Définir `BOT_API_TOKEN` avec un secret aléatoire, par exemple généré avec `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Lancer l’API : `npm start` (ou `npm run dev` pour le rechargement automatique).
5. Dans un autre terminal, lancer le bot : `npm run bot`.
6. Enregistrer les commandes une fois, puis après chaque modification de leur définition : `npm run register`.

Le bot utilise la connexion Discord Gateway : aucun ngrok ni endpoint HTTP d’interactions n’est nécessaire. Si un ancien endpoint d’interactions est configuré dans le portail Discord, le retirer pour utiliser le Gateway.

### Commandes

Remplacer `abc` par votre trigramme configuré.

| Commande | Paramètres | Fonction |
| --- | --- | --- |
| `/blep` | `animal` | Commande d’exemple conservée. |
| `/abc-presence` | `date` (`AAAA-MM-JJ`) | Consulter ses émargements à cette date. |
| `/abc-emarger` | `date`, `demi-journee` (`matin` ou `apres-midi`), `statut` (`present` ou `absent`), `motif` | Enregistrer ou remplacer son émargement ; motif obligatoire si absent. |

Le bot prend l’identifiant de l’auteur de la commande : aucun paramètre ne permet de choisir un autre étudiant. Les réponses de présence sont privées.

### Stockage et API

Le CSV `data/presences.csv` est créé lors du premier enregistrement. Ses colonnes sont `discordId,date,demiJournee,statut,motif`. Une ligne correspond à un étudiant, une date et une demi-journée ; une nouvelle déclaration pour cette combinaison remplace l’ancienne. Les motifs contenant des virgules ou des retours à la ligne sont pris en charge.

Toutes les routes exigent l’en-tête `Authorization: Bearer <BOT_API_TOKEN>` :

- `GET /api/presences?discordId=...&date=AAAA-MM-JJ` : consultation ; date facultative.
- `POST /api/presences` : corps JSON avec les cinq colonnes ci-dessus ; réponse 201 à la création, 200 au remplacement.

L’API écoute par défaut sur `127.0.0.1:3000`. `API_URL` indique au bot l’adresse de l’API ; `CSV_PATH` définit le chemin du fichier, relatif au dossier de lancement. `HOST` et `PORT` configurent l’écoute. Pour héberger sur deux machines, exposer l’API derrière HTTPS et configurer `API_URL` en conséquence. Garder les secrets et le CSV hors de Git.

Lancer une seule instance de l’API par CSV. Les écritures sont mises en file et le remplacement du fichier est atomique ; ne pas modifier le CSV manuellement pendant les écritures de l’API.

### Validation et limites

`npm test` vérifie l’authentification de l’API, les paramètres, la persistance, les écritures simultanées et les champs CSV contenant des virgules ou retours à la ligne.

Cette étape fournit un stockage CSV local derrière une API, sans interface de tableur. Elle ne constitue pas encore l’application complète du sujet : la structure du spreadsheet fourni en cours reste à intégrer, ainsi que les fenêtres d’émargement, les sessions utilisateur avec expiration, OAuth2, React et l’administration. Le secret du bot authentifie le programme et ne remplace pas les sessions utilisateur exigées.
