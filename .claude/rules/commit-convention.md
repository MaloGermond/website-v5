# Convention de commit

## Constat (à partir de l'historique du repo)

- Le gitmoji est déjà utilisé de façon quasi systématique (`:bug:`, `:art:`,
  `:lipstick:`, `:construction:`, `:sparkles:`, `:pencil2:`,
  `:heavy_plus_sign:`, `:building_construction:`, `:bookmark:`) — c'est un
  bon réflexe, à garder tel quel.
- Les messages sont majoritairement en anglais (`Fix the icons loading`,
  `Upgrade Astro to v7.3.2`...) : c'est la langue de référence à conserver
  pour les messages de commit, même si le code et ses commentaires restent
  en français.
- Récurrent : des messages qui racontent la recherche en cours plutôt que le
  changement obtenu, par exemple `Ok, i'll start something good`,
  `Does the naming right now ?`, `Learning how to redirect assets`,
  `Ok, not able to find a solution`, `file not read`. Ce sont des notes
  utiles au moment où on les écrit, mais illisibles ensuite sans rouvrir le
  diff — l'historique perd sa valeur de documentation.

## Règle

**Format** : `:gitmoji: <description>`

La description :
- est en **anglais**, à l'**impératif** (`Fix`, `Add`, `Remove`, pas
  `Fixed`/`Fixing`/`Adds`) ;
- décrit le **résultat observable** du commit (ce qui a changé dans le
  comportement ou le code), jamais l'état de la recherche ni une question
  qu'on se pose à soi-même ;
- reste courte (une ligne, ~50-70 caractères visés).

### Glossaire gitmoji (usage déjà en place dans ce repo)

| Gitmoji | Usage |
|---|---|
| `:sparkles:` | Nouvelle fonctionnalité |
| `:bug:` | Correction de bug |
| `:art:` | Structure/qualité du code (refacto, réorganisation) sans changement de comportement |
| `:lipstick:` | Style visuel (CSS, layout, animation) |
| `:construction:` | Travail en cours sur une fonctionnalité pas encore terminée |
| `:building_construction:` | Changement d'architecture |
| `:heavy_plus_sign:` | Ajout d'une dépendance |
| `:pencil2:` | Correction de texte/typo/contenu |
| `:bookmark:` | Version/tag |
| `:memo:` | Documentation |

`:construction:` reste légitime pour un commit intermédiaire — la granularité
fine de l'historique est une force à conserver. Ce qui change, c'est que même
un commit intermédiaire décrit ce qu'il fait concrètement, pas l'état
d'esprit de la personne qui code.

### Exemples (réécriture de commits réels de l'historique)

| Avant | Après |
|---|---|
| `:art: Ok, i'll start something good` | `:construction: Scaffold redirect logic for legacy URLs` |
| `:construction: Does the naming right now ?` | `:construction: Rename redirect params to match route config` |
| `:bug: Learning how to redirect assets` | `:construction: Try asset redirect via Netlify _redirects` |
| `:construction: Ok, not able to find a solution` | `:construction: Revert asset redirect attempt, keep default routing` |
| `:construction: file not read` | `:bug: Guard against missing metadata file in loadScreensOnce` |

Dans le doute, se demander : *« si je lis ce message dans 6 mois, sans le
diff sous les yeux, est-ce que je sais ce que ce commit a changé ? »*

## Checklist avant de commit

```
## Checklist
- [ ] Le message décrit le changement, pas la recherche ou une question
- [ ] Le gitmoji correspond au glossaire ci-dessus
- [ ] Message en anglais, impératif
- [ ] Pas de `console.log` ni de code mort commenté laissé dans le diff
- [ ] `npm run format` passé si des fichiers formatables ont changé
```
