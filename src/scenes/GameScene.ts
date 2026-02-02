import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { Room } from '../rooms/Room';
import { AISystem } from '../systems/AISystem';
import { SuspicionSystem } from '../systems/SuspicionSystem';
import { MaskSystem } from '../systems/MaskSystem';
import { TimerSystem } from '../systems/TimerSystem';
import { ClueSystem } from '../systems/ClueSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { TouchInputState } from '../systems/TouchControls';
import { RoomId, GameState, Position } from '../types';
import {
  TILE_SIZE, ROOM_WIDTH, ROOM_HEIGHT, GAME_TIME_SECONDS
} from '../config/GameConfig';
import { NPC_DATA } from '../data/NPCData';

export class GameScene extends Phaser.Scene {
  public player!: Player;
  public npcs: NPC[] = [];
  public corpses: Phaser.GameObjects.Sprite[] = [];
  public rooms: Map<RoomId, Room> = new Map();
  public currentRoom!: Room;

  public aiSystem!: AISystem;
  public suspicionSystem!: SuspicionSystem;
  public maskSystem!: MaskSystem;
  public timerSystem!: TimerSystem;
  public clueSystem!: ClueSystem;
  public combatSystem!: CombatSystem;

  public gameState!: GameState;

  // Touch input received from UIScene
  private touchInput: TouchInputState | undefined;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private killKey!: Phaser.Input.Keyboard.Key;
  private sneakKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(): void {
    // Reset state when scene starts/restarts
    this.npcs = [];
    this.corpses = [];
    this.rooms = new Map();
  }

  create(): void {
    // Initialize game state
    this.gameState = {
      currentRoom: 'ballroom',
      targetId: null,
      discoveredClues: [],
      suspicionLevel: 0,
      timeRemaining: GAME_TIME_SECONDS,
      isGameOver: false,
      hasWon: false,
      hasIdentifiedTarget: false
    };

    // Create rooms
    this.createRooms();

    // Set up current room
    this.currentRoom = this.rooms.get('ballroom')!;
    this.currentRoom.show();

    // Create player
    this.player = new Player(this, ROOM_WIDTH * TILE_SIZE / 2, ROOM_HEIGHT * TILE_SIZE / 2);
    this.events.emit('player-created');

    // Set up collision for current room
    this.physics.add.collider(this.player.sprite, this.currentRoom['collisionBodies']);

    // Initialize systems
    this.maskSystem = new MaskSystem(this);
    this.clueSystem = new ClueSystem(this);
    this.suspicionSystem = new SuspicionSystem(this);
    this.aiSystem = new AISystem(this);
    this.timerSystem = new TimerSystem(this);
    this.combatSystem = new CombatSystem(this);

    // Select random target
    this.maskSystem.selectRandomTarget();

    // Create NPCs
    this.createNPCs();

    // Set up input
    this.setupInput();

    // Set up camera
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
    this.cameras.main.setZoom(1.5);

    // Start UI scene
    this.scene.launch('UIScene', { gameScene: this });

    // Fade in
    this.cameras.main.fadeIn(500);

    // Start timer
    this.timerSystem.start();
  }

  update(_time: number, delta: number): void {
    if (this.gameState.isGameOver) return;

    // Update player with keyboard and touch input
    this.player.update({
      cursors: this.cursors,
      wasd: this.wasd,
      sneakKey: this.sneakKey,
      touchInput: this.touchInput
    });

    // Update systems
    this.aiSystem.update(delta);
    this.suspicionSystem.update(delta);
    this.timerSystem.update(delta);

    // Handle interactions (keyboard only, touch is handled by callbacks)
    this.handleInteractions();
  }

  private createRooms(): void {
    const roomIds: RoomId[] = ['ballroom', 'garden', 'library', 'cellar'];

    roomIds.forEach(id => {
      const room = new Room(this, id);
      this.rooms.set(id, room);
      room.hide();
    });
  }

  private createNPCs(): void {
    const npcDataList = NPC_DATA;
    const roomNPCCounts: Record<RoomId, number> = {
      ballroom: 0,
      garden: 0,
      library: 0,
      cellar: 0
    };

    npcDataList.forEach((data) => {
      const room = this.rooms.get(data.frequentedRoom)!;
      const spawnPoints = room.getSpawnPoints();
      const spawnIndex = roomNPCCounts[data.frequentedRoom] % spawnPoints.length;
      const spawnPoint = spawnPoints[spawnIndex];

      const npc = new NPC(this, spawnPoint.x, spawnPoint.y, data);
      npc.currentRoom = data.frequentedRoom;

      // Hide if not in current room
      if (data.frequentedRoom !== this.gameState.currentRoom) {
        npc.hide();
      }

      this.npcs.push(npc);
      roomNPCCounts[data.frequentedRoom]++;
    });
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.killKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.sneakKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    // Prevent tab from switching focus
    this.input.keyboard!.addCapture(Phaser.Input.Keyboard.KeyCodes.TAB);
  }

  // Called by UIScene to update touch input state
  public setTouchInput(input: TouchInputState | undefined): void {
    this.touchInput = input;
  }

  // Called by UIScene touch buttons
  public handleTouchInteract(): void {
    const nearbyNPC = this.getNearbyNPC();
    if (nearbyNPC && nearbyNPC.isAlive) {
      this.startDialogue(nearbyNPC);
    } else {
      this.checkDoorInteraction();
    }
  }

  public handleTouchAttack(): void {
    const nearbyNPC = this.getNearbyNPC();
    if (nearbyNPC && nearbyNPC.isAlive) {
      this.combatSystem.attemptKill(nearbyNPC);
    }
  }

  private handleInteractions(): void {
    // Interact with NPC (E key)
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      const nearbyNPC = this.getNearbyNPC();
      if (nearbyNPC && nearbyNPC.isAlive) {
        this.startDialogue(nearbyNPC);
      } else {
        // Check for door interaction
        this.checkDoorInteraction();
      }
    }

    // Kill attempt (Q key)
    if (Phaser.Input.Keyboard.JustDown(this.killKey)) {
      const nearbyNPC = this.getNearbyNPC();
      if (nearbyNPC && nearbyNPC.isAlive) {
        this.combatSystem.attemptKill(nearbyNPC);
      }
    }

    // Inventory (Tab key)
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.events.emit('toggleInventory');
    }
  }

  private getNearbyNPC(): NPC | null {
    const interactDistance = TILE_SIZE * 1.5;

    for (const npc of this.npcs) {
      if (npc.currentRoom !== this.gameState.currentRoom) continue;
      if (!npc.isAlive) continue;

      const distance = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        npc.sprite.x, npc.sprite.y
      );

      if (distance < interactDistance) {
        return npc;
      }
    }

    return null;
  }

  private checkDoorInteraction(): void {
    const doors = this.currentRoom.getDoors();
    const interactDistance = TILE_SIZE * 1.5;

    for (const door of doors) {
      const distance = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        door.x, door.y
      );

      if (distance < interactDistance) {
        this.transitionToRoom(door.targetRoom, door.spawnPosition);
        break;
      }
    }
  }

  public transitionToRoom(targetRoomId: RoomId, spawnPosition: Position): void {
    // Fade out
    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.time.delayedCall(300, () => {
      // Hide current room and NPCs
      this.currentRoom.hide();
      this.npcs.forEach(npc => {
        if (npc.currentRoom === this.gameState.currentRoom) {
          npc.hide();
        }
      });

      // Update current room
      this.gameState.currentRoom = targetRoomId;
      this.currentRoom = this.rooms.get(targetRoomId)!;
      this.currentRoom.show();

      // Move player
      this.player.sprite.setPosition(spawnPosition.x, spawnPosition.y);

      // Show NPCs in new room
      this.npcs.forEach(npc => {
        if (npc.currentRoom === targetRoomId) {
          npc.show();
        }
      });

      // Fade in
      this.cameras.main.fadeIn(300);
    });
  }

  public startDialogue(npc: NPC): void {
    this.player.freeze();
    this.events.emit('hideTouchControls');
    this.scene.launch('DialogueScene', {
      gameScene: this,
      npc: npc
    });
    this.scene.pause();
  }

  public endDialogue(): void {
    this.scene.resume();
    this.player.unfreeze();
    this.events.emit('showTouchControls');
  }

  public gameOver(won: boolean, reason: string): void {
    this.gameState.isGameOver = true;
    this.gameState.hasWon = won;
    this.timerSystem.stop();

    this.time.delayedCall(500, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        won: won,
        reason: reason,
        timeRemaining: this.gameState.timeRemaining
      });
    });
  }

  public addCorpse(x: number, y: number): void {
    const corpse = this.add.sprite(x, y, 'corpse');
    this.corpses.push(corpse);
  }

  shutdown(): void {
    // Clean up NPCs
    this.npcs.forEach(npc => {
      npc.sprite.destroy();
      npc.alertIcon?.destroy();
    });

    // Clean up corpses
    this.corpses.forEach(corpse => corpse.destroy());

    // Clean up rooms (they have graphics objects)
    this.rooms.forEach(room => {
      room.hide();
    });

    // Stop systems
    this.timerSystem?.stop();

    // Remove all physics
    this.physics.world.shutdown();
  }
}
