GridPulse
=========

A futuristic HTML5 racing game built with WebGL technology.

GridPulse is a high-performance 3D browser-based racing game featuring time attack and survival modes.

## About

GridPulse is derived from [HexGL](http://hexgl.bkcore.com), originally created by [Thibaut Despoulain (BKcore)](http://bkcore.com).

This project has been rebranded and is being developed as a separate entity with modernization efforts and new features.

## License

GridPulse's code and resources are licensed under the *MIT License* (see LICENSE file).

**Original Work Attribution:**
- Original Project: HexGL
- Original Author: Thibaut Despoulain
- Copyright (c) 2015 Thibaut Despoulain
- Licensed under MIT License

## Installation

### Legacy Version (Current)

	cd ~/
	git clone [repository-url]
	cd GridPulse
	python -m http.server

Then open http://localhost:8000 in your browser.

To use full size textures, swap the two textures/ and textures.full/ directories.

### Modern Development Setup (In Progress)

GridPulse is being modernized with a modern build system. To use the development version:

```bash
cd GridPulse
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
```

**Note:** The modern build system is currently in Phase 1 setup. See `MIGRATION_GUIDE.md` for details.

## Features

- WebGL-powered 3D graphics
- Multiple control schemes: keyboard, touch, gamepad, device orientation
- Time Attack and Survival game modes
- Replay system
- Quality settings for different devices
- Offline play support
- 3D spatial audio

## Development

This project is actively being modernized and improved. Contributions are welcome!

### Modernization Status

GridPulse is undergoing a comprehensive modernization effort:

**✅ Phase 1: Foundation - IN PROGRESS**
- Modern build system (Vite)
- Package management (npm)
- Code quality tools (ESLint, Prettier)
- TypeScript support
- ES6 module system

**📋 Upcoming Phases:**
- Phase 2: Three.js update (r53 → r160+)
- Phase 3: TypeScript migration
- Phase 4: Performance optimizations
- Phase 5+: New features (multiplayer, level editor, enhanced graphics)

See `MODERNIZATION_PLAN.md` for the complete roadmap and `MIGRATION_GUIDE.md` for technical details.

### Contributing

Contributions are welcome! Areas where help is needed:
- Visual assets creation (see `REBRANDING_ASSETS.md`)
- Code modernization (see `MIGRATION_GUIDE.md`)
- Bug fixes and testing
- Documentation improvements

### Development Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Lint code
npm run format      # Format code
npm run type-check  # Type check TypeScript
```
