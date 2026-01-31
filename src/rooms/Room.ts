import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { RoomId, Position } from '../types';
import { TILE_SIZE, ROOM_WIDTH, ROOM_HEIGHT } from '../config/GameConfig';

// Room-specific decoration configurations
const ROOM_DECORATIONS: Record<RoomId, { items: string[]; count: number }> = {
  ballroom: {
    items: ['item_chair1', 'item_chair2', 'item_candle1', 'item_candle2'],
    count: 6
  },
  garden: {
    items: ['item_bush', 'item_crate'],
    count: 4
  },
  library: {
    items: ['item_bookcase1', 'item_bookcase2', 'item_bookcase3', 'item_books', 'item_chair1'],
    count: 8
  },
  cellar: {
    items: ['item_bottle1', 'item_bottle2', 'item_bottle3', 'item_crate', 'item_candle1'],
    count: 6
  }
};

interface DoorData {
  x: number;
  y: number;
  targetRoom: RoomId;
  spawnPosition: Position;
}

// Floor colors for each room
const FLOOR_COLORS: Record<RoomId, number> = {
  ballroom: 0x8b5a2b,  // Wooden brown
  garden: 0x355e3b,    // Green grass
  library: 0x722f37,   // Red carpet
  cellar: 0x4a4a4a     // Stone gray
};

export class Room {
  public id: RoomId;
  private scene: GameScene;
  private floor: Phaser.GameObjects.Graphics;
  private walls: Phaser.GameObjects.Graphics;
  private doors: DoorData[] = [];
  // Clock is now part of decorations as a graphics object
  private decorations: Phaser.GameObjects.GameObject[] = [];
  private collisionBodies: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: GameScene, id: RoomId) {
    this.scene = scene;
    this.id = id;

    // Create collision group
    this.collisionBodies = scene.physics.add.staticGroup();

    // Create floor using Graphics (more reliable than TileSprite)
    this.floor = scene.add.graphics();
    this.createFloor();

    // Create walls
    this.walls = scene.add.graphics();
    this.createWalls();

    // Set up room-specific elements
    this.setupRoomLayout();
  }

  private createFloor(): void {
    const floorColor = FLOOR_COLORS[this.id];
    const roomWidth = ROOM_WIDTH * TILE_SIZE;
    const roomHeight = ROOM_HEIGHT * TILE_SIZE;

    this.floor.fillStyle(floorColor);
    this.floor.fillRect(0, 0, roomWidth, roomHeight);

    // Add some visual pattern based on room type
    if (this.id === 'ballroom') {
      // Wooden floor lines
      this.floor.lineStyle(1, 0x6b4423);
      for (let y = 0; y < roomHeight; y += TILE_SIZE) {
        this.floor.lineBetween(0, y, roomWidth, y);
      }
    } else if (this.id === 'garden') {
      // Grass texture dots
      this.floor.fillStyle(0x3d6b44);
      for (let x = TILE_SIZE; x < roomWidth - TILE_SIZE; x += TILE_SIZE * 2) {
        for (let y = TILE_SIZE; y < roomHeight - TILE_SIZE; y += TILE_SIZE * 2) {
          this.floor.fillRect(x + 4, y + 4, 8, 8);
        }
      }
    } else if (this.id === 'library') {
      // Carpet border pattern
      this.floor.lineStyle(2, 0x5a252c);
      this.floor.strokeRect(TILE_SIZE * 2, TILE_SIZE * 2,
        roomWidth - TILE_SIZE * 4, roomHeight - TILE_SIZE * 4);
    }

    this.floor.setDepth(0);
  }

  private createWalls(): void {
    this.walls.fillStyle(0x5c4033);
    this.walls.lineStyle(2, 0x3d2817);

    const wallThickness = TILE_SIZE;
    const roomWidth = ROOM_WIDTH * TILE_SIZE;
    const roomHeight = ROOM_HEIGHT * TILE_SIZE;

    // Top wall
    this.walls.fillRect(0, 0, roomWidth, wallThickness);
    this.createCollisionRect(0, 0, roomWidth, wallThickness);

    // Bottom wall
    this.walls.fillRect(0, roomHeight - wallThickness, roomWidth, wallThickness);
    this.createCollisionRect(0, roomHeight - wallThickness, roomWidth, wallThickness);

    // Left wall
    this.walls.fillRect(0, 0, wallThickness, roomHeight);
    this.createCollisionRect(0, 0, wallThickness, roomHeight);

    // Right wall
    this.walls.fillRect(roomWidth - wallThickness, 0, wallThickness, roomHeight);
    this.createCollisionRect(roomWidth - wallThickness, 0, wallThickness, roomHeight);

    this.walls.setDepth(1);
  }

  private createCollisionRect(x: number, y: number, width: number, height: number): void {
    const rect = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height);
    this.scene.physics.add.existing(rect, true);
    this.collisionBodies.add(rect);
    rect.setVisible(false);
  }

  private setupRoomLayout(): void {
    switch (this.id) {
      case 'ballroom':
        this.setupBallroom();
        break;
      case 'garden':
        this.setupGarden();
        break;
      case 'library':
        this.setupLibrary();
        break;
      case 'cellar':
        this.setupCellar();
        break;
    }

    // Set up collision with player after player is created
    this.scene.events.once('player-created', () => {
      if (this.scene.player) {
        this.scene.physics.add.collider(this.scene.player.sprite, this.collisionBodies);
      }
    });
  }

  private setupBallroom(): void {
    const centerX = ROOM_WIDTH * TILE_SIZE / 2;
    const centerY = ROOM_HEIGHT * TILE_SIZE / 2;

    // Decorative floor pattern in center (chandelier shadow)
    const pattern = this.scene.add.graphics();
    pattern.lineStyle(2, 0x6b4423);
    pattern.strokeCircle(centerX, centerY, 80);
    pattern.strokeCircle(centerX, centerY, 60);
    pattern.setDepth(0.5);
    this.decorations.push(pattern);

    // Doors
    this.doors = [
      { // To Garden (top)
        x: centerX,
        y: TILE_SIZE * 1.5,
        targetRoom: 'garden',
        spawnPosition: { x: ROOM_WIDTH * TILE_SIZE / 2, y: (ROOM_HEIGHT - 2) * TILE_SIZE }
      },
      { // To Library (left)
        x: TILE_SIZE * 1.5,
        y: centerY,
        targetRoom: 'library',
        spawnPosition: { x: (ROOM_WIDTH - 2) * TILE_SIZE, y: ROOM_HEIGHT * TILE_SIZE / 2 }
      },
      { // To Cellar (bottom)
        x: centerX,
        y: (ROOM_HEIGHT - 1.5) * TILE_SIZE,
        targetRoom: 'cellar',
        spawnPosition: { x: ROOM_WIDTH * TILE_SIZE / 2, y: TILE_SIZE * 2 }
      }
    ];

    this.createDoorVisuals();
    this.placeRandomDecorations();
  }

  private setupGarden(): void {
    // Fountain in center
    const centerX = ROOM_WIDTH * TILE_SIZE / 2;
    const centerY = ROOM_HEIGHT * TILE_SIZE / 2;

    const fountain = this.scene.add.graphics();
    fountain.fillStyle(0x4682b4);
    fountain.fillCircle(centerX, centerY, 40);
    fountain.fillStyle(0x87ceeb);
    fountain.fillCircle(centerX, centerY, 30);
    fountain.setDepth(0.5);
    this.decorations.push(fountain);

    // Hedges
    const hedge = this.scene.add.graphics();
    hedge.fillStyle(0x228b22);
    hedge.fillRect(TILE_SIZE * 3, TILE_SIZE * 3, TILE_SIZE * 3, TILE_SIZE);
    hedge.fillRect(ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 6, TILE_SIZE * 3, TILE_SIZE * 3, TILE_SIZE);
    hedge.setDepth(1);
    this.decorations.push(hedge);

    // Door back to ballroom
    this.doors = [
      {
        x: ROOM_WIDTH * TILE_SIZE / 2,
        y: (ROOM_HEIGHT - 1.5) * TILE_SIZE,
        targetRoom: 'ballroom',
        spawnPosition: { x: ROOM_WIDTH * TILE_SIZE / 2, y: TILE_SIZE * 2 }
      }
    ];

    this.createDoorVisuals();
    this.placeRandomDecorations();
  }

  private setupLibrary(): void {
    // Bookshelves along walls
    const shelves = this.scene.add.graphics();
    shelves.fillStyle(0x8b4513);

    // Left shelves
    shelves.fillRect(TILE_SIZE * 2, TILE_SIZE * 2, TILE_SIZE * 2, TILE_SIZE * 6);
    this.createCollisionRect(TILE_SIZE * 2, TILE_SIZE * 2, TILE_SIZE * 2, TILE_SIZE * 6);

    // Right shelves
    shelves.fillRect(ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 4, TILE_SIZE * 2, TILE_SIZE * 2, TILE_SIZE * 6);
    this.createCollisionRect(ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 4, TILE_SIZE * 2, TILE_SIZE * 2, TILE_SIZE * 6);

    // Book colors
    const bookColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffd700, 0x8844ff];
    for (let i = 0; i < 10; i++) {
      shelves.fillStyle(bookColors[i % bookColors.length]);
      shelves.fillRect(
        TILE_SIZE * 2.2 + (i % 3) * 15,
        TILE_SIZE * 2.5 + Math.floor(i / 3) * 50,
        10, 40
      );
    }

    shelves.setDepth(1);
    this.decorations.push(shelves);

    // Reading desk
    const desk = this.scene.add.graphics();
    desk.fillStyle(0x654321);
    desk.fillRect(ROOM_WIDTH * TILE_SIZE / 2 - 40, ROOM_HEIGHT * TILE_SIZE / 2 - 20, 80, 40);
    desk.setDepth(0.5);
    this.decorations.push(desk);

    // Door back to ballroom
    this.doors = [
      {
        x: (ROOM_WIDTH - 1.5) * TILE_SIZE,
        y: ROOM_HEIGHT * TILE_SIZE / 2,
        targetRoom: 'ballroom',
        spawnPosition: { x: TILE_SIZE * 2, y: ROOM_HEIGHT * TILE_SIZE / 2 }
      }
    ];

    this.createDoorVisuals();
    this.placeRandomDecorations();
  }

  private setupCellar(): void {
    // Darker atmosphere - tint the floor
    this.floor.fillStyle(0x333333, 0.3);
    this.floor.fillRect(0, 0, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);

    // Wine barrels
    const barrels = this.scene.add.graphics();
    barrels.fillStyle(0x8b4513);

    const barrelPositions = [
      { x: TILE_SIZE * 3, y: TILE_SIZE * 3 },
      { x: TILE_SIZE * 5, y: TILE_SIZE * 3 },
      { x: TILE_SIZE * 3, y: TILE_SIZE * 6 },
      { x: ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 5, y: TILE_SIZE * 5 }
    ];

    barrelPositions.forEach(pos => {
      barrels.fillCircle(pos.x, pos.y, 20);
      barrels.lineStyle(2, 0x5c3317);
      barrels.strokeCircle(pos.x, pos.y, 20);
      this.createCollisionRect(pos.x - 20, pos.y - 20, 40, 40);
    });

    barrels.setDepth(1);
    this.decorations.push(barrels);

    // Crates
    const crates = this.scene.add.graphics();
    crates.fillStyle(0x654321);
    crates.fillRect(ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 4, TILE_SIZE * 10, TILE_SIZE * 2, TILE_SIZE * 2);
    this.createCollisionRect(ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 4, TILE_SIZE * 10, TILE_SIZE * 2, TILE_SIZE * 2);
    crates.setDepth(1);
    this.decorations.push(crates);

    // Secret stairway back to ballroom
    this.doors = [
      {
        x: ROOM_WIDTH * TILE_SIZE / 2,
        y: TILE_SIZE * 1.5,
        targetRoom: 'ballroom',
        spawnPosition: { x: ROOM_WIDTH * TILE_SIZE / 2, y: (ROOM_HEIGHT - 2) * TILE_SIZE }
      }
    ];

    this.createDoorVisuals();
    this.placeRandomDecorations();
  }

  private createDoorVisuals(): void {
    this.doors.forEach(door => {
      // Create door as graphics since texture might not be ready
      const doorGraphic = this.scene.add.graphics();
      doorGraphic.fillStyle(0x8b4513);
      doorGraphic.fillRect(door.x - 12, door.y - 16, 24, 32);
      doorGraphic.fillStyle(0xffd700);
      doorGraphic.fillCircle(door.x + 6, door.y, 3);
      doorGraphic.setDepth(2);
      this.decorations.push(doorGraphic);
    });
  }

  private placeRandomDecorations(): void {
    const config = ROOM_DECORATIONS[this.id];
    if (!config) return;

    const margin = TILE_SIZE * 2.5;
    const roomWidth = ROOM_WIDTH * TILE_SIZE;
    const roomHeight = ROOM_HEIGHT * TILE_SIZE;

    // Track placed positions to avoid overlap
    const placedPositions: { x: number; y: number; width: number; height: number }[] = [];

    // Also avoid door areas
    this.doors.forEach(door => {
      placedPositions.push({
        x: door.x - 40,
        y: door.y - 40,
        width: 80,
        height: 80
      });
    });

    for (let i = 0; i < config.count; i++) {
      const itemKey = config.items[Math.floor(Math.random() * config.items.length)];

      // Check if texture exists
      if (!this.scene.textures.exists(itemKey)) {
        continue;
      }

      // Try to find a valid position
      let attempts = 0;
      let placed = false;

      while (attempts < 20 && !placed) {
        attempts++;

        // Random position within room bounds
        const x = margin + Math.random() * (roomWidth - margin * 2);
        const y = margin + Math.random() * (roomHeight - margin * 2);

        // Get texture dimensions for collision check
        const texture = this.scene.textures.get(itemKey);
        const frame = texture.get();
        const itemWidth = frame.width;
        const itemHeight = frame.height;

        // Check for overlap with existing decorations
        let overlaps = false;
        for (const pos of placedPositions) {
          if (
            x < pos.x + pos.width + 10 &&
            x + itemWidth + 10 > pos.x &&
            y < pos.y + pos.height + 10 &&
            y + itemHeight + 10 > pos.y
          ) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          // Place the decoration
          const sprite = this.scene.add.sprite(x, y, itemKey);
          sprite.setOrigin(0, 0);
          sprite.setDepth(1);

          // Scale up small items for visibility
          if (itemWidth < 16) {
            sprite.setScale(2);
          } else if (itemWidth < 32) {
            sprite.setScale(1.5);
          }

          this.decorations.push(sprite);

          // Track position
          placedPositions.push({
            x,
            y,
            width: itemWidth * (sprite.scaleX || 1),
            height: itemHeight * (sprite.scaleY || 1)
          });

          // Add collision for larger items (bookcases, cabinets)
          if (itemKey.includes('bookcase') || itemKey.includes('cabinet') || itemKey.includes('couch')) {
            this.createCollisionRect(x, y, itemWidth, itemHeight);
          }

          placed = true;
        }
      }
    }
  }

  getDoors(): DoorData[] {
    return this.doors;
  }

  getSpawnPoints(): Position[] {
    const points: Position[] = [];
    const margin = TILE_SIZE * 3;
    const cols = 4;
    const rows = 3;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        points.push({
          x: margin + (i * (ROOM_WIDTH * TILE_SIZE - margin * 2) / (cols - 1)),
          y: margin + (j * (ROOM_HEIGHT * TILE_SIZE - margin * 2) / (rows - 1))
        });
      }
    }

    return points;
  }

  getWalkableBounds(): { x: number; y: number; width: number; height: number } {
    const margin = TILE_SIZE * 2;
    return {
      x: margin,
      y: margin,
      width: ROOM_WIDTH * TILE_SIZE - margin * 2,
      height: ROOM_HEIGHT * TILE_SIZE - margin * 2
    };
  }

  hide(): void {
    this.floor.setVisible(false);
    this.walls.setVisible(false);
    this.decorations.forEach(d => {
      if ('setVisible' in d) {
        (d as Phaser.GameObjects.Graphics).setVisible(false);
      }
    });
  }

  show(): void {
    this.floor.setVisible(true);
    this.walls.setVisible(true);
    this.decorations.forEach(d => {
      if ('setVisible' in d) {
        (d as Phaser.GameObjects.Graphics).setVisible(true);
      }
    });

    // Re-setup collision with player
    if (this.scene.player) {
      this.scene.physics.add.collider(this.scene.player.sprite, this.collisionBodies);
    }
  }
}
