import * as THREE from 'three';

/**
 * Procedural texture generators for authentic Roblox Studs, Face decals, and Spawn decals.
 * Zero external asset dependencies - instantly available and razor-sharp.
 */

/**
 * Generates the classic Roblox Studs texture with circular studs and specular highlights
 */
export function createStudsTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark stone gray base
  ctx.fillStyle = '#595d62';
  ctx.fillRect(0, 0, size, size);

  // Subtle grid border
  ctx.strokeStyle = '#484b50';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  // Center Stud circle (cylinder top)
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.32;

  // Stud drop shadow
  ctx.beginPath();
  ctx.arc(cx + 3, cy + 3, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(25, 27, 30, 0.4)';
  ctx.fill();

  // Stud body
  const studGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  studGrad.addColorStop(0, '#6e7278');
  studGrad.addColorStop(0.5, '#5d6166');
  studGrad.addColorStop(1, '#4f5257');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = studGrad;
  ctx.fill();

  // Outer bevel rim
  ctx.strokeStyle = '#7c8087';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Specular ring highlight
  ctx.beginPath();
  ctx.arc(cx - 2, cy - 2, r * 0.75, Math.PI * 0.9, Math.PI * 1.8);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

/**
 * Generates the classic iconic Roblox Smiley Face texture
 */
export function createRobloxFaceTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Eyes (Classic Roblox oval eyes)
  ctx.fillStyle = '#111111';

  // Left Eye
  ctx.beginPath();
  ctx.ellipse(82, 105, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Right Eye
  ctx.beginPath();
  ctx.ellipse(174, 105, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
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
 * Generates the classic Roblox SpawnLocation star/sunburst decal
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
