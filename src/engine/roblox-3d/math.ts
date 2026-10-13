/**
 * High-performance 3D Vector & Matrix Math for the Custom Roblox Engine
 * Zero external dependencies (no Three.js).
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function vAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vSub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vScale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vDot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vCross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function vLength(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function vNormalize(v: Vec3): Vec3 {
  const len = vLength(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function vDist(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function vLerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

// 4x4 Matrix for 3D Camera & Model-View-Projection Transforms
export type Mat4 = Float32Array;

export function mat4Create(): Mat4 {
  const out = new Float32Array(16);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

export function mat4Perspective(fovRad: number, aspect: number, near: number, far: number): Mat4 {
  const out = new Float32Array(16);
  const f = 1.0 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);

  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  const out = new Float32Array(16);

  let z0 = eye.x - target.x;
  let z1 = eye.y - target.y;
  let z2 = eye.z - target.z;
  let len = Math.hypot(z0, z1, z2);
  if (len === 0) {
    z2 = 1;
  } else {
    z0 /= len;
    z1 /= len;
    z2 /= len;
  }

  let x0 = up.y * z2 - up.z * z1;
  let x1 = up.z * z0 - up.x * z2;
  let x2 = up.x * z1 - up.y * z0;
  len = Math.hypot(x0, x1, x2);
  if (len === 0) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    x0 /= len;
    x1 /= len;
    x2 /= len;
  }

  let y0 = z1 * x2 - z2 * x1;
  let y1 = z2 * x0 - z0 * x2;
  let y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);
  if (len === 0) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    y0 /= len;
    y1 /= len;
    y2 /= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eye.x + x1 * eye.y + x2 * eye.z);
  out[13] = -(y0 * eye.x + y1 * eye.y + y2 * eye.z);
  out[14] = -(z0 * eye.x + z1 * eye.y + z2 * eye.z);
  out[15] = 1;

  return out;
}

export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      out[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
    }
  }
  return out;
}

export function projectPoint(p: Vec3, mvp: Mat4, width: number, height: number): { x: number; y: number; z: number; visible: boolean } {
  const x = p.x * mvp[0] + p.y * mvp[4] + p.z * mvp[8] + mvp[12];
  const y = p.x * mvp[1] + p.y * mvp[5] + p.z * mvp[9] + mvp[13];
  const z = p.x * mvp[2] + p.y * mvp[6] + p.z * mvp[10] + mvp[14];
  const w = p.x * mvp[3] + p.y * mvp[7] + p.z * mvp[11] + mvp[15];

  if (w <= 0.05) {
    return { x: 0, y: 0, z: -1, visible: false };
  }

  const ndcX = x / w;
  const ndcY = y / w;
  const ndcZ = z / w;

  return {
    x: ((ndcX + 1) * 0.5) * width,
    y: ((1 - ndcY) * 0.5) * height,
    z: ndcZ,
    visible: ndcZ >= -1 && ndcZ <= 1,
  };
}
