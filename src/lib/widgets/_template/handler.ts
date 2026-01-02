/**
 * Widget Template - handler.ts
 * 
 * Server-side handler for fetching widget data
 */
import { createHandler } from '../utils/create-handler';
import widget from './meta';

export const POST = createHandler({
  varsSchema: widget.varsSchema,

  async fetch(vars) {
    // ============================================
    // Implement your data fetching logic here
    // vars contains server-side config (e.g. API keys)
    // Types are inferred from widget.varsSchema
    // ============================================
    
    // Example: call external API
    // const response = await fetch(vars?.endpoint ?? 'https://api.example.com', {
    //   headers: vars?.apiKey ? { Authorization: `Bearer ${vars.apiKey}` } : {},
    // });
    // if (!response.ok) throw new Error('API request failed');
    // return response.json();

    // Return data matching dataSchema
    return {
      // status: 'online',
      // value: 42,
      // message: 'Hello from widget!',
    };
  },
});
