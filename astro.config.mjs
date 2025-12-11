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
				"@public": "/public",
				"@analytics": "/src/components/analytics",
				"@locales": "/src/locales",
				"@utils": "/src/utils",
			},
		},

		plugins: [tailwindcss()],
	},
	i18n: {
		locales: ["fr", "en"],
		defaultLocale: "fr",
	},
});
