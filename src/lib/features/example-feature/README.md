# Example Feature

Example feature registered via the feature system.

## Structure

```
src/lib/features/my-feature/
├── index.ts      # Feature implementation (default export)
├── meta.ts       # Feature metadata and Zod schemas
├── types.ts      # TypeScript types (optional)
└── README.md     # Feature documentation
```

## Configuration

```yaml
features:
  example-feature:
    enabled: true
    vars:
      groupName: "Example Feature Services"
      groupIcon: "docker"
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
