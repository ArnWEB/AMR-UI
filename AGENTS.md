# AGENTS.md - Coding Guidelines for AMR-UI

## Build Commands

```bash
npm run dev      # Development server
npm run build    # Build for production (runs tsc -b && vite build)
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Technology Stack

- **Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7
- **State Management**: Zustand
- **Styling**: Tailwind CSS 3.4 + tailwindcss-animate
- **Visualization**: Konva.js (react-konva)
- **Icons**: lucide-react

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** - no implicit any, strict null checks
- **Path aliases**: Use `@/*` for imports from `src/` directory
- **ES Modules**: Project uses `type: "module"`
- **Unused variables**: Not allowed (enforced by tsconfig)

### Naming Conventions

```typescript
// Interfaces - PascalCase
interface SimulationState { }

// Types - PascalCase
type TaskStatus = 'pending' | 'active' | 'completed';

// Functions - camelCase
function findPath(start: string, end: string): Position[] { }
const updatePosition = (id: string, pos: Position) => { };

// Components - PascalCase
export const CenterMap: React.FC = () => { };
export const LeftPanel: React.FC<LeftPanelProps> = () => { };

// Constants - UPPER_SNAKE_CASE
const SAFETY_DISTANCE = 30;

// Variables - camelCase
const [isRunning, setIsRunning] = useState(false);

// Files - PascalCase for components, camelCase for utilities
// CenterMap.tsx, useSimulationStore.ts, pathfinding.ts
```

### Import Patterns

```typescript
// React imports first
import { useEffect, useState } from 'react';

// Third-party libraries
import { create } from 'zustand';

// Absolute imports with @ alias (preferred)
import { useSimulationStore } from '@/store/useSimulationStore';
import { AMR, Position } from '@/types';

// Relative imports only when necessary
import { Component } from '../components/Component';
```

### Component Structure

```typescript
interface MainLayoutProps {
    leftPanel: React.ReactNode;
    centerPanel: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ leftPanel, centerPanel }) => {
    return (
        <div className="flex h-screen">
            {/* Semantic HTML with Tailwind classes */}
        </div>
    );
};
```

### Tailwind CSS Usage

- Use Tailwind utility classes exclusively (no inline styles)
- Custom theme colors in `tailwind.config.js`:
  - `bg-primary`, `text-primary-foreground`
  - `bg-secondary`, `bg-muted`
  - `border-border`, `bg-card`
- State variants: `hover:bg-accent`, `disabled:opacity-50`
- Conditional classes using template literals

### State Management (Zustand)

```typescript
interface StoreState {
    isRunning: boolean;
    amrs: AMR[];
    toggleSimulation: () => void;
    updatePosition: (id: string, pos: Position) => void;
}

export const useStore = create<StoreState>((set, get) => ({
    isRunning: false,
    amrs: [],
    toggleSimulation: () => set((state) => ({ isRunning: !state.isRunning })),
    updatePosition: (id, position) => {
        const currentState = get();
        set({ amrs: updatedAmrs });
    }
}));
```

### Error Handling

```typescript
// Type guards for null checks
const amr = state.amrs.find(a => a.id === id);
if (!amr) return; // Early return pattern

// Optional chaining
const task = amr?.currentTask;

// Avoid throwing errors in UI logic
const path = findPath(start, end);
if (path.length === 0) {
    get().addLog('Path not found', 'error');
    return;
}

// Type assertions when necessary
const element = e.target as HTMLDivElement;
```

### Type Definitions

```typescript
// Interface for object shapes
interface AMR {
    id: string;
    status: 'idle' | 'moving' | 'error';
    position: Position;
    currentTask?: string;
}

// Type for unions/aliases
type TaskStatus = 'pending' | 'active' | 'completed';

// Export types used across files
export interface Cargo {
    id: string;
    weight: number;
}
```

### File Organization

```
src/
  components/
    layout/          # Layout components
    dashboard/       # Feature-specific components
  store/             # Zustand stores
  types/             # TypeScript definitions
  utils/             # Pure utility functions
  data/              # Static data/configs
  lib/               # Shared utilities
  App.tsx            # Root component
  main.tsx           # Entry point
```

### Comments & Documentation

```typescript
// Use comments for complex logic only
// Phase 2: Performance metrics
const metrics = calculateMetrics();

// Avoid redundant comments
const x = 10; // This is x (BAD)
```

## Linting Rules

ESLint configuration enforces:
- TypeScript recommended rules
- React Hooks rules (exhaustive-deps)
- React Refresh rules
- No unused variables/locals
- No fallthrough in switch statements

Always run `npm run lint` before committing to catch style issues.

## Key Patterns

1. **Always use `@/` aliases** for imports from src/
2. **Functional components** with React.FC type
3. **Strict TypeScript** - no implicit any
4. **Zustand for state** - avoid prop drilling
5. **Tailwind for styling** - no CSS modules
6. **Early returns** for null checks
7. **Export types** that cross module boundaries
8. **PascalCase files** for components
