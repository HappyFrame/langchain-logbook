// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
	site: 'https://HappyFrame.github.io',
	base: '/langchain-logbook',
	integrations: [
		mermaid(),
		starlight({
			title: 'LangChain Logbook',
			customCss: ['./src/styles/custom.css'],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/HappyFrame/langchain-logbook' }],
			sidebar: [
				{
					label: 'Tutorials',
					autogenerate: { directory: 'tutorials' },
				},
				{
					label: 'Appendix',
					slug: 'appendix'
				}
			],
		}),
	],
});
