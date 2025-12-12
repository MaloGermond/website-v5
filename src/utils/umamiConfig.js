// Configuration sécurisée pour Umami Analytics
// Ce fichier est utilisé côté serveur pour éviter d'exposer les variables sensibles

/**
 * Récupère la configuration Umami depuis les variables d'environnement
 * @returns {Object} Configuration Umami
 */
export function getUmamiConfig() {
  return {
    isEnabled: import.meta.env.UMAMI_ENABLED === 'true',
    isDevMode: import.meta.env.UMAMI_DEVMODE === 'true',
    url: import.meta.env.UMAMI_URL,
    websiteId: import.meta.env.UMAMI_WEBSITE_ID
  };
}

/**
 * Génère le script Umami de manière sécurisée
 * @param {Object} config - Configuration Umami
 * @param {string} pageSlug - URL de la page
 * @param {string} pageName - Nom de la page
 * @returns {string} Script Umami généré
 */
export function generateUmamiScript(config, pageSlug, pageName) {
  if (!config.isEnabled) {
    return '<!-- Umami disabled -->';
  }

  // Génère un script avec les valeurs injectées de manière sécurisée
  return `
    <script>
      (function() {
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.setAttribute('data-website-id', '${config.websiteId}');
        script.src = '${config.url}/script.js';
        document.head.appendChild(script);

        script.onload = function() {
          if (typeof umami !== 'undefined') {
            umami.track('PageView', {
              page: '${pageName || 'Unknown'}',
              url: '${pageSlug || window.location.pathname}',
              env: '${config.isDevMode ? 'development' : 'production'}'
            });
          }
        }
      })();
    </script>
  `;
}

/**
 * Génère le script de tracking de scroll Umami
 * @param {Object} config - Configuration Umami
 * @returns {string} Script de scroll généré
 */
export function generateUmamiScrollScript(config) {
  if (!config.isEnabled) {
    return '<!-- Umami scroll tracking disabled -->';
  }

  return `
    <script>
      (function() {
        if (typeof umami === 'undefined') {
          console.log('Umami - Page Behaviors désactivé (Umami non chargé)');
          return;
        }

        // Flags pour éviter les doublons
        let scrollEvents = {
          '25': false,
          '50': false,
          '75': false,
          '100': false,
        };

        // Formate le nom de la page
        function getFormattedPageName() {
          const pathname = window.location.pathname;
          const cleanName = pathname.replace(/^\\//, '').replace(/-/g, ' ');
          return cleanName.replace(/\\b\\w/g, (match) => match.toUpperCase()) || 'Accueil';
        }

        // Track le scroll avec envoi unique
        window.addEventListener('scroll', () => {
          const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
          );
          const pageName = getFormattedPageName();

          if (scrollPercent >= 25 && !scrollEvents['25']) {
            umami.track(\`scroll-25%\`);
            scrollEvents['25'] = true;
          }
          if (scrollPercent >= 50 && !scrollEvents['50']) {
            umami.track(\`scroll-50%\`);
            scrollEvents['50'] = true;
          }
          if (scrollPercent >= 75 && !scrollEvents['75']) {
            umami.track(\`scroll-75%\`);
            scrollEvents['75'] = true;
          }
          if (scrollPercent >= 100 && !scrollEvents['100']) {
            umami.track(\`scroll-100%\`);
            scrollEvents['100'] = true;
          }
        });
      })();
    </script>
  `;
}