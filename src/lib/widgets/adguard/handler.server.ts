import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface AdGuardStats {
  num_dns_queries: number;
  num_blocked_filtering: number;
  num_replaced_safebrowsing: number;
  num_replaced_safesearch: number;
  num_replaced_parental: number;
  avg_processing_time: number;
}

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    const baseUrl = vars.url.replace(/\/+$/, '');
    const auth = Buffer.from(`${vars.username}:${vars.password}`).toString('base64');

    const response = await fetch(`${baseUrl}/control/stats`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`AdGuard API error: ${response.status} ${response.statusText}`);
    }

    const data: AdGuardStats = await response.json();

    const queries = data.num_dns_queries;
    const blocked =
      data.num_blocked_filtering +
      data.num_replaced_safebrowsing +
      data.num_replaced_safesearch +
      data.num_replaced_parental;
    const filtered = queries > 0 ? Math.round((blocked / queries) * 1000) / 10 : 0;
    const latency = Math.round(data.avg_processing_time * 1000 * 100) / 100; // to ms

    return { queries, blocked, filtered, latency };
  },
});