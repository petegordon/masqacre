# Masqacre

A browser-based top-down assassination game set at a masquerade party. Blend in with the guests, gather clues about your target, and eliminate them before time runs out.

![Masqacre Gameplay](public/assets/screenshot.png)

## How to Play

You are an assassin attending a masquerade ball. Your mission: identify and eliminate your target before the clock strikes midnight.

### Controls

| Key | Action |
|-----|--------|
| **WASD** or **Arrow Keys** | Move |
| **E** | Talk to NPCs / Interact with doors |
| **Q** | Attack (when near an NPC) |
| **Shift** | Sneak (move quietly) |
| **Tab** | Toggle inventory |
| **ESC** | Exit dialogue |

### Gameplay Tips

- **Gather Clues**: Talk to guests to learn about your target's mask color, location, and behavior
- **Stay Inconspicuous**: Keep your suspicion meter low - getting caught acting suspiciously will raise alarms
- **Explore Rooms**: Visit the Ballroom, Garden, Library, and Cellar to find your target
- **Watch the Clock**: You have 5 minutes to complete your mission
- **Choose Wisely**: Some NPCs reveal more information than others based on their personality

## Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/petegordon/masqacre.git
cd masqacre

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

The built files will be in the `dist/` directory.

## Tech Stack

- **[Phaser 3](https://phaser.io/)** - Game framework for rendering, physics, and input handling
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[EasyStar.js](https://easystarjs.com/)** - Pathfinding library for NPC movement

## Project Structure

```
masqacre/
├── public/
│   └── assets/          # Game assets (sprites, characters)
├── src/
│   ├── config/          # Game configuration
│   ├── data/            # NPC data and dialogue (JSON)
│   ├── entities/        # Player and NPC classes
│   ├── rooms/           # Room generation and layout
│   ├── scenes/          # Phaser scenes (Menu, Game, UI, Dialogue)
│   ├── systems/         # Game systems (AI, Suspicion, Combat, etc.)
│   └── types/           # TypeScript type definitions
└── index.html
```

## License

MIT
