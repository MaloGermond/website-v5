// @ts-check
import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
	integrations: [preact(), tailwindcss()],
	vite: {
		resolve: {
			alias: {
				"@": "/src",
				"@components": "/src/components",
				"@layouts": "/src/components/layouts",
				"@assets": "/src/assets",
				"@styles": "/src/styles",
				"@analytics": "/src/components/analytics",
				"@locales": "/src/locales",
				"@utils": "/src/utils",
			},
		},
		build: {
			minify: true,
		},
		// Configuration pour éviter d'exposer les variables sensibles
		envPrefix: ['PUBLIC_'], // Seules les variables avec PUBLIC_ seront exposées
		define: {
			// On peut aussi définir des valeurs par défaut pour le développement
			'import.meta.env.UMAMI_ENABLED': JSON.stringify(process.env.UMAMI_ENABLED || 'false'),
			'import.meta.env.UMAMI_DEVMODE': JSON.stringify(process.env.UMAMI_DEVMODE || 'false'),
		},
		plugins: [tailwindcss()],
	},
});
