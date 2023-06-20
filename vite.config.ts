import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	//optimizeDeps: { include: ["carbon/charts"] }
	ssr: { noExternal: process.env.NODE_ENV === 'production' ? ['@carbon/charts', 'carbon-components'] : [] }
});
