import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface CloudflareResponse {
  success: boolean;
  result: {
    id: string;
    name: string;
    status: string;
    connections: Array<{
      colo_name: string;
      origin_ip: string;
      opened_at: string;
    }>;
  };
  errors: Array<{ message: string }>;
}

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${vars.accountId}/cfd_tunnel/${vars.tunnelId}`,
      {
        headers: {
          Authorization: `Bearer ${vars.key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const data: CloudflareResponse = await response.json();

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Unknown Cloudflare error');
    }

    const tunnel = data.result;
    const originIp = tunnel.connections?.[0]?.origin_ip ?? null;

    return {
      status: tunnel.status,
      originIp,
      name: tunnel.name,
    };
  },
});