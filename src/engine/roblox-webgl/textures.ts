import * as THREE from 'three';

/**
 * Procedural texture and skybox generators for authentic Roblox Studio rendering.
 * Faithfully replicates Baseplate 2021, Classic Studs, Face decals, Spawn decals,
 * and Roblox Studio lighting atmospheres.
 */

/**
 * Generates the authentic modern "Roblox Baseplate 2021" grid texture.
 * Exactly replicates the iconic dark slate grid with 16-stud major lines,
 * 4-stud minor lines, and 1-stud ticks seen in modern Roblox Studio.
 */
export function createBaseplate2021Texture(): THREE.CanvasTexture {
  const size = 512; // 16 studs tile = 32 pixels per stud
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1. Base dark charcoal / slate grey (#20242b)
  ctx.fillStyle = '#20242b';
  ctx.fillRect(0, 0, size, size);

  // 2. Subtle 1-stud grid dots / faint lines (every 32px)
  ctx.strokeStyle = '#252b35';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // 3. 4-stud minor grid lines (every 128px)
  ctx.strokeStyle = '#2d3542';
  ctx.lineWidth = 2;
  for (let i = 0; i < size; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // 4. 16-stud major border grid lines (at borders 0 and 512)
  ctx.strokeStyle = '#434f63';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, size, size);

  // 5. Distinctive crosshair tick marks at major 4-stud and 16-stud intersections
  ctx.strokeStyle = '#5a6880';
  ctx.lineWidth = 2;
  const tickLen = 6;
  for (let x = 0; x <= size; x += 128) {
    for (let y = 0; y <= size; y += 128) {
      ctx.beginPath();
      ctx.moveTo(x - tickLen, y);
      ctx.lineTo(x + tickLen, y);
      ctx.moveTo(x, y - tickLen);
      ctx.lineTo(x, y + tickLen);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates the classic Roblox Medium Stone Grey Studs texture with 3D bevels and specular rings.
 */
export function createClassicStudsTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Classic Medium stone grey (#a3a2a5)
  ctx.fillStyle = '#a3a2a5';
  ctx.fillRect(0, 0, size, size);

  // Subtle border line
  ctx.strokeStyle = '#8f8e91';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.31;

  // Stud drop shadow
  ctx.beginPath();
  ctx.arc(cx + 2.5, cy + 2.5, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(40, 40, 42, 0.45)';
  ctx.fill();

  // Stud body gradient
  const studGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  studGrad.addColorStop(0, '#c2c1c5');
  studGrad.addColorStop(0.5, '#adacaf');
  studGrad.addColorStop(1, '#939295');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = studGrad;
  ctx.fill();

  // Outer bevel rim
  ctx.strokeStyle = '#cfcece';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Specular ring highlight
  ctx.beginPath();
  ctx.arc(cx - 1.5, cy - 1.5, r * 0.72, Math.PI * 0.9, Math.PI * 1.8);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
  return texture;
}

/**
 * Generates the iconic classic Roblox Smiley Face decal
 */
export function createRobloxFaceTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Classic Roblox oval eyes
  ctx.fillStyle = '#111111';

  // Left Eye
  ctx.beginPath();
  ctx.ellipse(82, 105, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Right Eye
  ctx.beginPath();
  ctx.ellipse(174, 105, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // White catchlights in eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(77, 98, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(169, 98, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Classic big curve smile
  ctx.beginPath();
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#111111';
  ctx.arc(128, 125, 52, Math.PI * 0.15, Math.PI * 0.85, false);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates the classic Roblox SpawnLocation 8-pointed sunburst star decal
 */
export function createSpawnDecalTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Outer ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 95, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 75, 0, Math.PI * 2);
  ctx.stroke();

  // Center 8-pointed star
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  const numPoints = 8;
  const outerR = 60;
  const innerR = 25;

  for (let i = 0; i < numPoints * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a realistic Roblox Studio Skybox dome / background texture
 * replicating the vibrant azure zenith, atmospheric horizon haze, and soft clouds.
 */
export function createRobloxSkyTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Vertical sky gradient (Zenith -> Horizon -> Below Ground)
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, '#1c62b9'); // Deep Roblox azure zenith
  grad.addColorStop(0.45, '#4a8fe7'); // Mid sky
  grad.addColorStop(0.68, '#a2cbfa'); // Atmospheric horizon haze
  grad.addColorStop(0.72, '#d4e7fd'); // Bright horizon glow
  grad.addColorStop(0.75, '#7b95ae'); // Below horizon haze
  grad.addColorStop(1.0, '#425566');  // Nadir ground

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Soft stylized Roblox puffy clouds floating along the horizon
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  const drawCloud = (cx: number, cy: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - w * 0.25, cy + h * 0.1, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + w * 0.25, cy + h * 0.1, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  drawCloud(180, 290, 140, 45);
  drawCloud(360, 275, 200, 55);
  drawCloud(620, 285, 160, 48);
  drawCloud(850, 270, 190, 52);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural material pattern overlay generator for Roblox materials:
 * Brick, Wood, DiamondPlate, Metal, Concrete, Grass, etc.
 */
const patternCache = new Map<string, THREE.CanvasTexture>();

export function getRobloxMaterialTexture(matName: string): THREE.CanvasTexture | null {
  if (patternCache.has(matName)) return patternCache.get(matName)!;

  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, S, S);

  if (matName === 'Brick' || matName === 'Cobblestone') {
    const bw = 32, bh = 16;
    for (let row = 0; row < S / bh; row++) {
      const off = (row % 2) * (bw / 2);
      for (let x = off - bw; x < S + bw; x += bw) {
        ctx.fillStyle = `rgb(${220 + (x % 30)},${220 + (x % 30)},${220 + (x % 30)})`;
        ctx.fillRect(x + 2, row * bh + 2, bw - 3, bh - 3);
      }
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    for (let row = 0; row <= S / bh; row++) {
      ctx.fillRect(0, row * bh, S, 2);
      const off = (row % 2) * (bw / 2);
      for (let x = off - bw; x < S + bw; x += bw) {
        ctx.fillRect(x, row * bh, 2, bh);
      }
    }
  } else if (matName === 'Wood' || matName === 'WoodPlanks') {
    for (let y = 0; y < S; y++) {
      const alpha = 0.04 + Math.abs(Math.sin(y * 0.15)) * 0.1;
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, y, S, 1);
    }
    for (let x = 0; x < S; x += 8) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(x, 0, 1, S);
    }
    if (matName === 'WoodPlanks') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      for (let y = 0; y < S; y += 32) ctx.fillRect(0, y, S, 2);
    }
  } else if (matName === 'DiamondPlate') {
    for (let row = 0; row < S / 8; row++) {
      for (let col = 0; col < S / 8; col++) {
        const ox = col * 8 + (row % 2) * 4;
        const oy = row * 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(ox + 4, oy);
        ctx.lineTo(ox + 8, oy + 4);
        ctx.lineTo(ox + 4, oy + 8);
        ctx.lineTo(ox, oy + 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }
    }
  } else if (matName === 'Metal') {
    for (let y = 0; y < S; y++) {
      ctx.fillStyle = `rgba(0, 0, 0, ${(y % 7) * 0.02})`;
      ctx.fillRect(0, y, S, 1);
    }
  } else if (matName === 'Concrete') {
    const id = ctx.createImageData(S, S);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 215 + ((i * 17) % 35);
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
  } else {
    return null;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  patternCache.set(matName, tex);
  return tex;
}
