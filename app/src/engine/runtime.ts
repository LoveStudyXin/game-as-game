// ============================================================================
// Game-as-Game-Engine: Phaser 3 Runtime
// Takes a GameConfig JSON and creates a fully playable game using
// geometric shapes and color blocks -- NO sprites or image assets.
// ============================================================================

import * as Phaser from 'phaser';
import type {
  GameConfig,
  EntityDef,
  ComponentDef,
} from './types';
import { getMutationById } from './chaos/mutations';
import type { Mutation } from './chaos/mutations';

// ---------------------------------------------------------------------------
// Callback Interface
// ---------------------------------------------------------------------------

export interface RuntimeCallbacks {
  onScoreChange?: (score: number) => void;
  onHealthChange?: (health: number, maxHealth: number) => void;
  onNarrativeEvent?: (text: string) => void;
  onMutationActivated?: (name: string) => void;
  onMutationDeactivated?: (name: string) => void;
  onGameOver?: (score: number) => void;
  onLevelComplete?: (score: number) => void;
}

// ---------------------------------------------------------------------------
// Runtime Handle (returned to the caller)
// ---------------------------------------------------------------------------

export interface RuntimeHandle {
  destroy: () => void;
  pause: () => void;
  resume: () => void;
  getScore: () => number;
}

// ---------------------------------------------------------------------------
// Helper: find a component by type on an EntityDef
// ---------------------------------------------------------------------------

function findComponent(entity: EntityDef, type: string): ComponentDef | undefined {
  return entity.components.find((c) => c.type === type);
}

function getComponentConfig<T = Record<string, unknown>>(
  entity: EntityDef,
  type: string,
): T | undefined {
  const comp = findComponent(entity, type);
  return comp ? (comp.config as unknown as T) : undefined;
}

// ---------------------------------------------------------------------------
// Helper: convert hex color string to Phaser numeric color
// ---------------------------------------------------------------------------

function hexToNum(hex: string): number {
  const clean = hex.replace('#', '');
  return parseInt(clean, 16);
}

// ---------------------------------------------------------------------------
// Helper: seeded PRNG (simple mulberry32)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Active Mutation Tracker
// ---------------------------------------------------------------------------

interface ActiveMutation {
  mutation: Mutation;
  activatedAt: number;
  revertTimer?: Phaser.Time.TimerEvent;
}

// ---------------------------------------------------------------------------
// Entity Runtime Data (attached to Phaser GameObjects via .setData)
// ---------------------------------------------------------------------------

interface EnemyData {
  entityDef: EntityDef;
  hp: number;
  maxHp: number;
  patrolOriginX: number;
  patrolOriginY: number;
  patrolDir: number;
  lastFireTime: number;
}

// ---------------------------------------------------------------------------
// Main Game Scene
// ---------------------------------------------------------------------------

class MainScene extends Phaser.Scene {
  // Config
  private config!: GameConfig;
  private callbacks!: RuntimeCallbacks;
  private rng!: () => number;

  // Player
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private playerHealth = 3;
  private playerMaxHealth = 3;
  private playerInvincible = false;
  private playerFacing: 'left' | 'right' = 'right';
  private jumpCount = 0;
  private maxJumps = 2;
  private jumpForce = -480;
  private moveSpeed = 260;
  private lastDashTime = 0;
  private dashCooldown = 800;
  private dashSpeed = 600;
  private dashInvincibilityMs = 300;
  private lastBuildTime = 0;
  private buildCooldown = 1200;
  private maxBlocks = 5;
  private placedBlocks = 0;
  private lastShootTime = 0;
  private shootCooldown = 250;
  private bulletSpeed = 600;
  private bulletColor = '#FF5252';

  // Score
  private score = 0;

  // Groups
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private movingPlatforms!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private playerProjectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private buildBlocks!: Phaser.Physics.Arcade.StaticGroup;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private actionKeys!: Record<string, Phaser.Input.Keyboard.Key>;
  private controlsSwapped = false;

  // Gravity / physics state
  private baseGravityY = 800;
  private shiftingGravityTimer?: Phaser.Time.TimerEvent;

  // Chaos system
  private activeMutations: ActiveMutation[] = [];
  private chaosTimer?: Phaser.Time.TimerEvent;
  private chaosState: Record<string, unknown> = {};

  // Narrative
  private narrativeOverlay?: Phaser.GameObjects.Text;
  private triggeredNarrativeIds = new Set<string>();

  // Game state
  private gameOver = false;
  private levelComplete = false;
  private gameStartTime = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: { config: GameConfig; callbacks: RuntimeCallbacks }) {
    if (!data || !data.config) {
      console.error('[MainScene] init() called without config data. Ensure scene is started with data.');
      return;
    }
    this.config = data.config;
    this.callbacks = data.callbacks;
    this.rng = mulberry32(this.config.internalSeed);
  }

  // =========================================================================
  // CREATE
  // =========================================================================

  create(): void {
    if (!this.config) {
      console.error('[MainScene] create() called but config is not set. Scene cannot start.');
      return;
    }
    this.gameStartTime = this.time.now;
    this.gameOver = false;
    this.levelComplete = false;
    this.score = 0;
    this.activeMutations = [];
    this.chaosState = {};
    this.triggeredNarrativeIds.clear();

    const { world } = this.config;

    // -- World bounds --
    this.physics.world.setBounds(0, 0, world.width, world.height);

    // -- Gravity --
    this.setupGravity();

    // -- Create groups --
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    this.collectibles = this.physics.add.group({ allowGravity: false });
    this.playerProjectiles = this.physics.add.group({ allowGravity: false });
    this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
    this.buildBlocks = this.physics.add.staticGroup();

    // -- Render all entities --
    this.renderEntities();

    // -- Collisions --
    this.setupCollisions();

    // -- Input --
    this.setupInput();

    // -- Camera --
    this.setupCamera();

    // -- Boundary --
    this.setupBoundary();

    // -- Special physics --
    this.applySpecialPhysics();

    // -- Chaos timer --
    this.setupChaos();

    // -- Visual style post-processing --
    this.applyVisualStyle();

    // -- Initial narrative --
    this.triggerNarrativeByTrigger('game_start');

    // -- Notify initial state --
    this.callbacks.onScoreChange?.(this.score);
    this.callbacks.onHealthChange?.(this.playerHealth, this.playerMaxHealth);
  }

  // =========================================================================
  // VISUAL STYLE POST-PROCESSING
  // =========================================================================

  private applyVisualStyle(): void {
    const style = this.config.visualStyle || 'pixel';

    switch (style) {
      case 'neon': {
        // Add glow effect via CSS filter on the canvas
        if (this.game.canvas) {
          this.game.canvas.style.filter = 'contrast(1.1) brightness(1.05)';
        }
        // Add neon glow border overlay to player
        if (this.player) {
          this.player.setStrokeStyle(2, 0x00ffff);
        }
        break;
      }
      case 'minimal': {
        // Softer, cleaner look
        if (this.game.canvas) {
          this.game.canvas.style.filter = 'saturate(0.7) brightness(1.1)';
        }
        if (this.player) {
          this.player.setStrokeStyle(1, 0x666666);
        }
        break;
      }
      case 'watercolor': {
        // Warm, soft feel
        if (this.game.canvas) {
          this.game.canvas.style.filter = 'saturate(0.9) blur(0.3px) brightness(1.05)';
        }
        if (this.player) {
          this.player.setStrokeStyle(0);
        }
        break;
      }
      case 'retro_crt': {
        // Scanline + green tint
        if (this.game.canvas) {
          this.game.canvas.style.filter = 'contrast(1.2) brightness(0.95) saturate(1.3)';
        }
        if (this.player) {
          this.player.setStrokeStyle(1, 0x00ff00);
        }
        break;
      }
      case 'pixel':
      default:
        // Default pixel style -- sharp edges, already set
        break;
    }
  }

  // =========================================================================
  // GRAVITY
  // =========================================================================

  private setupGravity(): void {
    const mode = this.config.world.gravity;
    switch (mode) {
      case 'normal':
        this.baseGravityY = 800;
        break;
      case 'low':
        this.baseGravityY = 300;
        break;
      case 'reverse':
        this.baseGravityY = -800;
        break;
      case 'shifting':
        this.baseGravityY = 800;
        this.shiftingGravityTimer = this.time.addEvent({
          delay: 5000,
          loop: true,
          callback: () => {
            this.baseGravityY = -this.baseGravityY;
            this.physics.world.gravity.y = this.baseGravityY;
          },
        });
        break;
    }
    this.physics.world.gravity.y = this.baseGravityY;
  }

  // =========================================================================
  // RENDER ENTITIES
  // =========================================================================

  private renderEntities(): void {
    for (const entity of this.config.entities) {
      switch (entity.type) {
        case 'player':
          this.renderPlayer(entity);
          break;
        case 'platform':
          this.renderPlatform(entity);
          break;
        case 'enemy':
        case 'enemy_patrol':
        case 'enemy_chaser':
        case 'enemy_shooter':
        case 'enemy_bouncer':
          this.renderEnemy(entity);
          break;
        case 'collectible':
          this.renderCollectible(entity);
          break;
        default:
          // Unknown entity type -- try rendering as a generic platform
          this.renderPlatform(entity);
          break;
      }
    }
  }

  // -- Player ---------------------------------------------------------------

  private renderPlayer(entity: EntityDef): void {
    const color = hexToNum(entity.color);

    // Main player rectangle
    this.player = this.add.rectangle(entity.x, entity.y, entity.width, entity.height, color);
    this.player.setStrokeStyle(2, 0xffffff);
    this.physics.add.existing(this.player);

    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(this.config.world.boundary === 'walled');
    this.playerBody.setBounce(0.1, 0.1);
    this.playerBody.setMaxVelocity(500, 800);

    // Parse player components for runtime config
    const healthComp = getComponentConfig<{ current: number; max: number }>(entity, 'health');
    if (healthComp) {
      this.playerHealth = healthComp.current;
      this.playerMaxHealth = healthComp.max;
    }

    const jumpComp = getComponentConfig<{ jumpForce: number; maxJumps: number }>(entity, 'jump');
    if (jumpComp) {
      this.jumpForce = -(jumpComp.jumpForce * 40);
      this.maxJumps = jumpComp.maxJumps;
    }

    const controllerComp = getComponentConfig<{ moveSpeed: number }>(entity, 'playerController');
    if (controllerComp) {
      this.moveSpeed = controllerComp.moveSpeed * 52;
    }

    const shooterComp = getComponentConfig<{ fireRate: number; bulletSpeed: number; bulletColor: string }>(entity, 'shooter');
    if (shooterComp) {
      this.shootCooldown = 1000 / shooterComp.fireRate;
      this.bulletSpeed = shooterComp.bulletSpeed * 60;
      this.bulletColor = shooterComp.bulletColor;
    }

    const dodgerComp = getComponentConfig<{ dashSpeed: number; dashCooldown: number; invincibilityMs: number }>(entity, 'dodger');
    if (dodgerComp) {
      this.dashSpeed = dodgerComp.dashSpeed * 35;
      this.dashCooldown = dodgerComp.dashCooldown;
      this.dashInvincibilityMs = dodgerComp.invincibilityMs;
    }

    const builderComp = getComponentConfig<{ buildCooldown: number; maxBlocks: number }>(entity, 'builder');
    if (builderComp) {
      this.buildCooldown = builderComp.buildCooldown;
      this.maxBlocks = builderComp.maxBlocks;
    }
  }

  // -- Platform -------------------------------------------------------------

  private renderPlatform(entity: EntityDef): void {
    const color = hexToNum(entity.color);
    const hasMoving = findComponent(entity, 'moving');

    if (hasMoving) {
      // Moving platform
      const rect = this.add.rectangle(entity.x, entity.y, entity.width, entity.height, color);
      rect.setStrokeStyle(1, 0x888888);
      this.physics.add.existing(rect);
      this.movingPlatforms.add(rect);

      const body = rect.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);
      body.setAllowGravity(false);

      const movingConfig = getComponentConfig<{ startX: number; startY: number; endX: number; endY: number; speed: number }>(entity, 'moving');
      if (movingConfig) {
        this.tweens.add({
          targets: rect,
          x: movingConfig.endX,
          y: movingConfig.endY,
          duration: (1 / Math.max(movingConfig.speed, 0.1)) * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onUpdate: () => {
            body.updateFromGameObject();
          },
        });
      }
    } else {
      // Static platform
      const rect = this.add.rectangle(entity.x, entity.y, entity.width, entity.height, color);
      rect.setStrokeStyle(1, 0x666666);
      this.platforms.add(rect);

      // Check for bouncy component
      const bouncyComp = findComponent(entity, 'bouncy');
      if (bouncyComp) {
        rect.setData('bouncy', true);
        const bouncyConfig = getComponentConfig<{ bounceForce: number }>(entity, 'bouncy');
        rect.setData('bounceForce', bouncyConfig?.bounceForce ?? 12);
      }
    }
  }

  // -- Enemy ----------------------------------------------------------------

  private renderEnemy(entity: EntityDef): void {
    const color = hexToNum(entity.color);
    const renderHint = getComponentConfig<{ shape: string }>(entity, 'renderHint');
    const shape = renderHint?.shape ?? 'rectangle';
    let gameObj: Phaser.GameObjects.Shape;

    switch (shape) {
      case 'circle':
        gameObj = this.add.circle(entity.x, entity.y, entity.width / 2, color);
        break;
      case 'triangle':
        gameObj = this.add.triangle(
          entity.x, entity.y,
          0, entity.height,
          entity.width / 2, 0,
          entity.width, entity.height,
          color,
        );
        break;
      case 'diamond': {
        // Diamond = rotated square using a Graphics-based approach
        const gfx = this.add.graphics();
        const hw = entity.width / 2;
        const hh = entity.height / 2;
        gfx.fillStyle(color, 1);
        gfx.fillPoints([
          new Phaser.Geom.Point(entity.x, entity.y - hh),
          new Phaser.Geom.Point(entity.x + hw, entity.y),
          new Phaser.Geom.Point(entity.x, entity.y + hh),
          new Phaser.Geom.Point(entity.x - hw, entity.y),
        ], true);
        // For physics, we still need a rectangle wrapper
        gameObj = this.add.rectangle(entity.x, entity.y, entity.width, entity.height, color);
        gameObj.setAlpha(0); // hide the rectangle
        gfx.setData('parentObj', gameObj);
        gameObj.setData('diamondGfx', gfx);
        break;
      }
      default:
        gameObj = this.add.rectangle(entity.x, entity.y, entity.width, entity.height, color);
        (gameObj as Phaser.GameObjects.Rectangle).setStrokeStyle(1, 0x333333);
        break;
    }

    this.physics.add.existing(gameObj);
    this.enemies.add(gameObj);

    const body = gameObj.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setBounce(0.5, 0.5);

    // Set up the body size for non-rectangle shapes
    if (shape === 'circle' || shape === 'triangle' || shape === 'diamond') {
      body.setSize(entity.width, entity.height);
      body.setOffset(
        shape === 'circle' ? -entity.width / 2 : 0,
        shape === 'circle' ? -entity.height / 2 : 0,
      );
    }

    // HP from health component
    const healthComp = getComponentConfig<{ current: number; max: number }>(entity, 'health');
    const hp = healthComp?.current ?? 1;
    const maxHp = healthComp?.max ?? hp;

    // Store enemy runtime data
    const enemyData: EnemyData = {
      entityDef: entity,
      hp,
      maxHp,
      patrolOriginX: entity.x,
      patrolOriginY: entity.y,
      patrolDir: 1,
      lastFireTime: 0,
    };
    gameObj.setData('enemyData', enemyData);

    // Set initial velocity for bouncers
    const bouncerComp = getComponentConfig<{ bounceSpeed: number; bounceAngleVariance: number }>(entity, 'bouncer');
    if (bouncerComp) {
      const angle = this.rng() * Math.PI * 2;
      body.setVelocity(
        Math.cos(angle) * bouncerComp.bounceSpeed * 60,
        Math.sin(angle) * bouncerComp.bounceSpeed * 60,
      );
      body.setBounce(1, 1);
      body.setAllowGravity(false);
    }

    // Set patrol velocity
    const patrolComp = getComponentConfig<{ patrolDistance: number; speed: number; direction: string }>(entity, 'patrol');
    if (patrolComp) {
      const speed = patrolComp.speed * 60;
      if (patrolComp.direction === 'horizontal') {
        body.setVelocityX(speed);
      } else {
        body.setVelocityY(speed);
        body.setAllowGravity(false);
      }
    }
  }

  // -- Collectible ----------------------------------------------------------

  private renderCollectible(entity: EntityDef): void {
    const color = hexToNum(entity.color);
    const size = Math.min(entity.width, entity.height);
    const radius = size / 2;

    // Glow effect (larger semi-transparent circle behind)
    const glow = this.add.circle(entity.x, entity.y, radius * 2, color, 0.2);

    // Main collectible shape
    const collectible = this.add.circle(entity.x, entity.y, radius, color);
    this.physics.add.existing(collectible);
    this.collectibles.add(collectible);

    const body = collectible.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(radius);
    body.setOffset(-radius, -radius);

    // Gentle float animation
    this.tweens.add({
      targets: [collectible, glow],
      y: entity.y - 6,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Glow pulse
    this.tweens.add({
      targets: glow,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const collectConfig = getComponentConfig<{ scoreValue?: number; healAmount?: number }>(entity, 'collectible');
    collectible.setData('scoreValue', collectConfig?.scoreValue ?? 10);
    collectible.setData('healAmount', collectConfig?.healAmount ?? 0);
    collectible.setData('glow', glow);
  }

  // =========================================================================
  // COLLISIONS
  // =========================================================================

  private setupCollisions(): void {
    // Player stands on platforms
    this.physics.add.collider(this.player, this.platforms, this.onPlayerPlatformCollide, undefined, this);
    this.physics.add.collider(this.player, this.movingPlatforms, this.onPlayerPlatformCollide, undefined, this);
    this.physics.add.collider(this.player, this.buildBlocks);

    // Enemies stand on platforms
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.movingPlatforms);

    // Player-Enemy overlap
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemyCollide as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    // Player-Collectible overlap
    this.physics.add.overlap(this.player, this.collectibles, this.onPlayerCollectibleCollide as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    // Player projectiles hit enemies
    this.physics.add.overlap(this.playerProjectiles, this.enemies, this.onProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

    // Enemy projectiles hit player
    this.physics.add.overlap(this.enemyProjectiles, this.player, this.onEnemyProjectileHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  private onPlayerPlatformCollide: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    _player,
    platform,
  ) => {
    const platformObj = platform as Phaser.GameObjects.Rectangle;
    // Reset jump count when landing
    if (this.playerBody.touching.down || this.playerBody.blocked.down) {
      this.jumpCount = 0;
    }

    // Bouncy platform
    if (platformObj.getData('bouncy') && this.playerBody.touching.down) {
      const force = (platformObj.getData('bounceForce') as number) ?? 12;
      this.playerBody.setVelocityY(-(force * 60));
    }
  };

  private onPlayerEnemyCollide(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.playerInvincible || this.gameOver) return;

    // Flash player red
    this.player.setFillStyle(0xff0000);
    this.time.delayedCall(200, () => {
      if (this.player && this.player.active) {
        const playerEntity = this.config.entities.find((e) => e.type === 'player');
        this.player.setFillStyle(hexToNum(playerEntity?.color ?? '#ffffff'));
      }
    });

    // Knockback
    const enemy = enemyObj as Phaser.GameObjects.Shape;
    const dx = this.player.x - enemy.x;
    const knockDir = dx >= 0 ? 1 : -1;
    this.playerBody.setVelocity(knockDir * 250, -200);

    // Reduce health
    this.playerHealth -= 1;
    this.callbacks.onHealthChange?.(this.playerHealth, this.playerMaxHealth);

    // Brief invincibility
    this.playerInvincible = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        if (this.player && this.player.active) {
          this.player.setAlpha(1);
        }
        this.playerInvincible = false;
      },
    });

    if (this.playerHealth <= 0) {
      this.triggerGameOver();
    }
  }

  private onPlayerCollectibleCollide(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    collectibleObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.gameOver) return;
    const collectible = collectibleObj as Phaser.GameObjects.Arc;

    const scoreValue = (collectible.getData('scoreValue') as number) ?? 10;
    const healAmount = (collectible.getData('healAmount') as number) ?? 0;
    const glow = collectible.getData('glow') as Phaser.GameObjects.Arc | undefined;

    // Score
    this.score += scoreValue;
    this.callbacks.onScoreChange?.(this.score);

    // Heal
    if (healAmount > 0) {
      this.playerHealth = Math.min(this.playerHealth + healAmount, this.playerMaxHealth);
      this.callbacks.onHealthChange?.(this.playerHealth, this.playerMaxHealth);
    }

    // Particle-like effect: burst of small circles
    this.createCollectParticles(collectible.x, collectible.y, collectible.fillColor);

    // Destroy
    if (glow) glow.destroy();
    collectible.destroy();

    // Narrative check
    this.triggerNarrativeByTrigger('collectible_picked');

    // Check for level complete (all collectibles gathered)
    if (this.collectibles.countActive() === 0) {
      this.triggerNarrativeByTrigger('all_collected');
      // Simple level complete condition
      if (this.config.verbs.includes('collect')) {
        this.triggerLevelComplete();
      }
    }
  }

  private onProjectileHitEnemy(
    projectileObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const projectile = projectileObj as Phaser.GameObjects.Rectangle;
    const enemy = enemyObj as Phaser.GameObjects.Shape;
    const data = enemy.getData('enemyData') as EnemyData | undefined;

    projectile.destroy();

    if (!data) {
      enemy.destroy();
      this.score += 25;
      this.callbacks.onScoreChange?.(this.score);
      return;
    }

    data.hp -= 1;
    // Flash white
    enemy.setAlpha(0.5);
    this.time.delayedCall(100, () => {
      if (enemy.active) enemy.setAlpha(1);
    });

    if (data.hp <= 0) {
      // Destroy diamond graphics if present
      const gfx = enemy.getData('diamondGfx') as Phaser.GameObjects.Graphics | undefined;
      if (gfx) gfx.destroy();
      enemy.destroy();
      this.score += 25;
      this.callbacks.onScoreChange?.(this.score);
      this.triggerNarrativeByTrigger('enemy_killed');
    }
  }

  private onEnemyProjectileHitPlayer(
    projectileObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.playerInvincible || this.gameOver) return;
    const projectile = projectileObj as Phaser.GameObjects.Rectangle;
    projectile.destroy();

    this.playerHealth -= 1;
    this.callbacks.onHealthChange?.(this.playerHealth, this.playerMaxHealth);

    // Flash red
    this.player.setFillStyle(0xff0000);
    this.time.delayedCall(200, () => {
      if (this.player && this.player.active) {
        const playerEntity = this.config.entities.find((e) => e.type === 'player');
        this.player.setFillStyle(hexToNum(playerEntity?.color ?? '#ffffff'));
      }
    });

    if (this.playerHealth <= 0) {
      this.triggerGameOver();
    }
  }

  // =========================================================================
  // INPUT
  // =========================================================================

  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.actionKeys = {
      shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      dodge: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      build: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
      jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  // =========================================================================
  // CAMERA
  // =========================================================================

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, this.config.world.width, this.config.world.height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 50);
  }

  // =========================================================================
  // BOUNDARY
  // =========================================================================

  private setupBoundary(): void {
    // 'walled' is handled by collideWorldBounds on the player body
    // 'loop' is handled in update()
    // 'infinite' just removes camera bounds
    if (this.config.world.boundary === 'infinite') {
      this.cameras.main.removeBounds();
      this.physics.world.setBounds(-10000, -10000, 20000, 20000);
    }
  }

  // =========================================================================
  // SPECIAL PHYSICS
  // =========================================================================

  private applySpecialPhysics(): void {
    switch (this.config.world.specialPhysics) {
      case 'elastic':
        this.playerBody.setBounce(0.8, 0.6);
        break;
      case 'slippery':
        this.playerBody.setDrag(50, 0);
        break;
      case 'sticky':
        this.playerBody.setDrag(800, 0);
        break;
    }
  }

  // =========================================================================
  // CHAOS SYSTEM
  // =========================================================================

  private setupChaos(): void {
    if (this.config.chaos.level <= 0) return;
    if (this.config.chaos.mutationFrequencyMs <= 0) return;

    this.chaosTimer = this.time.addEvent({
      delay: this.config.chaos.mutationFrequencyMs,
      loop: true,
      callback: () => this.triggerChaosMutation(),
    });
  }

  private triggerChaosMutation(): void {
    if (this.gameOver) return;

    const { chaos } = this.config;
    // Respect max active mutations
    if (this.activeMutations.length >= chaos.maxActiveMutations) return;

    // Pick a random mutation from the config's mutation list
    const activeIds = new Set(this.activeMutations.map((am) => am.mutation.id));
    const available = chaos.mutations.filter((id) => !activeIds.has(id));
    if (available.length === 0) return;

    const pickedId = available[Math.floor(this.rng() * available.length)];
    const mutation = getMutationById(pickedId);
    if (!mutation) return;

    // Apply the mutation
    this.applyMutation(mutation);
  }

  private applyMutation(mutation: Mutation): void {
    // Apply to chaos state
    mutation.apply(this.chaosState);

    // Apply runtime effects
    this.applyMutationEffect(mutation.id);

    this.callbacks.onMutationActivated?.(mutation.name);

    const activeMut: ActiveMutation = {
      mutation,
      activatedAt: this.time.now,
    };

    // Schedule auto-revert if mutation has a duration
    if (mutation.duration > 0) {
      activeMut.revertTimer = this.time.addEvent({
        delay: mutation.duration,
        callback: () => this.revertMutation(mutation),
      });
    }

    this.activeMutations.push(activeMut);
  }

  private revertMutation(mutation: Mutation): void {
    mutation.revert(this.chaosState);
    this.revertMutationEffect(mutation.id);
    this.activeMutations = this.activeMutations.filter((am) => am.mutation.id !== mutation.id);
    this.callbacks.onMutationDeactivated?.(mutation.name);
  }

  private applyMutationEffect(id: string): void {
    switch (id) {
      case 'gravity_flip':
        this.physics.world.gravity.y = -this.physics.world.gravity.y;
        break;
      case 'gravity_float':
        this.physics.world.gravity.y = 50;
        break;
      case 'color_invert':
        if (this.game.canvas.parentElement) {
          this.game.canvas.style.filter = 'invert(1)';
        }
        break;
      case 'mirror_world':
        if (this.game.canvas.parentElement) {
          this.game.canvas.style.transform = 'scaleX(-1)';
        }
        break;
      case 'size_shift':
        this.tweens.add({
          targets: this.player,
          scaleX: 0.6 + this.rng() * 1.8,
          scaleY: 0.6 + this.rng() * 1.8,
          duration: 2000,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.easeInOut',
        });
        break;
      case 'friction_ice':
        this.playerBody.setDrag(10, 0);
        break;
      case 'friction_honey':
        this.playerBody.setDrag(2000, 0);
        this.playerBody.setMaxVelocity(150, 400);
        break;
      case 'bounce_extreme':
        this.playerBody.setBounce(1.5, 1.5);
        break;
      case 'time_warp':
        this.time.timeScale = 0.5;
        this.tweens.add({
          targets: this.time,
          timeScale: 2.0,
          duration: 4000,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.easeInOut',
        });
        break;
      case 'score_reverse':
        // Handled via chaosState.scoreMultiplier in scoring logic
        break;
      case 'controls_swap':
        this.controlsSwapped = true;
        break;
      case 'platform_moving':
        // Add tweens to all static platforms
        this.platforms.getChildren().forEach((child) => {
          const plat = child as Phaser.GameObjects.Rectangle;
          this.tweens.add({
            targets: plat,
            x: plat.x + (this.rng() - 0.5) * 160,
            duration: 2000 + this.rng() * 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        });
        break;
      case 'enemy_multiply': {
        // Duplicate up to 3 existing enemies
        const existingEnemies = this.enemies.getChildren().slice(0, 3);
        existingEnemies.forEach((child) => {
          const enemy = child as Phaser.GameObjects.Shape;
          const data = enemy.getData('enemyData') as EnemyData | undefined;
          if (data) {
            const clone = this.add.rectangle(
              enemy.x + (this.rng() - 0.5) * 100,
              enemy.y - 50,
              data.entityDef.width,
              data.entityDef.height,
              hexToNum(data.entityDef.color),
            );
            this.physics.add.existing(clone);
            this.enemies.add(clone);
            const cloneData: EnemyData = {
              ...data,
              hp: data.maxHp,
              patrolOriginX: clone.x,
              patrolOriginY: clone.y,
            };
            clone.setData('enemyData', cloneData);
          }
        });
        break;
      }
      case 'collectible_scatter':
        this.collectibles.getChildren().forEach((child) => {
          const col = child as Phaser.GameObjects.Arc;
          this.tweens.add({
            targets: col,
            x: 50 + this.rng() * (this.config.world.width - 100),
            y: 50 + this.rng() * (this.config.world.height - 100),
            duration: 1000,
            ease: 'Back.easeOut',
          });
        });
        break;
      case 'background_shift': {
        const newColor = Phaser.Display.Color.RandomRGB();
        this.cameras.main.setBackgroundColor(newColor.color);
        break;
      }
    }
  }

  private revertMutationEffect(id: string): void {
    switch (id) {
      case 'gravity_flip':
        this.physics.world.gravity.y = this.baseGravityY;
        break;
      case 'gravity_float':
        this.physics.world.gravity.y = this.baseGravityY;
        break;
      case 'color_invert':
        this.game.canvas.style.filter = '';
        break;
      case 'mirror_world':
        this.game.canvas.style.transform = '';
        break;
      case 'friction_ice':
      case 'friction_honey':
        this.applySpecialPhysics(); // Restore original
        this.playerBody.setMaxVelocity(500, 800);
        break;
      case 'bounce_extreme':
        this.applySpecialPhysics();
        break;
      case 'time_warp':
        this.time.timeScale = 1;
        break;
      case 'controls_swap':
        this.controlsSwapped = false;
        break;
      case 'background_shift':
        this.cameras.main.setBackgroundColor(this.config.world.backgroundColor);
        break;
    }
  }

  // =========================================================================
  // NARRATIVE
  // =========================================================================

  private triggerNarrativeByTrigger(trigger: string): void {
    const event = this.config.narrative.events.find(
      (e) => e.trigger === trigger && !this.triggeredNarrativeIds.has(e.id),
    );
    if (!event) return;

    this.triggeredNarrativeIds.add(event.id);
    this.showNarrativeText(event.text);
    this.callbacks.onNarrativeEvent?.(event.text);
  }

  private showNarrativeText(text: string): void {
    if (this.narrativeOverlay) {
      this.narrativeOverlay.destroy();
    }

    const cam = this.cameras.main;
    this.narrativeOverlay = this.add.text(
      cam.scrollX + cam.width / 2,
      cam.scrollY + 60,
      text,
      {
        fontFamily: '"Press Start 2P", monospace, Arial',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 16, y: 12 },
        align: 'center',
        wordWrap: { width: 500 },
      },
    );
    this.narrativeOverlay.setOrigin(0.5, 0);
    this.narrativeOverlay.setScrollFactor(0);
    this.narrativeOverlay.setDepth(1000);

    // Fade in then out
    this.narrativeOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.narrativeOverlay,
      alpha: 1,
      duration: 500,
      hold: 3000,
      yoyo: true,
      onComplete: () => {
        if (this.narrativeOverlay) {
          this.narrativeOverlay.destroy();
          this.narrativeOverlay = undefined;
        }
      },
    });
  }

  // =========================================================================
  // PARTICLES (simple custom implementation)
  // =========================================================================

  private createCollectParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 3, color);
      const angle = (i / 8) * Math.PI * 2;
      const speed = 80 + this.rng() * 60;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 400 + this.rng() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  // =========================================================================
  // GAME OVER / LEVEL COMPLETE
  // =========================================================================

  private triggerGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    // Freeze physics
    this.physics.pause();

    // Fade player out
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 600,
      ease: 'Quad.easeOut',
    });

    // Show game over text
    const cam = this.cameras.main;
    const gameOverText = this.add.text(
      cam.scrollX + cam.width / 2,
      cam.scrollY + cam.height / 2,
      'GAME OVER',
      {
        fontFamily: '"Press Start 2P", monospace, Arial',
        fontSize: '32px',
        color: '#ff0000',
        backgroundColor: '#000000cc',
        padding: { x: 24, y: 16 },
      },
    );
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(2000);

    const scoreText = this.add.text(
      cam.scrollX + cam.width / 2,
      cam.scrollY + cam.height / 2 + 50,
      `Score: ${this.score}`,
      {
        fontFamily: '"Press Start 2P", monospace, Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 12, y: 8 },
      },
    );
    scoreText.setOrigin(0.5);
    scoreText.setScrollFactor(0);
    scoreText.setDepth(2000);

    this.callbacks.onGameOver?.(this.score);
  }

  private triggerLevelComplete(): void {
    if (this.levelComplete || this.gameOver) return;
    this.levelComplete = true;

    const cam = this.cameras.main;
    const completeText = this.add.text(
      cam.scrollX + cam.width / 2,
      cam.scrollY + cam.height / 2,
      'LEVEL COMPLETE!',
      {
        fontFamily: '"Press Start 2P", monospace, Arial',
        fontSize: '28px',
        color: '#00ff00',
        backgroundColor: '#000000cc',
        padding: { x: 24, y: 16 },
      },
    );
    completeText.setOrigin(0.5);
    completeText.setScrollFactor(0);
    completeText.setDepth(2000);

    this.callbacks.onLevelComplete?.(this.score);
  }

  // =========================================================================
  // UPDATE
  // =========================================================================

  update(time: number, delta: number): void {
    if (this.gameOver || this.levelComplete) return;

    this.handlePlayerMovement(delta);
    this.handleVerbInputs(time);
    this.updateEnemyAI(time, delta);
    this.updateProjectiles(delta);
    this.handleBoundaryWrap();
    this.updateDiamondGraphics();
    this.checkScoreNarrative();
  }

  // -- Player movement ------------------------------------------------------

  private handlePlayerMovement(_delta: number): void {
    if (!this.cursors || !this.wasd) return;

    let moveLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    let moveRight = this.cursors.right.isDown || this.wasd.right.isDown;

    // Controls swap mutation
    if (this.controlsSwapped) {
      const tmp = moveLeft;
      moveLeft = moveRight;
      moveRight = tmp;
    }

    if (moveLeft) {
      this.playerBody.setVelocityX(-this.moveSpeed);
      this.playerFacing = 'left';
    } else if (moveRight) {
      this.playerBody.setVelocityX(this.moveSpeed);
      this.playerFacing = 'right';
    } else {
      // Apply friction-based deceleration
      if (this.config.world.specialPhysics !== 'slippery') {
        this.playerBody.setVelocityX(this.playerBody.velocity.x * 0.85);
        if (Math.abs(this.playerBody.velocity.x) < 5) {
          this.playerBody.setVelocityX(0);
        }
      }
    }

    // Reset jump count when grounded
    if (this.playerBody.touching.down || this.playerBody.blocked.down) {
      this.jumpCount = 0;
    }
  }

  // -- Verb-specific inputs -------------------------------------------------

  private handleVerbInputs(time: number): void {
    const verbs = this.config.verbs;

    // Jump
    if (verbs.includes('jump')) {
      const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
        || Phaser.Input.Keyboard.JustDown(this.wasd.up)
        || Phaser.Input.Keyboard.JustDown(this.actionKeys.jump);

      if (jumpPressed && this.jumpCount < this.maxJumps) {
        this.playerBody.setVelocityY(this.jumpForce);
        this.jumpCount++;
      }
    }

    // Shoot
    if (verbs.includes('shoot')) {
      const shootPressed = this.actionKeys.shoot.isDown
        || (this.input.activePointer.isDown && this.input.activePointer.leftButtonDown());

      if (shootPressed && (time - this.lastShootTime) > this.shootCooldown) {
        this.lastShootTime = time;
        this.firePlayerProjectile();
      }
    }

    // Dodge
    if (verbs.includes('dodge')) {
      if (Phaser.Input.Keyboard.JustDown(this.actionKeys.dodge)
        && (time - this.lastDashTime) > this.dashCooldown) {
        this.lastDashTime = time;
        this.performDash();
      }
    }

    // Build
    if (verbs.includes('build')) {
      if (Phaser.Input.Keyboard.JustDown(this.actionKeys.build)
        && (time - this.lastBuildTime) > this.buildCooldown
        && this.placedBlocks < this.maxBlocks) {
        this.lastBuildTime = time;
        this.placeBlock();
      }
    }
  }

  private firePlayerProjectile(): void {
    const dirX = this.playerFacing === 'right' ? 1 : -1;
    const bx = this.player.x + dirX * 20;
    const by = this.player.y;

    const bullet = this.add.rectangle(bx, by, 10, 4, hexToNum(this.bulletColor));
    this.physics.add.existing(bullet);
    this.playerProjectiles.add(bullet);

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(dirX * this.bulletSpeed);

    // Auto-destroy after 2 seconds
    this.time.delayedCall(2000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  private performDash(): void {
    const dirX = this.playerFacing === 'right' ? 1 : -1;
    this.playerBody.setVelocityX(dirX * this.dashSpeed);

    // Brief invincibility during dash
    this.playerInvincible = true;
    this.player.setAlpha(0.5);
    this.time.delayedCall(this.dashInvincibilityMs, () => {
      this.playerInvincible = false;
      if (this.player && this.player.active) {
        this.player.setAlpha(1);
      }
    });
  }

  private placeBlock(): void {
    const dirX = this.playerFacing === 'right' ? 1 : -1;
    const bx = this.player.x + dirX * 40;
    const by = this.player.y + 20;

    const block = this.add.rectangle(bx, by, 32, 32, 0xff9100);
    block.setStrokeStyle(1, 0xcc7000);
    this.buildBlocks.add(block);
    this.placedBlocks++;

    // Fade in
    block.setAlpha(0);
    this.tweens.add({
      targets: block,
      alpha: 1,
      duration: 200,
    });
  }

  // -- Enemy AI -------------------------------------------------------------

  private updateEnemyAI(time: number, _delta: number): void {
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.GameObjects.Shape;
      if (!enemy.active) return;

      const data = enemy.getData('enemyData') as EnemyData | undefined;
      if (!data) return;

      const entity = data.entityDef;
      const body = enemy.body as Phaser.Physics.Arcade.Body;

      // Patrol AI
      const patrolComp = getComponentConfig<{ patrolDistance: number; speed: number; direction: string }>(entity, 'patrol');
      if (patrolComp) {
        const speed = patrolComp.speed * 60;
        const dist = patrolComp.patrolDistance;

        if (patrolComp.direction === 'horizontal') {
          if (enemy.x > data.patrolOriginX + dist) {
            data.patrolDir = -1;
          } else if (enemy.x < data.patrolOriginX - dist) {
            data.patrolDir = 1;
          }
          body.setVelocityX(speed * data.patrolDir);
        } else {
          if (enemy.y > data.patrolOriginY + dist) {
            data.patrolDir = -1;
          } else if (enemy.y < data.patrolOriginY - dist) {
            data.patrolDir = 1;
          }
          body.setVelocityY(speed * data.patrolDir);
        }
      }

      // Chaser AI
      const chaserComp = getComponentConfig<{ chaseSpeed: number; detectionRadius: number }>(entity, 'chaser');
      if (chaserComp && this.player && this.player.active) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < chaserComp.detectionRadius) {
          const speed = chaserComp.chaseSpeed * 60;
          const nx = dx / dist;
          const ny = dy / dist;
          body.setVelocityX(nx * speed);
          body.setVelocityY(ny * speed);
        }
      }

      // Shooter AI
      const shooterComp = getComponentConfig<{ fireRate: number; bulletSpeed: number; bulletColor: string; range: number }>(entity, 'enemyShooter');
      if (shooterComp && this.player && this.player.active) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < shooterComp.range) {
          const fireInterval = 1000 / shooterComp.fireRate;
          if (time - data.lastFireTime > fireInterval) {
            data.lastFireTime = time;
            this.fireEnemyProjectile(
              enemy.x,
              enemy.y,
              dx / dist,
              dy / dist,
              shooterComp.bulletSpeed * 60,
              shooterComp.bulletColor,
            );
          }
        }
      }

      // Bouncer AI - just maintain velocity and bounce off walls
      const bouncerComp = getComponentConfig<{ bounceSpeed: number }>(entity, 'bouncer');
      if (bouncerComp) {
        const speed = bouncerComp.bounceSpeed * 60;
        const vel = body.velocity;
        const currentSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        if (currentSpeed < speed * 0.5) {
          // Re-launch if too slow
          const angle = this.rng() * Math.PI * 2;
          body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
      }
    });
  }

  private fireEnemyProjectile(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    speed: number,
    color: string,
  ): void {
    const bullet = this.add.rectangle(x, y, 8, 8, hexToNum(color));
    this.physics.add.existing(bullet);
    this.enemyProjectiles.add(bullet);

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(dirX * speed, dirY * speed);

    // Auto-destroy after 3 seconds
    this.time.delayedCall(3000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  // -- Projectile cleanup ---------------------------------------------------

  private updateProjectiles(_delta: number): void {
    const bounds = this.physics.world.bounds;

    const cleanup = (group: Phaser.Physics.Arcade.Group) => {
      group.getChildren().forEach((child) => {
        const obj = child as Phaser.GameObjects.Rectangle;
        if (obj.x < bounds.x - 50 || obj.x > bounds.x + bounds.width + 50
          || obj.y < bounds.y - 50 || obj.y > bounds.y + bounds.height + 50) {
          obj.destroy();
        }
      });
    };

    cleanup(this.playerProjectiles);
    cleanup(this.enemyProjectiles);
  }

  // -- Boundary wrap --------------------------------------------------------

  private handleBoundaryWrap(): void {
    if (this.config.world.boundary !== 'loop') return;

    const { width, height } = this.config.world;

    // Player wrap
    if (this.player.x < 0) this.player.x = width;
    if (this.player.x > width) this.player.x = 0;
    if (this.player.y < 0) this.player.y = height;
    if (this.player.y > height) this.player.y = 0;

    // Enemy wrap
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.GameObjects.Shape;
      if (enemy.x < 0) enemy.x = width;
      if (enemy.x > width) enemy.x = 0;
      if (enemy.y < 0) enemy.y = height;
      if (enemy.y > height) enemy.y = 0;
    });
  }

  // -- Diamond graphics sync ------------------------------------------------

  private updateDiamondGraphics(): void {
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.GameObjects.Shape;
      const gfx = enemy.getData('diamondGfx') as Phaser.GameObjects.Graphics | undefined;
      if (gfx && enemy.active) {
        const data = enemy.getData('enemyData') as EnemyData;
        const hw = data.entityDef.width / 2;
        const hh = data.entityDef.height / 2;
        gfx.clear();
        gfx.fillStyle(hexToNum(data.entityDef.color), 1);
        gfx.fillPoints([
          new Phaser.Geom.Point(enemy.x, enemy.y - hh),
          new Phaser.Geom.Point(enemy.x + hw, enemy.y),
          new Phaser.Geom.Point(enemy.x, enemy.y + hh),
          new Phaser.Geom.Point(enemy.x - hw, enemy.y),
        ], true);
      }
    });
  }

  // -- Score-based narrative checks -----------------------------------------

  private checkScoreNarrative(): void {
    if (this.score >= 100) {
      this.triggerNarrativeByTrigger('score_100');
    }
    if (this.score >= 500) {
      this.triggerNarrativeByTrigger('score_500');
    }
    if (this.enemies.countActive() === 0) {
      this.triggerNarrativeByTrigger('all_enemies_defeated');
    }
  }
}

// ===========================================================================
// GameRuntime - Public API
// ===========================================================================

export class GameRuntime {
  /**
   * Create a new Phaser 3 game from a GameConfig JSON.
   *
   * @param containerId - The DOM element ID to mount the game into
   * @param config      - The complete game configuration
   * @param callbacks   - Optional callbacks for game events
   * @returns A RuntimeHandle to control the game
   */
  static create(
    containerId: string,
    config: GameConfig,
    callbacks: RuntimeCallbacks = {},
  ): RuntimeHandle {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`GameRuntime: container element '#${containerId}' not found`);
    }

    let currentScore = 0;
    const wrappedCallbacks: RuntimeCallbacks = {
      ...callbacks,
      onScoreChange: (score: number) => {
        currentScore = score;
        callbacks.onScoreChange?.(score);
      },
    };

    // We pass scene data via a custom scene class that captures the config
    // in its constructor closure, avoiding the start/stop/restart dance.
    const sceneConfig = { config, callbacks: wrappedCallbacks };

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerId,
      width: config.world.width,
      height: config.world.height,
      backgroundColor: config.world.backgroundColor,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: config.world.width,
        height: config.world.height,
        parent: containerId,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [],  // Don't auto-start; we manually add & start with data below
      input: {
        keyboard: true,
        mouse: true,
        touch: true,
      },
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
      },
    });

    // Add the scene manually and start it with config data so init() receives it
    game.scene.add('MainScene', MainScene, true, sceneConfig);

    const handle: RuntimeHandle = {
      destroy: () => {
        // Clean up canvas CSS filters/transforms
        if (game.canvas) {
          game.canvas.style.filter = '';
          game.canvas.style.transform = '';
        }
        game.destroy(true);
      },
      pause: () => {
        game.scene.pause('MainScene');
      },
      resume: () => {
        game.scene.resume('MainScene');
      },
      getScore: () => currentScore,
    };

    return handle;
  }
}

export default GameRuntime;
