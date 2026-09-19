# Retour d'expérience — Kugiri sur la page Unistellar

Test de la librairie [Kugiri](https://github.com/edoardolunardi/kugiri) (v0.5.3) sur la page projet Unistellar, en complément de GSAP, pour un reveal au scroll ligne par ligne. Voir [issue #36](https://github.com/MaloGermond/website-v5/issues/36).

## Ce qui a été fait

3 blocs de texte animés dans `src/layouts/project/unistellar.astro`, chargés uniquement sur cette page :

- le paragraphe d'accroche (`content.contexte`)
- le paragraphe `content.purpose`
- le groupe rôles/compétences (`InfoColumn`), révélé en une seule vague

Kugiri découpe chaque bloc en lignes réellement peintes par le navigateur (`Range.getClientRects()`), GSAP + `ScrollTrigger` anime la translation/opacité avec un léger stagger. `prefers-reduced-motion` désactive l'animation et restaure directement le texte via `split.revert()`.

## Poids

- Nouvelle dépendance zéro-dépendance, ~7,6 kB gzip annoncés.
- Chunk JS de la page Unistellar (Kugiri + `gsap/ScrollTrigger`, déjà partiellement du poids GSAP) : **63,4 kB / 24,5 kB gzip**, chargé uniquement sur `/[lang]/unistellar/` (vérifié : absent du bundle de la home).

## Perfs

- Split + animation déclenchés une seule fois par bloc (`ScrollTrigger` en mode `once`), pas de recalcul au resize dans ce test (hors scope, mais à prévoir via `ResizeObserver` + `split.revert()` si généralisé).
- Aucune régression visuelle observée en FR/EN, clair/sombre, desktop/mobile (vérifié via captures d'écran Playwright) : pas de saut de layout, pas de troncature des descendantes (g/p/é) grâce au nettoyage du `clip-path` des masques après l'animation.

## DX

- API simple et bien typée (`splitText`, `TextSplit`), proche de l'exemple du README.
- Nécessite d'écrire soi-même la logique d'animation (Web Animations API, GSAP ou CSS) — Kugiri ne fait que le split, ce qui est cohérent avec son positionnement "complémentaire à GSAP" mentionné dans le ticket.
- Le résultat de `splitText` doit être recalculé si le texte ou la largeur du conteneur change (pas de réactivité automatique) ; non testé ici, RAS pour du contenu statique comme cette page.
- Compatible avec Astro sans configuration particulière, simple `<script>` client (pas besoin d'un island Preact).

## Décision

Le test est concluant sur cette page : poids raisonnable, aucune régression, intégration simple. Recommandation : généraliser au reste du portfolio dans un ticket dédié, en mutualisant le script de reveal (actuellement dupliqué par page) et en ajoutant la gestion du resize si des blocs concernés sont responsive en largeur.
