# EasePM Project - Claude Code Integration

## Project Overview

EasePM is an Electron-based project management application built with Vue 3, TypeScript, and Quasar Framework.

## Project Structure

```
project/
├── electron/                  # Electron main process code
│   ├── main/                 # Main process logic
│   ├── preload/              # Preload scripts
│   ├── entity/               # TypeORM entities
│   └── migration/            # Database migrations
├── src/                      # Vue frontend code
│   ├── components/           # Vue components
│   ├── pages/                # Page components
│   ├── types/                # TypeScript types
│   └── util/                 # Utility functions
├── public/                   # Static assets
├── dist/                     # Build output
└── release/                  # Release builds
```

## Development Commands

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Electron development
npm run electron:dev

# Create release build
npm run electron:build
```

## Key Technologies

- **Frontend**: Vue 3, TypeScript, Quasar Framework
- **Backend**: Electron, TypeORM, SQLite
- **Build**: Vite, electron-builder

## Important Notes

- Follow existing code conventions and patterns
- Use TypeScript for type safety
- Follow Vue 3 Composition API patterns
- Maintain consistent styling with Quasar components