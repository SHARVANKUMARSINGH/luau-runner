import * as THREE from 'three';
import { createStudsTexture, createRobloxFaceTexture, createSpawnDecalTexture } from './textures';

export interface WorldPartData {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  color: string;
  anchored: boolean;
  transparency: number;
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

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  // Baseplate & Spawn
  private baseplateMesh: THREE.Mesh;
  private spawnMesh: THREE.Mesh;

  // Character hierarchy
  private characterGroup: THREE.Group;
  private torsoMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
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

  public charPos = new THREE.Vector3(0, 0, 0);
  private charVelocity = new THREE.Vector3(0, 0, 0);
  private charRotationY = 0;
  private walkPhase = 0;
  private isOnGround = true;
  private gravity = 65;

  // Camera Orbit
  public cameraYaw = 0;
  public cameraPitch = 0.35;
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
    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#78b3f8');
    this.scene.fog = new THREE.FogExp2('#cde2fc', 0.0025);

    // 2. Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.2, 800);

    // 3. Renderer with soft shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Roblox Lighting Engine
    this.ambientLight = new THREE.AmbientLight('#889bb0', 0.75);
    this.scene.add(this.ambientLight);

    const hemiLight = new THREE.HemisphereLight('#78b3f8', '#595d62', 0.4);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight('#fff8e7', 1.35);
    this.dirLight.position.set(60, 140, 70);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 300;
    const shadowDist = 60;
    this.dirLight.shadow.camera.left = -shadowDist;
    this.dirLight.shadow.camera.right = shadowDist;
    this.dirLight.shadow.camera.top = shadowDist;
    this.dirLight.shadow.camera.bottom = -shadowDist;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // 5. Authentic Roblox Baseplate (512x20x512 studs)
    const studsTex = createStudsTexture();
    studsTex.repeat.set(512, 512);

    const baseplateMat = new THREE.MeshStandardMaterial({
      color: '#595d62',
      roughness: 0.82,
      metalness: 0.08,
      map: studsTex,
    });
    const baseplateGeo = new THREE.BoxGeometry(512, 20, 512);
    this.baseplateMesh = new THREE.Mesh(baseplateGeo, baseplateMat);
    this.baseplateMesh.position.set(0, -10, 0); // Top surface at Y = 0
    this.baseplateMesh.receiveShadow = true;
    this.scene.add(this.baseplateMesh);

    // Spawn Location with classic Sunburst decal
    const spawnTex = createSpawnDecalTexture();
    const spawnMatTop = new THREE.MeshStandardMaterial({
      color: '#a4b0be',
      roughness: 0.7,
      metalness: 0.1,
      map: spawnTex,
    });
    const spawnMatSide = new THREE.MeshStandardMaterial({ color: '#888f99', roughness: 0.8 });
    const spawnMaterials = [
      spawnMatSide, spawnMatSide, spawnMatTop, spawnMatSide, spawnMatSide, spawnMatSide,
    ];
    this.spawnMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 6), spawnMaterials);
    this.spawnMesh.position.set(0, 0.2, 0);
    this.spawnMesh.receiveShadow = true;
    this.spawnMesh.castShadow = true;
    this.scene.add(this.spawnMesh);

    // Add classic interactive template blocks
    this.syncPartFromLuau({
      id: 'demo_green',
      name: 'GreenPlatform',
      position: { x: -10, y: 1, z: -8 },
      size: { x: 6, y: 2, z: 6 },
      color: '#2ecc71',
      anchored: true,
      transparency: 0,
    });
    this.syncPartFromLuau({
      id: 'demo_red',
      name: 'RedTower',
      position: { x: 10, y: 2, z: 6 },
      size: { x: 4, y: 4, z: 4 },
      color: '#e74c3c',
      anchored: true,
      transparency: 0,
    });
    this.syncPartFromLuau({
      id: 'demo_blue',
      name: 'BlueBlock',
      position: { x: -8, y: 1.5, z: 10 },
      size: { x: 5, y: 3, z: 5 },
      color: '#3498db',
      anchored: true,
      transparency: 0,
    });
    this.syncPartFromLuau({
      id: 'demo_yellow',
      name: 'YellowSteps',
      position: { x: 8, y: 2.5, z: -10 },
      size: { x: 4, y: 5, z: 4 },
      color: '#f1c40f',
      anchored: true,
      transparency: 0,
    });

    // 6. Build Classic R6 Character Avatar
    this.characterGroup = new THREE.Group();
    const { torso, head, leftArmJ, rightArmJ, leftLegJ, rightLegJ, nameTag, ntCanvas, ntCtx } =
      this.buildR6Character();
    this.torsoMesh = torso;
    this.headMesh = head;
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

    // Start Render Loop
    this.startLoop();
  }

  /**
   * Builds an authentic R6 Roblox Character Model
   */
  private buildR6Character() {
    const group = this.characterGroup;

    // Materials
    const yellowMat = new THREE.MeshStandardMaterial({ color: '#f5cd2f', roughness: 0.65 });
    const blueMat = new THREE.MeshStandardMaterial({ color: '#0d69ac', roughness: 0.65 });
    const greenMat = new THREE.MeshStandardMaterial({ color: '#a4bd46', roughness: 0.65 });

    // Torso: 2 x 2 x 1 studs
    const torsoGeo = new THREE.BoxGeometry(2, 2, 1);
    const torso = new THREE.Mesh(torsoGeo, blueMat);
    torso.position.set(0, 3, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // Head: 1.25 x 1.25 x 1.25 studs with smiley face decal on front
    const faceTex = createRobloxFaceTexture();
    const faceMat = new THREE.MeshStandardMaterial({ color: '#f5cd2f', map: faceTex, roughness: 0.65 });
    const headMaterials = [
      yellowMat, yellowMat, yellowMat, yellowMat, faceMat, yellowMat,
    ];
    const headGeo = new THREE.BoxGeometry(1.25, 1.25, 1.25);
    const head = new THREE.Mesh(headGeo, headMaterials);
    head.position.set(0, 4.625, 0);
    head.castShadow = true;
    group.add(head);

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
    leftLeg.position.set(0, -1, 0); // Offset down from hip pivot
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
    nameTag.position.set(0, 6.2, 0);
    nameTag.scale.set(3.8, 1.5, 1);
    group.add(nameTag);

    return {
      torso,
      head,
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

    // Player Username
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.roundRect ? ctx.roundRect(cx - 80, 8, 160, 36, 8) : ctx.fillRect(cx - 80, 8, 160, 36);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(player.name, cx, 34);

    // Health Bar
    const bw = 140;
    const bh = 10;
    const healthPct = Math.max(0, Math.min(1, player.health / player.maxHealth));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(cx - bw / 2 - 2, 52, bw + 4, bh + 4);

    ctx.fillStyle = healthPct > 0.5 ? '#2ecc71' : healthPct > 0.2 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(cx - bw / 2, 54, bw * healthPct, bh);

    (nameTagSprite.material as THREE.SpriteMaterial).map!.needsUpdate = true;
  }

  /**
   * Sync a 3D Part created or updated from Luau into the WebGL scene
   */
  public syncPartFromLuau(part: WorldPartData) {
    let mesh = this.partsMap.get(part.name);
    const color = new THREE.Color(part.color || '#a4b0be');

    if (!mesh) {
      const geo = new THREE.BoxGeometry(part.size.x, part.size.y, part.size.z);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.1,
        transparent: part.transparency > 0,
        opacity: Math.max(0, 1 - part.transparency),
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = part.name;
      this.scene.add(mesh);
      this.partsMap.set(part.name, mesh);
    } else {
      // Update geometry if size changed
      const currentSize = (mesh.geometry as THREE.BoxGeometry).parameters;
      if (
        currentSize.width !== part.size.x ||
        currentSize.height !== part.size.y ||
        currentSize.depth !== part.size.z
      ) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE.BoxGeometry(part.size.x, part.size.y, part.size.z);
      }
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.copy(color);
      mat.transparent = part.transparency > 0;
      mat.opacity = Math.max(0, 1 - part.transparency);
    }

    mesh.position.set(part.position.x, part.position.y, part.position.z);
  }

  public removePart(name: string) {
    const mesh = this.partsMap.get(name);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
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
    this.cameraDistance = Math.max(3.5, Math.min(50, this.cameraDistance + delta * 0.025));
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

      // Subtle torso bob
      this.torsoMesh.position.y = 3.0 + Math.abs(Math.sin(this.walkPhase * 2)) * 0.12;
      this.headMesh.position.y = 4.625 + Math.abs(Math.sin(this.walkPhase * 2)) * 0.12;
    } else {
      // Return to idle
      this.leftLegJoint.rotation.x = 0;
      this.rightLegJoint.rotation.x = 0;
      this.leftArmJoint.rotation.x = 0;
      this.rightArmJoint.rotation.x = 0;
      this.torsoMesh.position.y = 3.0;
      this.headMesh.position.y = 4.625;
    }

    // 2. Jump & Vertical Physics
    if (input.jump && this.isOnGround) {
      this.charVelocity.y = 26;
      this.isOnGround = false;
      // Jump pose
      this.leftArmJoint.rotation.x = 2.2;
      this.rightArmJoint.rotation.x = 2.2;
      this.leftLegJoint.rotation.x = 0.25;
      this.rightLegJoint.rotation.x = -0.25;
    }

    this.charVelocity.y -= this.gravity * dt;
    this.charPos.y += this.charVelocity.y * dt;

    // 3. Collision with Baseplate & Parts
    let floorY = 0;

    for (const [name, mesh] of this.partsMap.entries()) {
      const geo = mesh.geometry as THREE.BoxGeometry;
      const sx = geo.parameters.width;
      const sy = geo.parameters.height;
      const sz = geo.parameters.depth;

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

    // Keep sun shadows centered around camera / player
    this.dirLight.position.set(eyeX + 50, eyeY + 120, eyeZ + 60);
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
