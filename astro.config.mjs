// @ts-check
import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
	integrations: [preact()],
	vite: {
		resolve: {
			alias: {
				"@": "/src",
				"@components": "/src/components",
				"@layouts": "/src/layouts",
				"@assets": "/src/assets",
				"@styles": "/src/styles",
				"@public": "/public",
				"@analytics": "/src/components/analytics",
			},
		},
	},
});
