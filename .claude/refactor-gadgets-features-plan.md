# Plan: Refactor to Gadgets + Features Architecture

## Context & Background

### Current State (Before Refactor)
Liteda is a lightweight homelab dashboard built with SvelteKit. The codebase currently uses "addons" terminology for header bar components, which is semantically confusing:

**Current Structure:**
- `src/lib/addons/` - Header bar components (weather, resources, search, theme-switcher, title, spacer)
- `src/lib/widgets/` - Dashboard service monitoring cards
- API routes: `/api/addons/[type]` with GET handler using ID-based config lookup for security

**Problem:**
- "Addons" typically implies plugins/extensions system with optional loading
- Current "addons" are lightweight and always loaded (like widgets)
- Need a place for heavy optional features like Docker Discovery
- Terminology doesn't clearly distinguish lightweight vs heavy components

### Recent Work Completed
Just finished implementing secure addon handler system (commit c426d25):
- Server-side config store prevents exposing sensitive vars (API keys, passwords) to client
- Changed from POST to GET with query parameter `?id=<addon-id>`
- Unified `createAddonHandler()` utility with Zod validation and caching
- All API keys and secrets stay server-side only

### Why This Refactor?

**User's Vision:**
1. **Docker Discovery Use Case** - Want to auto-discover Docker containers and add them to services
   - Too heavy for always-loaded system (requires dockerode dependency)
   - Not everyone needs this functionality
   - Should be opt-in via config

2. **Clear Separation**
   - Lightweight header components (weather, search) → Always loaded, small bundle impact
   - Heavy optional features (docker-discovery) → Loaded only when enabled
   - Simple architecture without complex plugin API (this is for personal homelab, not a platform)

3. **Better Naming**
   - Current "addons" is ambiguous
   - "Gadgets" better conveys lightweight, always-available header tools
   - "Features" clearly indicates heavy, optional functionality

### Architecture Principles

**Gadgets (Renamed from Addons):**
- Small, lightweight components for header bar
- Always bundled and loaded (like widgets)
- No enable/disable mechanism needed
- Examples: weather, resources, search, theme-switcher

**Features (New Concept):**
- Heavy optional functionality with significant dependencies
- Loaded at server startup based on `features` config section
- Can inject services, register gadgets/widgets, add API routes
- Examples: docker-discovery (future: kubernetes, proxmox, etc.)

**Not Building a Plugin System:**
- No external plugin API or marketplace
- All features are built-in to the codebase
- Use `enabled: true/false` for control
- Simpler maintenance, no backward compatibility concerns

## User Requirements

### Naming Decision
- **gadgets/** - Lightweight header bar components (weather, resources, search, theme-switcher, title)
  - **Eager import** via `import.meta.glob({ eager: true })`
  - Always bundled, loaded at startup (like widgets)
  - ~80 KB total, negligible memory impact
  - Simple synchronous access, no async complexity
  - Lifecycle: configured in header → component rendered

- **features/** - Heavy optional functionality (docker-discovery)
  - **Lazy import** via dynamic `import()`
  - Only loaded when enabled in config
  - Can have heavy dependencies (dockerode ~1-2 MB)
  - Loaded at server startup based on `features` config
  - Can inject services, register gadgets/widgets, add API routes

### Loading Strategy Rationale

**Why Eager for Gadgets & Widgets?**
- Code footprint is tiny (~10-30 KB per gadget/widget)
- Synchronous access simplifies code (no async/await needed)
- No loading states or visual flicker
- Errors caught at startup, not runtime
- Users likely use most gadgets anyway

**Why Lazy for Features?**
- Heavy dependencies (dockerode, kubernetes clients, etc.)
- Not everyone needs these features
- Significant memory savings (1-5 MB per feature)
- Worth the async loading complexity
- Clear opt-in via config

### Docker Discovery Requirements
- Auto-discover containers from Docker daemon
- Add discovered containers to **dedicated group** (won't conflict with YAML services)
- Inject into specific page (e.g., "Docker" page or dedicated group in existing page)
- Load at server startup via `hooks.server.ts`

### Architecture Explored

From exploration agent findings:

**Services Structure:**
- ServiceGroup contains ServiceItem[] or InnerGroup[]
- Each page has independent ServiceGroup[] array
- Config loaded once at startup in `hooks.server.ts` and cached
- Can inject new groups before `setCachedConfig()`

**Best injection point:**
```typescript
// hooks.server.ts
const pagesContent = await loadAllPages(settings);

// NEW: Features can modify pagesContent
if (settings.features?.['docker-discovery']?.enabled) {
  await dockerDiscoveryFeature.init(settings.features['docker-discovery'], pagesContent);
}

setCachedConfig({ ... });
```

## Implementation Plan

### Step 1: Rename addons → gadgets

**Directory structure:**
```
src/lib/
├── gadgets/          # Renamed from addons/
│   ├── weather/
│   ├── resources/
│   ├── search/
│   ├── theme-switcher/
│   ├── title/
│   ├── spacer/
│   ├── config-store.ts
│   ├── registry.ts
│   ├── types.ts
│   └── utils/
│       └── create-handler.ts
```

**Files to update:**
- Move `src/lib/addons/` → `src/lib/gadgets/`
- Update imports:
  - `$lib/addons` → `$lib/gadgets`
  - All files importing from addons/
- Update API routes:
  - `src/routes/api/addons/` → `src/routes/api/gadgets/`
  - Handler paths in gadget components
- Update types:
  - `AddonProps` → `GadgetProps`
  - `AddonConfig` → `GadgetConfig`
  - `createAddonHandler` → `createGadgetHandler`
  - `updateAddonConfigs` → `updateGadgetConfigs`
  - `getAddonConfig` → `getGadgetConfig`

**Config files:**
- Update `src/lib/config/schema.ts`:
  - Settings schema still uses `layout.header` (no change needed)
  - Internal types reference gadgets

**Documentation:**
- Update CLAUDE.md:
  - "Addon System" → "Gadget System"
  - API examples use `/api/gadgets/`
  - Explain gadgets vs features distinction

### Step 2: Create Features System

**Directory structure:**
```
src/lib/features/
├── _template/        # Template for new features
│   ├── meta.ts
│   ├── index.ts
│   └── README.md
└── docker-discovery/
    ├── meta.ts       # Feature definition
    ├── index.ts      # Feature initialization
    ├── discovery.ts  # Docker API logic
    ├── types.ts      # Types and schemas
    └── utils.ts      # Helpers
```

**Feature Interface:**
```typescript
// src/lib/features/types.ts
export interface Feature {
  name: string;
  version: string;

  // Lifecycle
  init(vars: unknown, pagesContent: Map<string, PageContent>): Promise<void>;
  destroy?(): Promise<void>;

  // Optional capabilities
  registerGadgets?(): GadgetConfig[];
  registerWidgets?(): WidgetConfig[];
  registerRoutes?(): Route[];
}
```

**Feature loader (Lazy Import):**
```typescript
// src/lib/features/loader.ts

// Registry maps feature names to their import paths
const FEATURES_REGISTRY: Record<string, () => Promise<{ default: Feature }>> = {
  'docker-discovery': () => import('./docker-discovery'),
  // Future features:
  // 'kubernetes': () => import('./kubernetes'),
  // 'proxmox': () => import('./proxmox'),
};

export async function loadFeatures(
  featuresConfig: Record<string, any>,
  pagesContent: Map<string, PageContent>
): Promise<void> {
  for (const [featureName, config] of Object.entries(featuresConfig)) {
    if (config.enabled === false) continue;

    const featureLoader = FEATURES_REGISTRY[featureName];
    if (!featureLoader) {
      console.warn(`Unknown feature: ${featureName}`);
      continue;
    }

    try {
      // Lazy import - only loads if enabled
      const module = await featureLoader();
      const feature = module.default;

      console.log(`Loading feature: ${featureName}`);
      await feature.init(config.vars || {}, pagesContent);
      console.log(`Feature loaded: ${featureName}`);
    } catch (error) {
      console.error(`Failed to load feature ${featureName}:`, error);
      // Continue loading other features
    }
  }
}
```

**Key Difference from Gadgets/Widgets:**
- Gadgets use `import.meta.glob({ eager: true })` - all loaded at startup
- Features use `() => import()` - only load when enabled
- Features loader handles errors gracefully per feature

### Step 3: Implement Docker Discovery Feature

**Feature metadata:**
```typescript
// src/lib/features/docker-discovery/meta.ts
import { z } from 'zod';

export const dockerDiscoveryVarsSchema = z.object({
  socket: z.string().default('/var/run/docker.sock'),
  labelPrefix: z.string().default('liteda'),
  targetPage: z.string().default('home'),
  groupName: z.string().default('Docker Containers'),
});

export type DockerDiscoveryVars = z.infer<typeof dockerDiscoveryVarsSchema>;
```

**Feature implementation:**
```typescript
// src/lib/features/docker-discovery/index.ts
import type { Feature } from '../types';
import { discoverContainers } from './discovery';
import { dockerDiscoveryVarsSchema } from './meta';

// Default export for dynamic import
const dockerDiscovery: Feature = {
  name: 'docker-discovery',
  version: '1.0.0',

  async init(vars, pagesContent) {
    const config = dockerDiscoveryVarsSchema.parse(vars);

    // Discover containers
    const containers = await discoverContainers(config);

    // Convert to ServiceItem[]
    const serviceItems = containers.map(container => ({
      name: container.name,
      icon: 'docker',
      url: `http://localhost:${container.ports[0] || ''}`,
      // Could add widgets for monitoring
    }));

    // Inject into target page
    const targetPage = pagesContent.get(config.targetPage);
    if (!targetPage) {
      console.warn(`Target page not found: ${config.targetPage}`);
      return;
    }

    // Add new group or append to existing
    targetPage.services.push({
      name: config.groupName,
      icon: 'docker',
      items: serviceItems,
    });
  },
};

export default dockerDiscovery;
```

**Docker API logic:**
```typescript
// src/lib/features/docker-discovery/discovery.ts
import Docker from 'dockerode';
import type { DockerDiscoveryVars } from './meta';

interface DiscoveredContainer {
  name: string;
  image: string;
  ports: number[];
  labels: Record<string, string>;
}

export async function discoverContainers(
  config: DockerDiscoveryVars
): Promise<DiscoveredContainer[]> {
  const docker = new Docker({ socketPath: config.socket });

  const containers = await docker.listContainers();

  return containers
    .filter(container => {
      // Filter by label prefix
      const enableLabel = `${config.labelPrefix}.enable`;
      return container.Labels[enableLabel] === 'true';
    })
    .map(container => ({
      name: container.Names[0].replace(/^\//, ''),
      image: container.Image,
      ports: container.Ports.map(p => p.PublicPort).filter(Boolean),
      labels: container.Labels,
    }));
}
```

### Step 4: Update Server Initialization

**Modify `src/hooks.server.ts`:**
```typescript
import { loadFeatures } from '$lib/features/loader';
import { updateGadgetConfigs } from '$lib/gadgets/config-store'; // renamed

export const init: ServerInit = async () => {
  const settings = await loadSettings();
  const pagesContent = await loadAllPages(settings);
  const pagesList: Page[] = settings.pages || [
    { id: 'home', name: 'Home', icon: 'home', file: 'services.yaml' }
  ];

  // Extract widgets and gadgets
  const { widgets, statusChecks, serviceWidgetIds, statusCheckIds } =
    extractWidgets(pagesContent, pagesList);
  const { addons: gadgets, addonIds: gadgetIds } = extractAddons(settings);

  // NEW: Load features (can modify pagesContent)
  if (settings.features) {
    await loadFeatures(settings.features, pagesContent);
  }

  // Update stores
  updateWidgetConfigs(widgets);
  updateGadgetConfigs(gadgets);

  // Cache config
  setCachedConfig({
    settings,
    pagesContent,
    pagesList,
    widgetIds: serviceWidgetIds,
    statusIds: statusCheckIds,
    addonIds: gadgetIds, // Still called addonIds to avoid breaking frontend
  });
};
```

### Step 5: Update Config Schema

**Add features section to `src/lib/config/schema.ts`:**
```typescript
const featureConfigSchema = z.record(z.object({
  enabled: z.boolean().default(true),
  vars: z.record(z.unknown()).optional(),
}));

export const settingsSchema = z.object({
  // ... existing fields
  features: featureConfigSchema.optional(),
});
```

**Example config:**
```yaml
# config/settings.yaml
features:
  docker-discovery:
    enabled: true
    vars:
      socket: /var/run/docker.sock
      labelPrefix: liteda
      targetPage: home
      groupName: Docker Containers
```

### Step 6: Update Documentation

**CLAUDE.md updates:**

1. Rename section "Addon System" → "Gadget System"
2. Add new section "Features System"
3. Update all code examples
4. Document gadgets vs features distinction

**Key points to document:**
- **Gadgets**: Lightweight header components, always loaded
- **Features**: Heavy optional functionality, loaded at startup if enabled
- **Docker Discovery**: Auto-discovers containers with specific labels

## Testing Plan

### 1. Test Gadget Rename
- Start dev server
- Check header renders weather, resources, search correctly
- Check API calls to `/api/gadgets/weather?id=gadget-1`
- Check gadget config lookup works

### 2. Test Features System (without Docker)
- Add empty features config
- Verify server starts without errors
- Verify existing functionality unchanged

### 3. Test Docker Discovery
- Add Docker Discovery feature config
- Start server with Docker daemon running
- Create test containers with labels:
  ```bash
  docker run -d --label liteda.enable=true --name test-app nginx
  ```
- Verify containers appear in configured page/group
- Verify server handles Docker unavailable gracefully

### 4. Type Checking
- Run `bun run check`
- Verify no type errors

## Breaking Changes

### API Routes
- `/api/addons/weather` → `/api/gadgets/weather`
- `/api/addons/resources` → `/api/gadgets/resources`

**Mitigation**: Add redirect middleware or keep old routes for compatibility

### Internal Naming
- `AddonProps` → `GadgetProps`
- `createAddonHandler` → `createGadgetHandler`

**Impact**: Internal only, no user-facing breaking changes

### Config
- Settings schema adds optional `features` section
- Backward compatible (features are optional)

## Dependencies

New dependency needed:
```json
{
  "dockerode": "^4.0.0",
  "@types/dockerode": "^3.3.0"
}
```

## Files to Modify

### Rename/Move
- `src/lib/addons/` → `src/lib/gadgets/`
- `src/routes/api/addons/` → `src/routes/api/gadgets/`

### Create New
- `src/lib/features/types.ts`
- `src/lib/features/loader.ts`
- `src/lib/features/_template/`
- `src/lib/features/docker-discovery/`

### Modify
- `src/hooks.server.ts` - Add feature loading
- `src/lib/config/schema.ts` - Add features schema
- `src/lib/components/Bar.svelte` - Update imports
- `src/routes/+page.server.ts` - Update imports
- `src/routes/+page.svelte` - Update imports (if any)
- All gadget component files - Update API routes
- `CLAUDE.md` - Update documentation
- `package.json` - Add dockerode dependency

### Search and Replace
- `$lib/addons` → `$lib/gadgets`
- `/api/addons/` → `/api/gadgets/`
- `AddonProps` → `GadgetProps`
- `AddonConfig` → `GadgetConfig`
- `createAddonHandler` → `createGadgetHandler`
- `updateAddonConfigs` → `updateGadgetConfigs`
- `getAddonConfig` → `getGadgetConfig`

## Estimated Impact

- **Files to modify**: ~25 files
- **New files**: ~15 files
- **Breaking changes**: API routes (can add compatibility layer)
- **Risk level**: Medium (requires careful search/replace)
- **Benefits**: Clear separation of concerns, extensible for future features

## Alternative: Phased Approach

If too much at once:

### Phase 1 (Immediate)
- Just rename addons → gadgets
- Update documentation
- Test existing functionality

### Phase 2 (Next)
- Implement features system skeleton
- Add docker-discovery feature
- Test with real Docker containers
