import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface ForgejoRepo {
	id: number;
	name: string;
	stars_count: number;
	forks_count: number;
	open_issues_count: number;
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const headers = {
			'Authorization': `token ${vars.token}`,
			'Content-Type': 'application/json',
		};

		// Determine endpoint based on username
		const endpoint = vars.username
			? `${baseUrl}/api/v1/users/${vars.username}/repos?limit=100`
			: `${baseUrl}/api/v1/user/repos?limit=100`;

		const res = await fetch(endpoint, { headers });

		if (!res.ok) {
			throw new Error(`Forgejo API failed: ${res.status}`);
		}

		const repos: ForgejoRepo[] = await res.json();

		// Calculate statistics
		const repositories = repos.length;
		const stars = repos.reduce((sum, repo) => sum + repo.stars_count, 0);
		const forks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
		const issues = repos.reduce((sum, repo) => sum + repo.open_issues_count, 0);

		return {
			repositories,
			stars,
			forks,
			issues,
		};
	},
});
