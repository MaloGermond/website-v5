# Bonnes pratiques UI/UX (Interfaces.dev)

Ce document centralise les règles et recommandations UI/UX inspirées du
[cheat sheet d'Interfaces.dev](https://interfaces.dev/cheat-sheet), pour guider les
décisions de design et d'implémentation sur ce projet.

> **Note sur les sources** : le contenu ci-dessous a été compilé à partir du cheat
> sheet public d'Interfaces.dev (accès direct au site indisponible depuis cet
> environnement au moment de la rédaction, contenu reconstitué via recherche web).
> Les règles ont été traduites et reformulées en français ; en cas de doute sur la
> formulation exacte d'une règle, se référer à la page originale :
> https://interfaces.dev/cheat-sheet

---

## 🎨 UI (Interface Utilisateur)

- **Border-radius concentrique** : sur des éléments imbriqués, le rayon extérieur
  doit être égal au rayon intérieur + le padding qui les sépare. Ne jamais utiliser
  deux valeurs de rayon codées en dur : calculer la relation avec `calc()`, et la
  clamper avec `max(0px, …)` (l'unité doit être présente sur le zéro, sinon la
  déclaration est invalide).

  ```css
  .outer {
    padding: 8px;
    border-radius: calc(var(--inner-radius) + 8px);
  }
  .inner {
    --inner-radius: max(0px, 12px);
    border-radius: var(--inner-radius);
  }
  ```

- **Alignement optique, pas géométrique** : quand un centrage géométrique
  « paraît » décalé à l'œil (icônes asymétriques, triangles de lecture, boutons
  avec icône), ajuster manuellement l'alignement plutôt que de suivre le calcul
  strict.

- **Bordure des images** : donnez aux images une bordure de 1px, décalée de
  -1px (via `box-shadow: inset` ou `outline`) :
  - Noir à 8 % d'opacité en mode clair.
  - Blanc à 8 % d'opacité en mode sombre.

  ```css
  .image {
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 8%);
  }
  [data-theme="dark"] .image {
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 8%);
  }
  ```

---

## 🎬 Animation

- Ne pas animer les interactions à haute fréquence (ex. changement de couleur au
  survol d'un élément dans une liste) : le coût visuel dépasse le bénéfice.
- Sur l'état pressé d'un bouton, réduire légèrement l'échelle (entre `0.95` et
  `0.98`) avec `transition: transform 200ms ease-out`.
- Pour un cross-fade d'icônes : l'icône entrante passe de `scale(0.25)` à
  `scale(1)`, `opacity: 0` à `1`, et `blur(4px)` à `blur(0)` ; l'icône sortante
  effectue l'animation inverse.
- Utiliser les **transitions CSS** pour les interactions utilisateur (elles
  peuvent être interrompues), et les **keyframes** uniquement pour les séquences
  qui ne s'exécutent qu'une seule fois.
- Désactiver toutes les transitions pendant un changement de thème
  (clair ↔ sombre) pour éviter un flash animé indésirable.
- N'utiliser `will-change` que sur les propriétés réellement animées :
  `transform`, `opacity`, `filter`. Ne pas l'appliquer « au cas où ».
- Si un élément se décale aléatoirement de 1-2px pendant une animation
  (notamment sur Safari iOS), ajouter `will-change: transform` pour forcer sa
  propre couche de composition.
- Respecter les préférences de mouvement réduit : englober les animations non
  essentielles dans `@media (prefers-reduced-motion: no-preference)`.
- Pour une entrée en scène de plusieurs éléments, les décaler légèrement dans le
  temps (stagger), par groupe ou individuellement, plutôt que de les faire
  apparaître tous en même temps.

  ```css
  @media (prefers-reduced-motion: no-preference) {
    .item {
      animation: fade-in 200ms ease-out both;
    }
  }
  ```

---

## 🔤 Typographie

- Toujours utiliser `.woff2` sur le web, jamais `.ttf` ni `.otf`.
- Appliquer `font-variant-numeric: tabular-nums` sur toute valeur numérique qui
  change ou dans les tableaux : minuteries, compteurs, prix, colonnes de
  données (sauf si une police monospace est déjà utilisée).
- Limiter le texte long à **60–75 caractères par ligne** pour la lisibilité.
- Utiliser `text-wrap: balance` sur les titres, `text-wrap: pretty` sur les
  descriptions courtes, et aucun des deux sur le texte long (coût de calcul
  trop élevé).
- Utiliser `overflow-wrap: break-word` là où des mots longs, liens ou
  identifiants peuvent déborder ; `white-space: nowrap` sur les libellés et
  badges courts.
- Appliquer `-webkit-font-smoothing: antialiased` et
  `-moz-osx-font-smoothing: grayscale` une seule fois, à la racine, jamais par
  composant.
- Utiliser `text-underline-position: from-font` avec
  `text-decoration-skip-ink: auto` pour que les soulignements évitent les
  jambages des lettres (g, j, p…).

  ```css
  :root {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .price,
  .counter {
    font-variant-numeric: tabular-nums;
  }
  ```

---

## 🌈 Couleurs

- Chaque étape d'une palette de couleurs doit avoir un usage précis (fond de
  page, survol de composant, bordure, remplissage plein, texte). Ne pas ajouter
  d'étapes que rien n'utilise.
- Les composants doivent utiliser des **tokens sémantiques**
  (`--color-text-secondary`), jamais des **primitives** (`--blue-500`)
  directement. La primitive est la valeur brute ; le token décrit son usage.
- Ne jamais nommer un token d'après son apparence ou son premier usage :
  préférer `--color-accent-solid` à `--color-blue-button` ou
  `--color-sidebar-gray`.
- Réserver `accent` à la couleur de marque, pour que `primary` ne désigne pas à
  la fois la marque et le texte principal.
- Ne pas réutiliser le token d'un autre rôle simplement parce que la couleur
  convient : si ce rôle change de couleur, votre élément changerait avec lui.
  Créer un token dédié au nouveau rôle.
- Mesurer le contraste par rapport au fond sur lequel l'élément est **réellement
  rendu**, pas par rapport au fond de la page.
- Le mode sombre n'est pas la palette claire simplement inversée : il nécessite
  sa propre palette.
- Pour les dégradés, choisir l'espace d'interpolation en connaissance de
  cause : `oklab` pour une luminosité homogène, `oklch` pour des tons médians
  plus vifs, ou aucun (repli sur sRGB, rendu plus classique/atténué).
- Appliquer `pointer-events: none` sur les éléments décoratifs (lueurs,
  dégradés) pour qu'ils n'interceptent jamais les clics destinés aux contrôles.

---

## ♿ Accessibilité

- N'utiliser que `tabindex="0"` et `tabindex="-1"` ; des valeurs positives
  cassent l'ordre naturel de tabulation.
- Donner un `aria-label` descriptif aux boutons icône seule, et ne jamais
  poser `aria-hidden="true"` sur un élément focusable.
- Une info-bulle sur un contrôle désactivé ne s'ouvre jamais au clavier ni au
  tactile : mettre l'explication en texte visible à côté, ou utiliser
  `aria-disabled="true"` pour garder le contrôle focusable.
- Utiliser une zone cliquable d'au moins 24×24px, idéalement 44×44px sur
  tactile et 40×40px sur desktop.
- Donner à chaque champ de formulaire un vrai `<label>`, un `type` et un
  `inputmode` appropriés.
- Garder le bouton de soumission actif jusqu'au lancement de la requête, puis
  valider à la soumission : `aria-invalid="true"`, `aria-describedby` pointant
  vers le message d'erreur, focus sur le premier champ invalide.
- Le lien « aller au contenu » (skip-to-content) doit être le premier élément
  focusable de la page ; ajouter `scroll-margin-top` sur les titres ancrés.
- Ne jamais communiquer un changement d'état uniquement par la couleur :
  ajouter une icône, un libellé ou un soulignement.
- Respecter `prefers-reduced-motion` (voir section Animation) pour les
  utilisateurs sensibles au mouvement.

  ```html
  <button aria-label="Fermer" aria-hidden="false">
    <svg aria-hidden="true">…</svg>
  </button>
  ```

---

## 📐 Layout

- L'espace entre deux groupes d'éléments doit être au moins le double de
  l'espace à l'intérieur d'un groupe : ex. 8px à l'intérieur, 16px+ entre les
  groupes.
- Utiliser les **propriétés logiques** (`margin-inline-start`,
  `padding-inline-end`…) plutôt que les propriétés physiques (`left`,
  `right`), pour un support natif du RTL/LTR.
- Ne pas fixer de largeur ou hauteur fixe sur les conteneurs de texte : laisser
  le contenu dicter la taille pour éviter les débordements ou troncatures.

  ```css
  .card {
    padding-inline: 16px;
    padding-block: 12px;
  }
  .card + .card {
    margin-block-start: 16px; /* 2x le padding interne */
  }
  ```

---

## ✍️ Rédaction

- Décrire la destination dans le texte d'un lien : « Consulter la
  documentation », jamais « Cliquez ici ».
- Capitaliser boutons, titres et libellés de la même façon partout dans
  l'application. La casse de phrase (sentence case) est le choix par défaut le
  plus sûr.
- Libeller les interrupteurs (toggles) avec l'état qu'ils activent : « Envoyer
  les accusés de lecture », jamais « Désactiver les accusés de lecture ».
- S'adresser au lecteur en le tutoyant/vouvoyant directement (« vous »),
  jamais à la troisième personne (« l'utilisateur »).
- Dans les états vides, orienter le lecteur et proposer une action suivante
  plutôt qu'un simple « Aucun résultat ».

---

## Sources

- [Interfaces.dev — Cheat Sheet](https://interfaces.dev/cheat-sheet)
- [Dossier .vibe du projet](https://github.com/MaloGermond/sketching-tools/tree/main/.vibe)

*Dernière mise à jour : 2026-08-31.*
