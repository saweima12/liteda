import { createHandler } from '../utils/create-handler.server';
import widget from './meta';

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    // This is the only logic widget developers need to care about
    // vars are validated and safe to use
    
    // Example: if endpoint is configured, you can use it like this
    // const response = await fetch(vars?.endpoint ?? 'https://default.api/status', {
    //   headers: vars?.apiKey ? { Authorization: `Bearer ${vars.apiKey}` } : {},
    // });
    // return response.json();

    // Demo: return mock data
    return {
      uptime: '3 days, 14 hours',
      randomValue: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
      status: 'healthy' as const,
      hasApiKey: !!vars?.apiKey,
      hasCustomEndpoint: !!vars?.endpoint,
    };
  },
});
