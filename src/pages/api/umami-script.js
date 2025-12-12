// Endpoint API pour générer le script Umami de manière sécurisée
import { getUmamiConfig } from '@utils/umamiConfig';

export function GET({ request }) {
  const config = getUmamiConfig();
  
  if (!config.isEnabled) {
    return new Response('<!-- Umami disabled -->', {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Récupérer les paramètres de la page
  const url = new URL(request.url);
  const pageSlug = url.searchParams.get('pageSlug') || 'unknown';
  const pageName = url.searchParams.get('pageName') || 'Unknown';
  
  // Générer le script Umami avec les données sensibles injectées côté serveur
  const script = `
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
              page: '${pageName}',
              url: '${pageSlug}',
              env: '${config.isDevMode ? 'development' : 'production'}'
            });
          }
        }
      })();
    </script>
  `;

  return new Response(script, {
    headers: { 'Content-Type': 'text/html' }
  });
}