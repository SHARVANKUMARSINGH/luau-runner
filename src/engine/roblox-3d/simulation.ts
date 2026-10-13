import type { Vec3 } from './math';
import type { RenderPart, CharacterState } from './renderer';

export interface CameraState {
  orbitYaw: number;
  orbitPitch: number;
  distance: number;
  target: Vec3;
  eye: Vec3;
}

export interface SimulationInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  joystickX: number; // -1 to 1 from virtual joystick
  joystickY: number; // -1 to 1 from virtual joystick
}

export type PlayMode = 'solo' | 'run';

export class RobloxSimulationWorld {
  public parts: RenderPart[] = [];
  public character: CharacterState;
  public camera: CameraState;

  // Physics
  private charVelocity: Vec3 = { x: 0, y: 0, z: 0 };
  private gravity = 60; // studs/s²
  private isOnGround = true;

  // Stats
  public fps = 60;
  public frameCount = 0;
  public lastFpsUpdate = Date.now();
  public ping = 12;

  // Mode: solo (spawns avatar) vs run (server only)
  public mode: PlayMode = 'solo';
  public isPaused = false;

  // Callback for Touched events back into Luau
  public onPartTouched?: (partName: string) => void;

  constructor() {
    this.character = {
      position: { x: 0, y: 0, z: 0 },
      rotationY: 0,
      walkCycle: 0,
      isMoving: false,
      isJumping: false,
      health: 100,
      maxHealth: 100,
      name: 'Player1',
      walkSpeed: 16,
    };

    this.camera = {
      orbitYaw: 0,
      orbitPitch: 0.35,
      distance: 14,
      target: { x: 0, y: 3, z: 0 },
      eye: { x: 0, y: 8, z: 14 },
    };

    this.resetDefaultWorld();
  }

  /**
   * Reset world to default Roblox Studio template
   */
  public resetDefaultWorld() {
    this.parts = [
      // Spawn Location
      {
        id: 'spawn_location',
        name: 'SpawnLocation',
        position: { x: 0, y: 0.2, z: 0 },
        size: { x: 6, y: 0.4, z: 6 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#a4b0be',
        transparency: 0,
        anchored: true,
        canCollide: true,
        shape: 'Block',
      },
      // Decorative interactive pillars / stairs
      {
        id: 'pillar_1',
        name: 'Pillar1',
        position: { x: -12, y: 4, z: -12 },
        size: { x: 3, y: 8, z: 3 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#ff4757',
        transparency: 0,
        anchored: true,
        canCollide: true,
        shape: 'Block',
      },
      {
        id: 'pillar_2',
        name: 'Pillar2',
        position: { x: 12, y: 4, z: -12 },
        size: { x: 3, y: 8, z: 3 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#2ed573',
        transparency: 0,
        anchored: true,
        canCollide: true,
        shape: 'Block',
      },
      {
        id: 'jump_pad',
        name: 'JumpPad',
        position: { x: 0, y: 0.3, z: -15 },
        size: { x: 5, y: 0.5, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#ffa502',
        transparency: 0,
        anchored: true,
        canCollide: true,
        shape: 'Block',
      },
      {
        id: 'platform_high',
        name: 'Platform',
        position: { x: 0, y: 8, z: -25 },
        size: { x: 14, y: 1, z: 14 },
        rotation: { x: 0, y: 0, z: 0 },
        color: '#1e90ff',
        transparency: 0,
        anchored: true,
        canCollide: true,
        shape: 'Block',
      },
    ];

    this.respawnCharacter();
  }

  public respawnCharacter() {
    this.character.position = { x: 0, y: 0.5, z: 0 };
    this.charVelocity = { x: 0, y: 0, z: 0 };
    this.character.health = this.character.maxHealth;
    this.character.isMoving = false;
    this.character.isJumping = false;
    this.character.walkCycle = 0;
  }

  /**
   * Sync a part created or modified in Luau into the 3D world
   */
  public syncPartFromLuau(
    name: string,
    pos: { x: number; y: number; z: number },
    size: { x: number; y: number; z: number },
    color: string,
    anchored = true,
    transparency = 0
  ) {
    const existing = this.parts.find((p) => p.name === name);
    if (existing) {
      existing.position = { ...pos };
      existing.size = { ...size };
      existing.color = color;
      existing.anchored = anchored;
      existing.transparency = transparency;
    } else {
      this.parts.push({
        id: `part_${Date.now()}_${Math.random()}`,
        name,
        position: { ...pos },
        size: { ...size },
        rotation: { x: 0, y: 0, z: 0 },
        color,
        transparency,
        anchored,
        canCollide: true,
        shape: 'Block',
      });
    }
  }

  /**
   * Remove a destroyed part
   */
  public removePart(name: string) {
    this.parts = this.parts.filter((p) => p.name !== name);
  }

  /**
   * Camera Orbit input (touch or mouse right-click drag)
   */
  public rotateCamera(deltaX: number, deltaY: number) {
    this.camera.orbitYaw -= deltaX * 0.005;
    this.camera.orbitPitch = Math.max(
      -0.2,
      Math.min(1.3, this.camera.orbitPitch + deltaY * 0.005)
    );
  }

  public zoomCamera(deltaDistance: number) {
    this.camera.distance = Math.max(
      4,
      Math.min(45, this.camera.distance + deltaDistance * 0.02)
    );
  }

  /**
   * Main Physics & Animation Step
   */
  public step(dt: number, input: SimulationInput) {
    if (this.isPaused) return;

    // Clamp delta time to avoid large physics steps
    const safeDt = Math.min(dt, 0.05);

    // Update FPS counter
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      this.ping = Math.floor(10 + Math.random() * 5);
    }

    if (this.mode === 'solo') {
      this.updateCharacterPhysics(safeDt, input);
    }

    this.updateCamera(safeDt);
  }

  private updateCharacterPhysics(dt: number, input: SimulationInput) {
    const char = this.character;

    // 1. Calculate camera-relative movement direction
    let moveX = 0;
    let moveZ = 0;

    if (input.forward) moveZ -= 1;
    if (input.backward) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    // Mobile joystick contribution
    if (Math.abs(input.joystickX) > 0.05 || Math.abs(input.joystickY) > 0.05) {
      moveX += input.joystickX;
      moveZ += input.joystickY;
    }

    const inputLen = Math.hypot(moveX, moveZ);
    const isMoving = inputLen > 0.1;

    if (isMoving) {
      const normX = moveX / inputLen;
      const normZ = moveZ / inputLen;

      // Camera forward & right vectors on XZ ground plane
      const camYaw = this.camera.orbitYaw;
      const forwardX = -Math.sin(camYaw);
      const forwardZ = -Math.cos(camYaw);
      const rightX = Math.cos(camYaw);
      const rightZ = -Math.sin(camYaw);

      const worldDirX = rightX * normX + forwardX * (-normZ);
      const worldDirZ = rightZ * normX + forwardZ * (-normZ);

      // Apply horizontal speed
      char.position.x += worldDirX * char.walkSpeed * dt;
      char.position.z += worldDirZ * char.walkSpeed * dt;

      // Face direction of movement
      char.rotationY = Math.atan2(worldDirX, worldDirZ);

      // Walk cycle animation
      char.walkCycle = (char.walkCycle + char.walkSpeed * dt * 1.1) % (Math.PI * 2);
    } else {
      char.walkCycle = 0;
    }

    char.isMoving = isMoving;

    // 2. Jump & Vertical Physics
    if (input.jump && this.isOnGround) {
      this.charVelocity.y = 28; // Jump initial velocity
      this.isOnGround = false;
      char.isJumping = true;
    }

    // Apply gravity
    this.charVelocity.y -= this.gravity * dt;
    char.position.y += this.charVelocity.y * dt;

    // 3. Collision with Baseplate & Parts
    let highestFloor = 0; // Baseplate floor height

    // Check collision with parts (standing on top of parts)
    for (const part of this.parts) {
      const hx = part.size.x / 2 + 0.6;
      const hz = part.size.z / 2 + 0.6;
      const topY = part.position.y + part.size.y / 2;

      // Check if player is horizontally inside part bounding box
      if (
        char.position.x >= part.position.x - hx &&
        char.position.x <= part.position.x + hx &&
        char.position.z >= part.position.z - hz &&
        char.position.z <= part.position.z + hz
      ) {
        // Player is above the part
        if (char.position.y >= topY - 1.0) {
          if (topY > highestFloor) {
            highestFloor = topY;
          }
        }

        // Fire Touched event
        if (this.onPartTouched) {
          this.onPartTouched(part.name);
        }
      }
    }

    // Floor landing
    if (char.position.y <= highestFloor) {
      char.position.y = highestFloor;
      this.charVelocity.y = 0;
      this.isOnGround = true;
      char.isJumping = false;
    } else {
      this.isOnGround = false;
    }

    // Fall below world -> respawn
    if (char.position.y < -30) {
      this.respawnCharacter();
    }
  }

  private updateCamera(dt: number) {
    const char = this.character;

    // Target is slightly above player torso
    const targetY = this.mode === 'solo' ? char.position.y + 3.2 : 3.0;
    const targetX = this.mode === 'solo' ? char.position.x : 0;
    const targetZ = this.mode === 'solo' ? char.position.z : 0;

    this.camera.target = {
      x: this.camera.target.x + (targetX - this.camera.target.x) * (dt * 12),
      y: this.camera.target.y + (targetY - this.camera.target.y) * (dt * 12),
      z: this.camera.target.z + (targetZ - this.camera.target.z) * (dt * 12),
    };

    // Calculate eye from spherical orbit
    const { orbitYaw, orbitPitch, distance, target } = this.camera;
    const cosPitch = Math.cos(orbitPitch);
    const sinPitch = Math.sin(orbitPitch);

    const eyeX = target.x + distance * Math.sin(orbitYaw) * cosPitch;
    const eyeY = target.y + distance * sinPitch;
    const eyeZ = target.z + distance * Math.cos(orbitYaw) * cosPitch;

    this.camera.eye = { x: eyeX, y: eyeY, z: eyeZ };
  }
}
