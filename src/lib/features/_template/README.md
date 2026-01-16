# Feature Template

Use this template to create a new feature.

## Structure

```
src/lib/features/my-feature/
├── index.ts      # Feature implementation (default export)
├── meta.ts       # Feature metadata and Zod schemas
├── types.ts      # TypeScript types (optional)
└── README.md     # Feature documentation
```

## Example

```typescript
// meta.ts
import { z } from 'zod';

export const myFeatureVarsSchema = z.object({
  apiKey: z.string(),
  enabled: z.boolean().default(true),
});

export type MyFeatureVars = z.infer<typeof myFeatureVarsSchema>;
```

```typescript
// index.ts
import type { Feature } from '../types';
import { myFeatureVarsSchema } from './meta';

const myFeature: Feature = {
  name: 'my-feature',
  version: '1.0.0',

  async init(vars, pagesContent) {
    const config = myFeatureVarsSchema.parse(vars);

    // Your feature logic here
    console.log('Feature initialized with config:', config);

    // Optionally inject services into pages
    const homePage = pagesContent.get('home');
    if (homePage) {
      homePage.services.push({
        name: 'My Feature Services',
        items: [
          {
            name: 'Example Service',
            icon: 'docker',
            url: 'http://example.com',
          },
        ],
      });
    }
  },

  async destroy() {
    // Cleanup logic (optional)
    console.log('Feature destroyed');
  },
};

export default myFeature;
```

## Registration

Add your feature to the registry in `src/lib/features/loader.ts`:

```typescript
const FEATURES_REGISTRY = {
  'my-feature': () => import('./my-feature'),
};
```

## Configuration

Enable your feature in `config/settings.yaml`:

```yaml
features:
  my-feature:
    enabled: true
    vars:
      apiKey: "your-api-key"
```
