# TaskFlow - mini-projet Node.js pur

TaskFlow est un mini-projet full-stack pour une presentation Node.js.
Il contient un backend en Node.js pur et un frontend HTML/CSS/JavaScript.

Le but est de montrer concretement :

- creation d un serveur avec node:http ;
- routage manuel avec req.method et URL ;
- API CRUD ;
- reponses HTTP avec status code et Content-Type ;
- JSON.stringify et JSON.parse ;
- lecture/ecriture dans tasks.json avec node:fs/promises ;
- frontend qui consomme l API avec fetch().

## Lancer le projet

```bash
node server.mjs
```

Puis ouvrir :

```text
http://localhost:3000
```

Important : il faut passer par le serveur Node.js. Ne pas ouvrir directement public/index.html.

## Structure

```text
taskflow-nodejs-version-etudiant/
|---- server.mjs
|---- storage.mjs
|---- http-helpers.mjs
|---- tasks.json
`---- public/
    |---- index.html
    |---- style.css
    `---- app.js
```

## Routes API

| Methode | Route | Role |
|---|---|---|
| GET | /api/tasks | Lire toutes les taches |
| GET | /api/tasks/:id | Lire une tache par id |
| POST | /api/tasks | Creer une tache |
| PATCH | /api/tasks/:id | Modifier une tache |
| DELETE | /api/tasks/:id | Supprimer une tache |

## Tests rapides

```bash
curl http://localhost:3000/api/tasks
```

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Tester la route POST","priority":"high"}'
```

```bash
curl -X PATCH http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'
```

```bash
curl -X DELETE http://localhost:3000/api/tasks/1
```
