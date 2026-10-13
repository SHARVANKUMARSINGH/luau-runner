import * as THREE from 'three';
import { 
  createBaseplate2021Texture, 
  createClassicStudsTexture, 
  createRobloxFaceTexture, 
  createSpawnDecalTexture, 
  createRobloxSkyTexture,
  getRobloxMaterialTexture 
} from './textures';

export interface WorldPartData {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  color: string;
  anchored: boolean;
  transparency: number;
  shape?: string;
  material?: string;
}

export interface WebGLPlayerState {
  health: number;
  maxHealth: number;
  walkSpeed: number;
  jumpPower: number;
  name: string;
}

export interface WebGLInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  joystickX: number;
  joystickY: number;
}

export class RobloxWebGLEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  // Environment & Sky
  private skyMesh: THREE.Mesh;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private fillLight: THREE.DirectionalLight;

  // Baseplate & Spawn
  private baseplateMesh: THREE.Mesh;
  private spawnMesh: THREE.Mesh;

  // Character hierarchy
  private characterGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private facePlane: THREE.Mesh;
  private leftArmJoint: THREE.Group;
  private rightArmJoint: THREE.Group;
  private leftLegJoint: THREE.Group;
  private rightLegJoint: THREE.Group;
  private nameTagSprite: THREE.Sprite;
  private nameTagCanvas: HTMLCanvasElement;
  private nameTagCtx: CanvasRenderingContext2D;

  // Dynamic user parts map
  private partsMap = new Map<string, THREE.Mesh>();

  // Physics & Animation
  public player: WebGLPlayerState = {
    health: 100,
    maxHealth: 100,
    walkSpeed: 16,
    jumpPower: 50,
    name: 'Player1',
  };

  public charPos = new THREE.Vector3(0, 0.4, 0);
  private charVelocity = new THREE.Vector3(0, 0, 0);
  private charRotationY = 0;
  private walkPhase = 0;
  private isOnGround = true;
  private gravity = 60;

  // Camera Orbit
  public cameraYaw = 0;
  public cameraPitch = 0.32;
  public cameraDistance = 14;
  private cameraTarget = new THREE.Vector3(0, 3, 0);

  // Stats
  public fps = 60;
  private frameCount = 0;
  private lastFpsTime = performance.now();
  public ping = 12;

  // Mode: solo (spawns character) vs run (server view)
  public mode: 'solo' | 'run' = 'solo';
  public isPaused = false;

  // Active input state consumed by physics loop
  public input: WebGLInputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    joystickX: 0,
    joystickY: 0,
  };

  // Touched callback
  public onPartTouched?: (partName: string) => void;

  constructor(container: HTMLElement) {
    // 1. Scene & Skybox Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1c62b9);
    // Linear horizon fog that smoothly blends the baseplate into the sky haze
    this.scene.fog = new THREE.Fog(0x9fcbf8, 120, 1400);

    // Realistic Equirectangular Sky Dome
    const skyTex = createRobloxSkyTexture();
    const skyGeo = new THREE.SphereGeometry(1800, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.2, 3000);

    // 3. Renderer with soft PCF shadows and sRGB color space
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // 4. Authentic Roblox Studio Lighting Engine
    // Sky bounce + ground warm bounce
    this.hemiLight = new THREE.HemisphereLight(0xb4d4ff, 0x7a6348, 0.9);
    this.scene.add(this.hemiLight);

    // Warm directional sun
    this.dirLight = new THREE.DirectionalLight(0xfff6e6, 1.35);
    this.dirLight.position.set(250, 500, 200);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 1500;
    const shadowDist = 120;
    this.dirLight.shadow.camera.left = -shadowDist;
    this.dirLight.shadow.camera.right = shadowDist;
    this.dirLight.shadow.camera.top = shadowDist;
    this.dirLight.shadow.camera.bottom = -shadowDist;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // Soft cool fill light from opposite side
    this.fillLight = new THREE.DirectionalLight(0xaaccff, 0.25);
    this.fillLight.position.set(-200, 150, -250);
    this.scene.add(this.fillLight);

    // 5. Authentic Modern Roblox Baseplate 2021 (1024 x 16 x 1024 studs)
    const baseplateTex = createBaseplate2021Texture();
    baseplateTex.repeat.set(64, 64); // 1024 / 16 studs = 64 repeats

    const baseplateMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.85,
      metalness: 0.08,
      map: baseplateTex,
    });
    const baseplateGeo = new THREE.BoxGeometry(1024, 16, 1024);
    this.baseplateMesh = new THREE.Mesh(baseplateGeo, baseplateMat);
    this.baseplateMesh.position.set(0, -8, 0); // Top surface at Y = 0
    this.baseplateMesh.receiveShadow = true;
    this.scene.add(this.baseplateMesh);

    // Subtle Ground Grid Helper on Baseplate Surface
    const grid = new THREE.GridHelper(1024, 64, 0x48566a, 0x323c4a);
    grid.position.y = 0.02;
    (grid.material as THREE.Material).opacity = 0.22;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    // Spawn Location Platform (6 x 0.4 x 6 studs) with classic sunburst decal
    const spawnTex = createSpawnDecalTexture();
    const spawnMatTop = new THREE.MeshStandardMaterial({
      color: '#a4b0be',
      roughness: 0.65,
      metalness: 0.1,
      map: spawnTex,
    });
    const spawnMatSide = new THREE.MeshStandardMaterial({ color: '#7e8794', roughness: 0.75 });
    const spawnMaterials = [
      spawnMatSide, spawnMatSide, spawnMatTop, spawnMatSide, spawnMatSide, spawnMatSide,
    ];
    this.spawnMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 6), spawnMaterials);
    this.spawnMesh.position.set(0, 0.2, 0); // Top surface at Y = 0.4
    this.spawnMesh.receiveShadow = true;
    this.spawnMesh.castShadow = true;
    this.scene.add(this.spawnMesh);

    // 6. Add Classic Roblox Playground Template Parts (Stairs, Towers, Obby Platform)
    this.syncPartFromLuau({
      id: 'demo_platform',
      name: 'SpawnPlatform',
      position: { x: -14, y: 1.5, z: -10 },
      size: { x: 8, y: 3, z: 8 },
      color: '#2ecc71',
      anchored: true,
      transparency: 0,
      material: 'SmoothPlastic',
    });
    this.syncPartFromLuau({
      id: 'demo_red_tower',
      name: 'RedTower',
      position: { x: 14, y: 3.5, z: 8 },
      size: { x: 5, y: 7, z: 5 },
      color: '#e74c3c',
      anchored: true,
      transparency: 0,
      material: 'Brick',
    });
    this.syncPartFromLuau({
      id: 'demo_blue_block',
      name: 'BlueBlock',
      position: { x: -10, y: 2, z: 12 },
      size: { x: 6, y: 4, z: 6 },
      color: '#3498db',
      anchored: true,
      transparency: 0,
      material: 'DiamondPlate',
    });
    this.syncPartFromLuau({
      id: 'demo_neon_core',
      name: 'NeonCrystal',
      position: { x: 10, y: 3, z: -14 },
      size: { x: 4, y: 6, z: 4 },
      color: '#f1c40f',
      anchored: true,
      transparency: 0,
      material: 'Neon',
    });

    // 7. Build Classic R6 Character Avatar with Cylindrical Beveled Head & Decal
    this.characterGroup = new THREE.Group();
    const { torso, head, face, leftArmJ, rightArmJ, leftLegJ, rightLegJ, nameTag, ntCanvas, ntCtx } =
      this.buildR6Character();
    this.torsoMesh = torso;
    this.headMesh = head;
    this.facePlane = face;
    this.leftArmJoint = leftArmJ;
    this.rightArmJoint = rightArmJ;
    this.leftLegJoint = leftLegJ;
    this.rightLegJoint = rightLegJ;
    this.nameTagSprite = nameTag;
    this.nameTagCanvas = ntCanvas;
    this.nameTagCtx = ntCtx;

    this.charPos.set(0, 0.4, 0); // Spawn directly atop spawn location
    this.updateNameTag();
    this.scene.add(this.characterGroup);

    // Start Simulation & Render Loop
    this.startLoop();
  }

  /**
   * Builds an authentic R6 Roblox Character Model
   */
  private buildR6Character() {
    const group = this.characterGroup;

    // Classic Roblox Noob Color Palette
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#f5cd2f', roughness: 0.5, metalness: 0.05 });
    const blueMat = new THREE.MeshStandardMaterial({ color: '#0d69ac', roughness: 0.5, metalness: 0.05 });
    const greenMat = new THREE.MeshStandardMaterial({ color: '#a4bd46', roughness: 0.5, metalness: 0.05 });

    // Torso: 2 x 2 x 1 studs
    const torsoGeo = new THREE.BoxGeometry(2, 2, 1);
    const torso = new THREE.Mesh(torsoGeo, blueMat);
    torso.position.set(0, 3, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Head: Beveled Cylinder with radius 0.625 (diameter 1.25) and height 1.25 studs
    const headGeo = new THREE.CylinderGeometry(0.625, 0.625, 1.25, 24);
    headGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    const head = new THREE.Mesh(headGeo, yellowMat);
    head.position.set(0, 4.625, 0);
    head.castShadow = true;
    group.add(head);

    // Front Face Decal: Classic Roblox Smile
    const faceTex = createRobloxFaceTexture();
    const faceMat = new THREE.MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), faceMat);
    face.position.set(0, 4.625, -0.635);
    face.rotation.y = Math.PI;
    group.add(face);

    // Left Arm Joint (Pivot at shoulder: -1.5, 4, 0)
    const leftArmJ = new THREE.Group();
    leftArmJ.position.set(-1.5, 4, 0);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), yellowMat);
    leftArm.position.set(0, -1, 0); // Offset down from shoulder pivot
    leftArm.castShadow = true;
    leftArmJ.add(leftArm);
    group.add(leftArmJ);

    // Right Arm Joint (Pivot at shoulder: 1.5, 4, 0)
    const rightArmJ = new THREE.Group();
    rightArmJ.position.set(1.5, 4, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), yellowMat);
    rightArm.position.set(0, -1, 0);
    rightArm.castShadow = true;
    rightArmJ.add(rightArm);
    group.add(rightArmJ);

    // Left Leg Joint (Pivot at hip: -0.5, 2, 0)
    const leftLegJ = new THREE.Group();
    leftLegJ.position.set(-0.5, 2, 0);
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), greenMat);
    leftLeg.position.set(0, -1, 0);
    leftLeg.castShadow = true;
    leftLegJ.add(leftLeg);
    group.add(leftLegJ);

    // Right Leg Joint (Pivot at hip: 0.5, 2, 0)
    const rightLegJ = new THREE.Group();
    rightLegJ.position.set(0.5, 2, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), greenMat);
    rightLeg.position.set(0, -1, 0);
    rightLeg.castShadow = true;
    rightLegJ.add(rightLeg);
    group.add(rightLegJ);

    // Overhead Billboard Name Tag & Health Bar
    const ntCanvas = document.createElement('canvas');
    ntCanvas.width = 256;
    ntCanvas.height = 100;
    const ntCtx = ntCanvas.getContext('2d')!;

    const nameTagTex = new THREE.CanvasTexture(ntCanvas);
    const nameTagMat = new THREE.SpriteMaterial({ map: nameTagTex, transparent: true, depthTest: false });
    const nameTag = new THREE.Sprite(nameTagMat);
    nameTag.position.set(0, 6.3, 0);
    nameTag.scale.set(3.8, 1.5, 1);
    group.add(nameTag);

    return {
      torso,
      head,
      face,
      leftArmJ,
      rightArmJ,
      leftLegJ,
      rightLegJ,
      nameTag,
      ntCanvas,
      ntCtx,
    };
  }

  /**
   * Updates the overhead 2D name tag billboard
   */
  public updateNameTag() {
    const { nameTagCtx: ctx, nameTagCanvas: canvas, nameTagSprite, player } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Player Username in Dark Rounded Pill
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(cx - 85, 8, 170, 36, 18);
      ctx.fill();
    } else {
      ctx.fillRect(cx - 85, 8, 170, 36);
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.name, cx, 34);

    // Health Bar
    const bw = 140;
    const bh = 8;
    const healthPct = Math.max(0, Math.min(1, player.health / player.maxHealth));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(cx - bw / 2 - 2, 52, bw + 4, bh + 4);

    ctx.fillStyle = healthPct > 0.5 ? '#2ecc71' : healthPct > 0.2 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(cx - bw / 2, 54, bw * healthPct, bh);

    (nameTagSprite.material as THREE.SpriteMaterial).map!.needsUpdate = true;
  }

  /**
   * Switches Baseplate between modern Baseplate 2021 grid and Classic Studs
   */
  public setBaseplateStyle(style: 'baseplate2021' | 'classic') {
    if (style === 'classic') {
      const studsTex = createClassicStudsTexture();
      studsTex.repeat.set(128, 128);
      const mat = this.baseplateMesh.material as THREE.MeshStandardMaterial;
      mat.map = studsTex;
      mat.color.set('#a3a2a5');
      mat.needsUpdate = true;
    } else {
      const bpTex = createBaseplate2021Texture();
      bpTex.repeat.set(64, 64);
      const mat = this.baseplateMesh.material as THREE.MeshStandardMaterial;
      mat.map = bpTex;
      mat.color.set('#ffffff');
      mat.needsUpdate = true;
    }
  }

  /**
   * Creates or updates a 3D Part in the WebGL scene from Luau scripts
   */
  public syncPartFromLuau(part: WorldPartData) {
    let mesh = this.partsMap.get(part.name);
    const color = new THREE.Color(part.color || '#a4b0be');
    const matName = part.material || 'SmoothPlastic';
    const patternTex = getRobloxMaterialTexture(matName);

    let mat: THREE.Material;
    if (matName === 'Neon') {
      mat = new THREE.MeshBasicMaterial({ color });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color,
        roughness: matName === 'Metal' || matName === 'DiamondPlate' ? 0.25 : 0.65,
        metalness: matName === 'Metal' || matName === 'DiamondPlate' ? 0.75 : 0.08,
        transparent: part.transparency > 0,
        opacity: Math.max(0, 1 - part.transparency),
        map: patternTex || undefined,
      });
    }

    if (!mesh) {
      let geo: THREE.BufferGeometry;
      const shape = part.shape || 'Block';

      if (shape === 'Ball') {
        geo = new THREE.SphereGeometry(Math.max(part.size.x, part.size.y, part.size.z) / 2, 24, 18);
      } else if (shape === 'Cylinder') {
        geo = new THREE.CylinderGeometry(part.size.y / 2, part.size.y / 2, part.size.x, 24);
        geo.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
      } else {
        geo = new THREE.BoxGeometry(part.size.x, part.size.y, part.size.z);
      }

      mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = part.name;
      this.scene.add(mesh);
      this.partsMap.set(part.name, mesh);
    } else {
      mesh.material = mat;
    }

    mesh.position.set(part.position.x, part.position.y, part.position.z);
  }

  public removePart(name: string) {
    const mesh = this.partsMap.get(name);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
      this.partsMap.delete(name);
    }
  }

  public respawnCharacter() {
    this.charPos.set(0, 0.4, 0);
    this.charVelocity.set(0, 0, 0);
    this.player.health = this.player.maxHealth;
    this.updateNameTag();
  }

  public rotateCamera(dx: number, dy: number) {
    this.cameraYaw -= dx * 0.005;
    this.cameraPitch = Math.max(-0.25, Math.min(1.35, this.cameraPitch + dy * 0.005));
  }

  public zoomCamera(delta: number) {
    this.cameraDistance = Math.max(3.5, Math.min(60, this.cameraDistance + delta * 0.025));
  }

  /**
   * Main Simulation Step
   */
  public step(dt: number, input: WebGLInputState) {
    if (this.isPaused) return;
    const safeDt = Math.min(dt, 0.05);

    // FPS counter
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
      this.ping = Math.floor(10 + Math.random() * 5);
    }

    if (this.mode === 'solo') {
      this.characterGroup.visible = true;
      this.updateCharacterPhysics(safeDt, input);
    } else {
      this.characterGroup.visible = false;
    }

    this.updateCamera(safeDt);
  }

  private updateCharacterPhysics(dt: number, input: WebGLInputState) {
    // 1. Camera-relative movement
    let moveX = 0;
    let moveZ = 0;

    if (input.forward) moveZ -= 1;
    if (input.backward) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    if (Math.abs(input.joystickX) > 0.05 || Math.abs(input.joystickY) > 0.05) {
      moveX += input.joystickX;
      moveZ += input.joystickY;
    }

    const inputLen = Math.hypot(moveX, moveZ);
    const isMoving = inputLen > 0.08;

    if (isMoving) {
      const normX = moveX / inputLen;
      const normZ = moveZ / inputLen;

      // Project onto ground relative to camera yaw
      const forwardX = -Math.sin(this.cameraYaw);
      const forwardZ = -Math.cos(this.cameraYaw);
      const rightX = Math.cos(this.cameraYaw);
      const rightZ = -Math.sin(this.cameraYaw);

      const worldDirX = rightX * normX + forwardX * (-normZ);
      const worldDirZ = rightZ * normX + forwardZ * (-normZ);

      this.charPos.x += worldDirX * this.player.walkSpeed * dt;
      this.charPos.z += worldDirZ * this.player.walkSpeed * dt;

      this.charRotationY = Math.atan2(worldDirX, worldDirZ);

      // Animation walk cycle
      this.walkPhase += this.player.walkSpeed * dt * 1.1;
      const legSwing = Math.sin(this.walkPhase) * 0.75;
      const armSwing = -Math.sin(this.walkPhase) * 0.75;

      this.leftLegJoint.rotation.x = legSwing;
      this.rightLegJoint.rotation.x = -legSwing;
      this.leftArmJoint.rotation.x = armSwing;
      this.rightArmJoint.rotation.x = -armSwing;

      // Subtle torso bobbing
      const bob = Math.abs(Math.sin(this.walkPhase * 2)) * 0.12;
      this.torsoMesh.position.y = 3.0 + bob;
      this.headMesh.position.y = 4.625 + bob;
      this.facePlane.position.y = 4.625 + bob;
    } else {
      // Idle pose
      this.leftLegJoint.rotation.x = 0;
      this.rightLegJoint.rotation.x = 0;
      this.leftArmJoint.rotation.x = 0;
      this.rightArmJoint.rotation.x = 0;
      this.torsoMesh.position.y = 3.0;
      this.headMesh.position.y = 4.625;
      this.facePlane.position.y = 4.625;
    }

    // 2. Jump & Vertical Physics
    if (input.jump && this.isOnGround) {
      this.charVelocity.y = 26;
      this.isOnGround = false;
      this.leftArmJoint.rotation.x = 2.2;
      this.rightArmJoint.rotation.x = 2.2;
      this.leftLegJoint.rotation.x = 0.25;
      this.rightLegJoint.rotation.x = -0.25;
    }

    this.charVelocity.y -= this.gravity * dt;
    this.charPos.y += this.charVelocity.y * dt;

    // 3. Collision with Baseplate, Spawn Platform, and Parts
    let floorY = 0; // Baseplate top surface at Y = 0

    // Spawn platform collision check (at 0, 0.2, 0, height 0.4 -> top surface at Y = 0.4)
    if (Math.abs(this.charPos.x) <= 3.2 && Math.abs(this.charPos.z) <= 3.2) {
      floorY = 0.4;
    }

    // Parts collision
    for (const [name, mesh] of this.partsMap.entries()) {
      if (!mesh.geometry) continue;
      const geo = mesh.geometry as THREE.BoxGeometry;
      const sx = geo.parameters ? geo.parameters.width : 4;
      const sy = geo.parameters ? geo.parameters.height : 2;
      const sz = geo.parameters ? geo.parameters.depth : 4;

      const px = mesh.position.x;
      const py = mesh.position.y;
      const pz = mesh.position.z;

      const hx = sx / 2 + 0.8;
      const hz = sz / 2 + 0.8;
      const topY = py + sy / 2;

      if (
        this.charPos.x >= px - hx &&
        this.charPos.x <= px + hx &&
        this.charPos.z >= pz - hz &&
        this.charPos.z <= pz + hz
      ) {
        if (this.charPos.y >= topY - 1.2) {
          if (topY > floorY) floorY = topY;
        }

        if (this.onPartTouched) {
          this.onPartTouched(name);
        }
      }
    }

    if (this.charPos.y <= floorY) {
      this.charPos.y = floorY;
      this.charVelocity.y = 0;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }

    // Void fall respawn
    if (this.charPos.y < -40) {
      this.respawnCharacter();
    }

    // Update 3D Character Group transform
    this.characterGroup.position.copy(this.charPos);
    this.characterGroup.rotation.y = this.charRotationY;
  }

  private updateCamera(dt: number) {
    const targetY = this.mode === 'solo' ? this.charPos.y + 3.2 : 3.0;
    const targetX = this.mode === 'solo' ? this.charPos.x : 0;
    const targetZ = this.mode === 'solo' ? this.charPos.z : 0;

    this.cameraTarget.lerp(new THREE.Vector3(targetX, targetY, targetZ), dt * 14);

    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);

    const eyeX = this.cameraTarget.x + this.cameraDistance * Math.sin(this.cameraYaw) * cosPitch;
    const eyeY = this.cameraTarget.y + this.cameraDistance * sinPitch;
    const eyeZ = this.cameraTarget.z + this.cameraDistance * Math.cos(this.cameraYaw) * cosPitch;

    this.camera.position.set(eyeX, eyeY, eyeZ);
    this.camera.lookAt(this.cameraTarget);

    // Keep sky dome centered on camera so player never flies out of skybox
    this.skyMesh.position.copy(this.camera.position);

    // Center directional sun shadows around player camera
    this.dirLight.position.set(eyeX + 150, eyeY + 300, eyeZ + 120);
    this.dirLight.target.position.copy(this.cameraTarget);
    this.dirLight.target.updateMatrixWorld();
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startLoop() {
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      this.step(dt, this.input);
      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
