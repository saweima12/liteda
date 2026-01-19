import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface SearchResult {
	id: number;
	type: string;
}

interface Datasource {
	id: number;
}

interface Alert {
	state: string;
}

export const POST = createHandler({
	varsSchema: widget.varsSchema,

	async fetch(vars) {
		const baseUrl = vars.url.replace(/\/$/, '');
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (vars.username && vars.password) {
			headers['Authorization'] = `Basic ${btoa(`${vars.username}:${vars.password}`)}`;
		}

		const [searchRes, datasourcesRes, alertsRes] = await Promise.all([
			fetch(`${baseUrl}/api/search?type=dash-db`, { headers }),
			fetch(`${baseUrl}/api/datasources`, { headers }),
			fetch(`${baseUrl}/api/alerts`, { headers }),
		]);

		if (!searchRes.ok) {
			throw new Error(`Grafana API failed: ${searchRes.status}`);
		}

		const search: SearchResult[] = searchRes.ok ? await searchRes.json() : [];
		const datasources: Datasource[] = datasourcesRes.ok ? await datasourcesRes.json() : [];
		const alerts: Alert[] = alertsRes.ok ? await alertsRes.json() : [];

		const dashboards = search.filter((item) => item.type === 'dash-db').length;
		const alertsTriggered = alerts.filter((alert) => alert.state === 'alerting').length;

		return {
			dashboards,
			datasources: datasources.length,
			alerts: alerts.length,
			alertsTriggered,
		};
	},
});
