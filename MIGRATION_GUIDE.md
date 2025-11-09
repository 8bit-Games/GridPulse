# GridPulse Modernization Migration Guide

## Phase 1: Foundation Setup - COMPLETED

### What Has Been Set Up

1. **Package Management (npm)**
   - ✅ Created `package.json` with dependencies and scripts
   - ✅ Configured for ES modules (`"type": "module"`)

2. **Build System (Vite)**
   - ✅ Created `vite.config.js` for fast bundling
   - ✅ Configured development server on port 3000
   - ✅ Set up path aliases (@/ for src, @assets/ for assets)

3. **Code Quality Tools**
   - ✅ Created `.eslintrc.json` for code linting
   - ✅ Created `.prettierrc.json` for code formatting
   - ✅ Created `.prettierignore` to exclude legacy code

4. **TypeScript Configuration**
   - ✅ Created `tsconfig.json` with strict type checking
   - ✅ Configured for modern ES2020 features
   - ✅ Set up for incremental migration (JavaScript allowed)

5. **Git Configuration**
   - ✅ Updated `.gitignore` for node_modules and build artifacts

### Available npm Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint on source files
npm run format      # Format code with Prettier
npm run type-check  # Type check TypeScript files
```

---

## Next Steps: Installation & Project Restructuring

### Step 1: Install Dependencies

Before you can use the modern build system, install the npm packages:

```bash
cd /home/user/GridPulse
npm install
```

This will install:
- **Three.js** (latest version) - Replaces old libs/Three.dev.js
- **Vite** - Modern build tool
- **TypeScript** - For gradual migration
- **ESLint & Prettier** - Code quality tools

**Note:** The old `libs/Three.dev.js` will remain for backward compatibility during migration.

### Step 2: Project Restructuring Options

We have **two migration approaches**:

#### Option A: Gradual Migration (Recommended)
Keep the current structure working while building the new system in parallel.

**Current Structure:**
```
GridPulse/
├── index.html (old - still works)
├── bkcore/gridpulse/ (old namespace)
├── libs/ (old libraries)
└── [other legacy files]
```

**New Structure (side-by-side):**
```
GridPulse/
├── index.html (old - still works)
├── index-modern.html (new Vite entry point)
├── src/
│   ├── main.ts (new entry point)
│   ├── core/
│   │   ├── GridPulse.ts (migrated from bkcore/gridpulse/GridPulse.js)
│   │   ├── ShipControls.ts
│   │   ├── Gameplay.ts
│   │   └── ... (other core files)
│   ├── rendering/
│   │   ├── CameraChase.ts
│   │   ├── HUD.ts
│   │   └── effects/
│   ├── physics/
│   ├── audio/
│   ├── input/
│   │   ├── TouchController.ts
│   │   ├── GamepadController.ts
│   │   └── OrientationController.ts
│   └── tracks/
│       └── Cityscape.ts
├── bkcore/ (legacy - keep for now)
└── libs/ (legacy - keep for now)
```

**Advantages:**
- Old version keeps working
- Can migrate file-by-file
- Easy rollback if issues occur
- Test both versions side-by-side

#### Option B: Complete Restructure (Aggressive)
Replace the old structure entirely.

**Advantages:**
- Clean slate
- No legacy code confusion
- Forces complete modernization

**Disadvantages:**
- Higher risk
- All-or-nothing approach
- Harder to debug issues

---

## Recommended Migration Path

### Phase 1A: Parallel Development (Recommended Next)

1. **Create Modern Entry Point**
   ```bash
   mkdir -p src/core src/rendering src/input src/tracks
   ```

2. **Create `src/main.ts`** - New application entry point
   ```typescript
   import * as THREE from 'three';
   import { GridPulse } from './core/GridPulse';

   // Initialize game
   const game = new GridPulse({...});
   ```

3. **Migrate Core Files One-by-One**
   - Start with GridPulse.js → GridPulse.ts
   - Convert to ES6 modules
   - Add TypeScript types
   - Test functionality

4. **Create `index-modern.html`**
   - Vite entry point
   - References `src/main.ts`
   - Modern module loading

5. **Update Vite Config**
   - Point to new structure
   - Configure asset handling

### Phase 1B: Dependencies Update

1. **Replace Three.js**
   - Import from npm package instead of libs/Three.dev.js
   - Update to latest API (r160)
   - Fix breaking changes

2. **Remove Legacy Libraries**
   - Stats.js → npm package
   - Other libs → npm equivalents

### Phase 1C: Module System Migration

Convert from global namespace to ES6 modules:

**Before (Global Namespace):**
```javascript
bkcore.gridpulse.GridPulse = function(opts) {
  // ...
};
```

**After (ES6 Module):**
```typescript
export class GridPulse {
  constructor(opts: GridPulseOptions) {
    // ...
  }
}
```

---

## Testing Strategy

1. **Keep Old Version Working**
   - `index.html` + old code = working baseline
   - Can always fall back if needed

2. **Test Modern Version**
   - `npm run dev` starts new version
   - Test side-by-side
   - Compare functionality

3. **Gradual Cutover**
   - Once modern version is stable
   - Rename `index.html` → `index-legacy.html`
   - Rename `index-modern.html` → `index.html`
   - Archive legacy code

---

## File Migration Checklist

### Core Game Engine
- [ ] `bkcore/gridpulse/GridPulse.js` → `src/core/GridPulse.ts`
- [ ] `bkcore/gridpulse/Gameplay.js` → `src/core/Gameplay.ts`
- [ ] `bkcore/gridpulse/ShipControls.js` → `src/physics/ShipControls.ts`
- [ ] `bkcore/gridpulse/RaceData.js` → `src/core/RaceData.ts`

### Rendering
- [ ] `bkcore/gridpulse/CameraChase.js` → `src/rendering/CameraChase.ts`
- [ ] `bkcore/gridpulse/HUD.js` → `src/rendering/HUD.ts`
- [ ] `bkcore/gridpulse/ShipEffects.js` → `src/rendering/ShipEffects.ts`
- [ ] `bkcore/threejs/RenderManager.js` → `src/rendering/RenderManager.ts`
- [ ] `bkcore/threejs/Shaders.js` → `src/rendering/Shaders.ts`
- [ ] `bkcore/threejs/Particles.js` → `src/rendering/Particles.ts`

### Input Controllers
- [ ] `bkcore.coffee/controllers/TouchController.js` → `src/input/TouchController.ts`
- [ ] `bkcore.coffee/controllers/GamepadController.js` → `src/input/GamepadController.ts`
- [ ] `bkcore.coffee/controllers/OrientationController.js` → `src/input/OrientationController.ts`

### Utilities
- [ ] `bkcore.coffee/Utils.js` → `src/utils/Utils.ts`
- [ ] `bkcore.coffee/Timer.js` → `src/utils/Timer.ts`
- [ ] `bkcore.coffee/ImageData.js` → `src/utils/ImageData.ts`

### Audio
- [ ] `bkcore/Audio.js` → `src/audio/AudioManager.ts`

### Tracks
- [ ] `bkcore/gridpulse/tracks/Cityscape.js` → `src/tracks/Cityscape.ts`

### Entry Point
- [ ] `launch.js` → `src/main.ts` (completely rewritten)

---

## Breaking Changes to Address

### 1. Three.js API Changes (r53 → r160)

**Geometry → BufferGeometry**
```javascript
// Old
const geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3(x, y, z));

// New
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array([x, y, z]);
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
```

**Materials**
- Some material properties changed
- Shader uniforms access changed

**Lights**
- Shadow system updated
- Some light parameters changed

### 2. Module Loading

**Old (Global Scripts):**
```html
<script src="libs/Three.dev.js"></script>
<script src="bkcore/gridpulse/GridPulse.js"></script>
```

**New (ES6 Imports):**
```typescript
import * as THREE from 'three';
import { GridPulse } from './core/GridPulse';
```

### 3. Asset Loading

**Old:**
```javascript
var loader = new THREE.JSONLoader();
loader.load('geometries/ship.js', callback);
```

**New:**
```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
const loader = new GLTFLoader();
await loader.loadAsync('geometries/ship.gltf');
```

---

## Timeline Estimate

- **npm install**: 2-5 minutes
- **Create src/ structure**: 30 minutes
- **Migrate first file (GridPulse.ts)**: 2-3 hours
- **Migrate all core files**: 1-2 days
- **Update Three.js API usage**: 1-2 days
- **Test and debug**: 1-2 days
- **Total Phase 1**: 4-7 days

---

## Decision Point

**Which approach do you want to take?**

1. **Option A: Gradual (Recommended)**
   - Keep old system working
   - Build new system in `src/`
   - Migrate file-by-file
   - Lower risk

2. **Option B: Complete Restructure**
   - Full modernization immediately
   - No legacy code
   - Higher risk, faster completion

**Let me know which you prefer, and I'll proceed with the next steps!**
