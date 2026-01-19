import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

interface TokenResponse {
  token: string;
  expires: string;
}

interface ProxyHost {
  id: number;
  enabled: boolean;
  domain_names: string[];
}

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    const baseUrl = vars.url.replace(/\/+$/, '');

    // Step 1: Get JWT token
    const tokenRes = await fetch(`${baseUrl}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: vars.username,
        secret: vars.password,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`NPM auth error: ${tokenRes.status} ${tokenRes.statusText}`);
    }

    const tokenData: TokenResponse = await tokenRes.json();

    // Step 2: Get proxy hosts
    const hostsRes = await fetch(`${baseUrl}/api/nginx/proxy-hosts`, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    });

    if (!hostsRes.ok) {
      throw new Error(`NPM API error: ${hostsRes.status} ${hostsRes.statusText}`);
    }

    const hosts: ProxyHost[] = await hostsRes.json();
    
    const enabled = hosts.filter((h) => h.enabled === true).length;
    const disabled = hosts.filter((h) => h.enabled === false).length;
    const total = hosts.length;

    return { enabled, disabled, total };
  },
});