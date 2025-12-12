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
		// Configuration standard
		envPrefix: ['PUBLIC_'], // Seules les variables avec PUBLIC_ seront exposées
		plugins: [tailwindcss()],
	},
});
