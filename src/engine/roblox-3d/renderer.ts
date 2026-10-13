import type { Vec3, Mat4 } from './math';
import {
  vAdd,
  vSub,
  vScale,
  vDot,
  vNormalize,
  mat4Perspective,
  mat4LookAt,
  mat4Multiply,
  projectPoint,
} from './math';

export interface RenderPart {
  id: string;
  name: string;
  position: Vec3;
  size: Vec3;
  rotation: Vec3; // Euler angles in radians (X, Y, Z)
  color: string; // Hex or CSS color
  transparency: number;
  anchored: boolean;
  canCollide: boolean;
  shape: 'Block' | 'Ball' | 'Cylinder';
}

export interface CharacterState {
  position: Vec3; // HumanoidRootPart position
  rotationY: number; // Face angle in radians
  walkCycle: number; // Animation phase (0 to 2*PI)
  isMoving: boolean;
  isJumping: boolean;
  health: number;
  maxHealth: number;
  name: string;
  walkSpeed: number;
}

interface ProjectedQuad {
  points: Array<{ x: number; y: number }>;
  avgDepth: number;
  color: string;
  strokeColor?: string;
  hasStuds?: boolean;
}

export class Roblox3DRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  // Sun & Lighting constants
  public sunDir: Vec3 = vNormalize({ x: 0.45, y: 0.85, z: 0.35 });
  public ambientLight = 0.45;
  public sunLight = 0.55;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Main render loop
   */
  public render(
    parts: RenderPart[],
    character: CharacterState | null,
    cameraPos: Vec3,
    cameraTarget: Vec3
  ) {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    // 1. Build View and Projection Matrices
    const fov = (70 * Math.PI) / 180;
    const aspect = width / height;
    const proj = mat4Perspective(fov, aspect, 0.5, 500);
    const view = mat4LookAt(cameraPos, cameraTarget, { x: 0, y: 1, z: 0 });
    const mvp = mat4Multiply(proj, view);

    // 2. Render Roblox Sky & Sun
    this.renderSkyAndSun(cameraPos, cameraTarget, mvp);

    // 3. Collect all 3D Quads (Baseplate, Parts, Character limbs)
    const quads: ProjectedQuad[] = [];

    // Baseplate
    this.collectBaseplateQuads(quads, mvp, cameraPos);

    // Dynamic Parts
    for (const part of parts) {
      this.collectBoxQuads(
        quads,
        mvp,
        part.position,
        part.size,
        part.rotation,
        part.color,
        part.transparency,
        cameraPos,
        true // Enable studs on top face of parts
      );
    }

    // Player Character Avatar (R6 Model)
    if (character) {
      this.collectCharacterQuads(quads, mvp, character, cameraPos);
    }

    // 4. Sort Quads from furthest to nearest (Painter's Algorithm)
    quads.sort((a, b) => b.avgDepth - a.avgDepth);

    // 5. Draw Quads to Canvas
    for (const q of quads) {
      ctx.beginPath();
      ctx.moveTo(q.points[0].x, q.points[0].y);
      for (let i = 1; i < q.points.length; i++) {
        ctx.lineTo(q.points[i].x, q.points[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = q.color;
      ctx.fill();

      if (q.strokeColor) {
        ctx.strokeStyle = q.strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw stud dots on top faces if marked
      if (q.hasStuds) {
        this.drawStudsOnQuad(q);
      }
    }

    // 6. Draw 2D Billboard GUI (Character Name & Health Bar)
    if (character) {
      this.renderCharacterBillboard(character, mvp);
    }
  }

  /**
   * Render Roblox Sky gradient and Sun
   */
  private renderSkyAndSun(eye: Vec3, _target: Vec3, mvp: Mat4) {
    const { ctx, width, height } = this;

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#4a90e2'); // High sky blue
    skyGrad.addColorStop(0.5, '#7fb3f5'); // Mid sky
    skyGrad.addColorStop(0.75, '#cce0ff'); // Horizon haze
    skyGrad.addColorStop(1, '#dfe6e9'); // Horizon ground blend

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Sun disc in perspective
    const sunWorldPos: Vec3 = vAdd(eye, vScale(this.sunDir, 200));
    const sunProj = projectPoint(sunWorldPos, mvp, width, height);

    if (sunProj.visible && sunProj.z > 0) {
      // Sun glow
      const sunGlow = ctx.createRadialGradient(
        sunProj.x,
        sunProj.y,
        5,
        sunProj.x,
        sunProj.y,
        65
      );
      sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sunGlow.addColorStop(0.2, 'rgba(255, 245, 200, 0.7)');
      sunGlow.addColorStop(0.6, 'rgba(255, 220, 150, 0.2)');
      sunGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');

      ctx.beginPath();
      ctx.arc(sunProj.x, sunProj.y, 65, 0, Math.PI * 2);
      ctx.fillStyle = sunGlow;
      ctx.fill();

      // Sharp sun core
      ctx.beginPath();
      ctx.arc(sunProj.x, sunProj.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }

  /**
   * Collect Baseplate grid tiles
   */
  private collectBaseplateQuads(quads: ProjectedQuad[], mvp: Mat4, eye: Vec3) {
    const baseplateSize = 256;
    const tileSize = 16;
    const half = baseplateSize / 2;

    // Draw checkered grid tiles around center
    const startX = -half;
    const endX = half;
    const startZ = -half;
    const endZ = half;

    for (let x = startX; x < endX; x += tileSize) {
      for (let z = startZ; z < endZ; z += tileSize) {
        // Skip tiles too far from camera for performance
        const tileCenter = { x: x + tileSize / 2, y: 0, z: z + tileSize / 2 };
        if (Math.hypot(tileCenter.x - eye.x, tileCenter.z - eye.z) > 180) continue;

        const p0 = projectPoint({ x, y: 0, z }, mvp, this.width, this.height);
        const p1 = projectPoint({ x: x + tileSize, y: 0, z }, mvp, this.width, this.height);
        const p2 = projectPoint({ x: x + tileSize, y: 0, z: z + tileSize }, mvp, this.width, this.height);
        const p3 = projectPoint({ x, y: 0, z: z + tileSize }, mvp, this.width, this.height);

        if (p0.visible && p1.visible && p2.visible && p3.visible) {
          const isCheckered = ((Math.floor(x / tileSize) + Math.floor(z / tileSize)) % 2 === 0);
          const baseColor = isCheckered ? '#53575e' : '#4b4f56';
          const avgDepth = (p0.z + p1.z + p2.z + p3.z) / 4;

          quads.push({
            points: [p0, p1, p2, p3],
            avgDepth,
            color: baseColor,
            strokeColor: '#3d4046',
            hasStuds: true,
          });
        }
      }
    }
  }

  /**
   * Collect a 3D Box (Part, Limbs) and decompose into shaded quads
   */
  private collectBoxQuads(
    quads: ProjectedQuad[],
    mvp: Mat4,
    pos: Vec3,
    size: Vec3,
    rot: Vec3,
    baseColor: string,
    transparency = 0,
    eye: Vec3,
    enableTopStuds = false
  ) {
    const hx = size.x / 2;
    const hy = size.y / 2;
    const hz = size.z / 2;

    // 8 local corners
    const localCorners: Vec3[] = [
      { x: -hx, y: -hy, z: -hz }, // 0
      { x: hx, y: -hy, z: -hz },  // 1
      { x: hx, y: hy, z: -hz },   // 2
      { x: -hx, y: hy, z: -hz },  // 3
      { x: -hx, y: -hy, z: hz },  // 4
      { x: hx, y: -hy, z: hz },   // 5
      { x: hx, y: hy, z: hz },    // 6
      { x: -hx, y: hy, z: hz },   // 7
    ];

    // Transform by rotation and position
    const cosY = Math.cos(rot.y);
    const sinY = Math.sin(rot.y);
    const cosX = Math.cos(rot.x);
    const sinX = Math.sin(rot.x);

    const worldCorners = localCorners.map((lc) => {
      // Rotate around X, then Y
      let y1 = lc.y * cosX - lc.z * sinX;
      let z1 = lc.y * sinX + lc.z * cosX;
      let x2 = lc.x * cosY + z1 * sinY;
      let z2 = -lc.x * sinY + z1 * cosY;

      return {
        x: x2 + pos.x,
        y: y1 + pos.y,
        z: z2 + pos.z,
      };
    });

    // Face definitions (indices into corners and local normals)
    const faces = [
      { indices: [3, 2, 6, 7], normal: { x: 0, y: 1, z: 0 }, isTop: true },   // Top (+Y)
      { indices: [0, 4, 5, 1], normal: { x: 0, y: -1, z: 0 }, isTop: false }, // Bottom (-Y)
      { indices: [4, 5, 6, 7], normal: { x: 0, y: 0, z: 1 }, isTop: false },  // Front (+Z)
      { indices: [1, 0, 3, 2], normal: { x: 0, y: 0, z: -1 }, isTop: false }, // Back (-Z)
      { indices: [5, 1, 2, 6], normal: { x: 1, y: 0, z: 0 }, isTop: false },  // Right (+X)
      { indices: [0, 4, 7, 3], normal: { x: -1, y: 0, z: 0 }, isTop: false }, // Left (-X)
    ];

    for (const f of faces) {
      // Rotate normal
      let ny1 = f.normal.y * cosX - f.normal.z * sinX;
      let nz1 = f.normal.y * sinX + f.normal.z * cosX;
      let nx2 = f.normal.x * cosY + nz1 * sinY;
      let nz2 = -f.normal.x * sinY + nz1 * cosY;
      const worldNormal = { x: nx2, y: ny1, z: nz2 };

      // Back-face culling relative to camera eye
      const faceCenter = {
        x: (worldCorners[f.indices[0]].x + worldCorners[f.indices[2]].x) / 2,
        y: (worldCorners[f.indices[0]].y + worldCorners[f.indices[2]].y) / 2,
        z: (worldCorners[f.indices[0]].z + worldCorners[f.indices[2]].z) / 2,
      };
      const viewDir = vNormalize(vSub(eye, faceCenter));
      if (vDot(worldNormal, viewDir) <= 0.05) continue; // Face pointing away

      // Project 4 vertices
      const pts = f.indices.map((idx) => projectPoint(worldCorners[idx], mvp, this.width, this.height));
      if (pts.some((p) => !p.visible)) continue;

      // Compute shading color
      const ndotl = Math.max(0, vDot(worldNormal, this.sunDir));
      const lightFactor = this.ambientLight + ndotl * this.sunLight;
      const shadedColor = this.applyLighting(baseColor, lightFactor, f.isTop, transparency);

      const avgDepth = (pts[0].z + pts[1].z + pts[2].z + pts[3].z) / 4;

      quads.push({
        points: pts,
        avgDepth,
        color: shadedColor,
        strokeColor: 'rgba(0, 0, 0, 0.15)',
        hasStuds: f.isTop && enableTopStuds,
      });
    }

    // Drop shadow under part if near baseplate
    if (pos.y > 0 && pos.y < 35 && transparency < 0.8) {
      const shadowH = 0.02;
      const shadowPts = [
        projectPoint({ x: pos.x - hx, y: shadowH, z: pos.z - hz }, mvp, this.width, this.height),
        projectPoint({ x: pos.x + hx, y: shadowH, z: pos.z - hz }, mvp, this.width, this.height),
        projectPoint({ x: pos.x + hx, y: shadowH, z: pos.z + hz }, mvp, this.width, this.height),
        projectPoint({ x: pos.x - hx, y: shadowH, z: pos.z + hz }, mvp, this.width, this.height),
      ];
      if (shadowPts.every((p) => p.visible)) {
        quads.push({
          points: shadowPts,
          avgDepth: (shadowPts[0].z + shadowPts[1].z + shadowPts[2].z + shadowPts[3].z) / 4 - 0.0001,
          color: 'rgba(25, 27, 33, 0.45)',
        });
      }
    }
  }

  /**
   * Collect Classic R6 Character Avatar limbs (Head, Torso, Arms, Legs)
   */
  private collectCharacterQuads(
    quads: ProjectedQuad[],
    mvp: Mat4,
    char: CharacterState,
    eye: Vec3
  ) {
    const { position, rotationY, walkCycle, isMoving, isJumping } = char;

    // Animation swings
    const legSwing = isMoving ? Math.sin(walkCycle) * 0.65 : 0;
    const armSwing = isMoving ? -Math.sin(walkCycle) * 0.65 : 0;
    const bobbing = isMoving ? Math.abs(Math.sin(walkCycle * 2)) * 0.15 : 0;

    const basePosY = position.y + bobbing;

    // Torso: 2 x 2 x 1, Royal Blue (#0652dd)
    const torsoPos: Vec3 = { x: position.x, y: basePosY + 3.0, z: position.z };
    this.collectBoxQuads(
      quads,
      mvp,
      torsoPos,
      { x: 2, y: 2, z: 1 },
      { x: 0, y: rotationY, z: 0 },
      '#0652dd',
      0,
      eye
    );

    // Head: 1.25 x 1.25 x 1.25, Bright Yellow (#ffd32a)
    const headPos: Vec3 = { x: position.x, y: basePosY + 4.5, z: position.z };
    this.collectBoxQuads(
      quads,
      mvp,
      headPos,
      { x: 1.25, y: 1.25, z: 1.25 },
      { x: 0, y: rotationY, z: 0 },
      '#ffd32a',
      0,
      eye
    );

    // Left Arm & Right Arm: 1 x 2 x 1, Bright Yellow
    // Left Arm (player's left = right when facing camera)
    const armOffsetX = Math.cos(rotationY) * 1.5;
    const armOffsetZ = -Math.sin(rotationY) * 1.5;

    const leftArmPos: Vec3 = {
      x: position.x - armOffsetX,
      y: basePosY + 3.0,
      z: position.z - armOffsetZ,
    };
    this.collectBoxQuads(
      quads,
      mvp,
      leftArmPos,
      { x: 1, y: 2, z: 1 },
      { x: isJumping ? -1.2 : armSwing, y: rotationY, z: 0 },
      '#ffd32a',
      0,
      eye
    );

    const rightArmPos: Vec3 = {
      x: position.x + armOffsetX,
      y: basePosY + 3.0,
      z: position.z + armOffsetZ,
    };
    this.collectBoxQuads(
      quads,
      mvp,
      rightArmPos,
      { x: 1, y: 2, z: 1 },
      { x: isJumping ? -1.2 : -armSwing, y: rotationY, z: 0 },
      '#ffd32a',
      0,
      eye
    );

    // Left Leg & Right Leg: 1 x 2 x 1, Classic Green (#009432)
    const legOffsetX = Math.cos(rotationY) * 0.5;
    const legOffsetZ = -Math.sin(rotationY) * 0.5;

    const leftLegPos: Vec3 = {
      x: position.x - legOffsetX,
      y: basePosY + 1.0,
      z: position.z - legOffsetZ,
    };
    this.collectBoxQuads(
      quads,
      mvp,
      leftLegPos,
      { x: 1, y: 2, z: 1 },
      { x: isJumping ? 0.3 : legSwing, y: rotationY, z: 0 },
      '#009432',
      0,
      eye
    );

    const rightLegPos: Vec3 = {
      x: position.x + legOffsetX,
      y: basePosY + 1.0,
      z: position.z + legOffsetZ,
    };
    this.collectBoxQuads(
      quads,
      mvp,
      rightLegPos,
      { x: 1, y: 2, z: 1 },
      { x: isJumping ? 0.3 : -legSwing, y: rotationY, z: 0 },
      '#009432',
      0,
      eye
    );

    // Character Drop Shadow on Floor
    const shadowP0 = projectPoint({ x: position.x - 1.2, y: 0.03, z: position.z - 1.2 }, mvp, this.width, this.height);
    const shadowP1 = projectPoint({ x: position.x + 1.2, y: 0.03, z: position.z - 1.2 }, mvp, this.width, this.height);
    const shadowP2 = projectPoint({ x: position.x + 1.2, y: 0.03, z: position.z + 1.2 }, mvp, this.width, this.height);
    const shadowP3 = projectPoint({ x: position.x - 1.2, y: 0.03, z: position.z + 1.2 }, mvp, this.width, this.height);
    if (shadowP0.visible && shadowP1.visible && shadowP2.visible && shadowP3.visible) {
      quads.push({
        points: [shadowP0, shadowP1, shadowP2, shadowP3],
        avgDepth: (shadowP0.z + shadowP1.z + shadowP2.z + shadowP3.z) / 4 - 0.0002,
        color: 'rgba(20, 22, 28, 0.55)',
      });
    }
  }

  /**
   * Draw Billboard name tag & health bar above player head
   */
  private renderCharacterBillboard(char: CharacterState, mvp: Mat4) {
    const headTopWorld: Vec3 = { x: char.position.x, y: char.position.y + 5.8, z: char.position.z };
    const p = projectPoint(headTopWorld, mvp, this.width, this.height);

    if (!p.visible || p.z < 0) return;

    const { ctx } = this;
    const x = p.x;
    const y = p.y;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Username tag
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    const text = char.name || 'Player1';
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(x - textWidth / 2 - 6, y - 26, textWidth + 12, 18);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y - 11);

    // Health Bar
    const barWidth = 60;
    const barHeight = 6;
    const healthPct = Math.max(0, Math.min(1, char.health / char.maxHealth));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(x - barWidth / 2 - 1, y - 6, barWidth + 2, barHeight + 2);

    ctx.fillStyle = healthPct > 0.5 ? '#2ecc71' : healthPct > 0.2 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(x - barWidth / 2, y - 5, barWidth * healthPct, barHeight);

    ctx.restore();
  }

  /**
   * Draw stud dots in perspective on a quad
   */
  private drawStudsOnQuad(quad: ProjectedQuad) {
    const { ctx } = this;
    const center = {
      x: (quad.points[0].x + quad.points[2].x) / 2,
      y: (quad.points[0].y + quad.points[2].y) / 2,
    };
    const rad = Math.max(1.5, Math.min(5, 12 / Math.max(0.5, quad.avgDepth * 10)));

    ctx.beginPath();
    ctx.arc(center.x, center.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center.x + 0.5, center.y + 0.5, rad, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  /**
   * Lighting calculation helper
   */
  private applyLighting(hexColor: string, factor: number, isTop: boolean, transparency = 0): string {
    // Top faces get extra crisp daylight boost
    const adjustedFactor = isTop ? Math.min(1.25, factor * 1.2) : factor;

    // Parse hex
    let r = 128, g = 128, b = 128;
    if (hexColor.startsWith('#')) {
      const c = hexColor.slice(1);
      if (c.length === 3) {
        r = parseInt(c[0] + c[0], 16);
        g = parseInt(c[1] + c[1], 16);
        b = parseInt(c[2] + c[2], 16);
      } else if (c.length === 6) {
        r = parseInt(c.slice(0, 2), 16);
        g = parseInt(c.slice(2, 4), 16);
        b = parseInt(c.slice(4, 6), 16);
      }
    }

    const finalR = Math.min(255, Math.max(0, Math.round(r * adjustedFactor)));
    const finalG = Math.min(255, Math.max(0, Math.round(g * adjustedFactor)));
    const finalB = Math.min(255, Math.max(0, Math.round(b * adjustedFactor)));

    if (transparency > 0) {
      const alpha = Math.max(0, Math.min(1, 1 - transparency));
      return `rgba(${finalR}, ${finalG}, ${finalB}, ${alpha.toFixed(2)})`;
    }

    return `rgb(${finalR}, ${finalG}, ${finalB})`;
  }
}
