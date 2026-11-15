/**
 * Yiri's facial expressions and waving pose, as pure Three.js helpers.
 *
 * No React or path aliases here, so it can also run in Node for geometry checks.
 *
 * The GLB has no morph targets. The face is reshaped by deforming the vertices of
 * the mouth tube (`Yiri_Boca`) and the eyebrows (`Yiri_Ceja_*`) from a copy of their
 * original positions:
 * - mouth: each slice of the tube moves vertically along a parabola, so its
 *   thickness is kept while the curve goes from smile (1) through flat (0) to frown (-1);
 * - eyebrows: rotated around their own centre (inner ends up = sad) and lifted.
 */
import * as THREE from "three"

export type FaceStatus = "stable" | "observation" | "critical" | "unknown"

export interface Expression {
  /** Mouth curvature: 1 = original smile ":)", 0 = straight ":|", -1 = frown ":(". */
  mouthCurve: number
  /** Mouth width relative to the original. */
  mouthWidth: number
  /** Eyebrow tilt in radians: > 0 raises the inner ends (worried/sad), < 0 lowers them (serious). */
  browAngle: number
  /** Vertical eyebrow offset in model units. */
  browLift: number
  /** Extra forward head tilt in radians (a slight droop when sad). */
  headDroop: number
}

const HAPPY: Expression = { mouthCurve: 1, mouthWidth: 1, browAngle: 0, browLift: 0, headDroop: 0 }

export const EXPRESSIONS: Record<FaceStatus, Expression> = {
  stable: HAPPY,
  unknown: HAPPY,
  // ":|" serious, focused
  observation: { mouthCurve: 0, mouthWidth: 0.82, browAngle: -0.26, browLift: -0.004, headDroop: 0.02 },
  // ":(" sad
  critical: { mouthCurve: -0.9, mouthWidth: 0.92, browAngle: 0.32, browLift: 0.005, headDroop: 0.09 },
}

const KEYS = ["mouthCurve", "mouthWidth", "browAngle", "browLift", "headDroop"] as const

/** Ease `current` toward `target` in place; returns true if anything visibly changed. */
export function stepExpression(current: Expression, target: Expression, delta: number): boolean {
  const alpha = 1 - Math.exp(-delta * 6)
  let changed = false
  for (const key of KEYS) {
    const next = current[key] + (target[key] - current[key]) * alpha
    if (Math.abs(next - current[key]) > 1e-5) changed = true
    current[key] = Math.abs(target[key] - next) < 1e-5 ? target[key] : next
  }
  return changed
}

// ---------------------------------------------------------------------------- face rig

interface Deformable {
  attribute: THREE.BufferAttribute
  base: Float32Array
  cx: number
  cy: number
  halfWidth: number
}

interface MouthDeformable extends Deformable {
  /** Smile depth: centre-line y = a + k·u², with u in [-1, 1] across the mouth. */
  k: number
}

export interface FaceRig {
  mouth?: MouthDeformable
  brows: Deformable[]
  dispose(): void
}

function makeDeformable(mesh: THREE.Mesh): Deformable {
  // Cloned scenes share geometry: give this instance its own copy before editing it.
  mesh.geometry = mesh.geometry.clone()
  const attribute = mesh.geometry.getAttribute("position") as THREE.BufferAttribute
  const base = Float32Array.from(attribute.array as ArrayLike<number>)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < base.length; i += 3) {
    minX = Math.min(minX, base[i]); maxX = Math.max(maxX, base[i])
    minY = Math.min(minY, base[i + 1]); maxY = Math.max(maxY, base[i + 1])
  }
  return { attribute, base, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, halfWidth: (maxX - minX) / 2 || 1 }
}

/** Least-squares fit of y = a + k·u² over the tube's vertices (the cross-section averages out). */
function fitSmile(d: Deformable): number {
  let n = 0, su = 0, sy = 0, suu = 0, suy = 0
  for (let i = 0; i < d.base.length; i += 3) {
    const u = (d.base[i] - d.cx) / d.halfWidth
    const u2 = u * u
    const y = d.base[i + 1]
    n++; su += u2; sy += y; suu += u2 * u2; suy += u2 * y
  }
  const denom = n * suu - su * su
  return denom === 0 ? 0 : (n * suy - su * sy) / denom
}

export function createFaceRig(root: THREE.Object3D): FaceRig {
  const owned: THREE.BufferGeometry[] = []
  const find = (name: string) => {
    const node = root.getObjectByName(name)
    return node && (node as THREE.Mesh).isMesh ? (node as THREE.Mesh) : undefined
  }

  const mouthMesh = find("Yiri_Boca")
  let mouth: MouthDeformable | undefined
  if (mouthMesh) {
    const d = makeDeformable(mouthMesh)
    owned.push(mouthMesh.geometry)
    mouth = { ...d, k: fitSmile(d) }
  }

  const brows: Deformable[] = []
  for (const name of ["Yiri_Ceja_Der", "Yiri_Ceja_Izq"]) {
    const mesh = find(name)
    if (!mesh) continue
    brows.push(makeDeformable(mesh))
    owned.push(mesh.geometry)
  }

  return { mouth, brows, dispose: () => owned.forEach((g) => g.dispose()) }
}

export function applyExpression(rig: FaceRig, e: Expression) {
  const { mouth } = rig
  if (mouth) {
    const { base, cx, halfWidth, k } = mouth
    const out = mouth.attribute.array as Float32Array
    for (let i = 0; i < base.length; i += 3) {
      const dx = base[i] - cx
      const u = dx / halfWidth
      out[i] = cx + dx * e.mouthWidth
      out[i + 1] = base[i + 1] + (e.mouthCurve - 1) * k * u * u
      out[i + 2] = base[i + 2]
    }
    mouth.attribute.needsUpdate = true
  }

  for (const brow of rig.brows) {
    const { base, cx, cy } = brow
    // The inner end points toward the face's centre line (x = 0).
    const angle = e.browAngle * (cx < 0 ? 1 : -1)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const out = brow.attribute.array as Float32Array
    for (let i = 0; i < base.length; i += 3) {
      const dx = base[i] - cx
      const dy = base[i + 1] - cy
      out[i] = cx + dx * cos - dy * sin
      out[i + 1] = cy + dx * sin + dy * cos + e.browLift
      out[i + 2] = base[i + 2]
    }
    brow.attribute.needsUpdate = true
  }
}

// ---------------------------------------------------------------------------- waving

export interface ArmPose {
  x: number
  y: number
  z: number
}

/**
 * Right-arm pose while waving. The arm stays raised above the shoulder the whole
 * time (z rotation between about -1.88 and -2.36 rad, where -π/2 is horizontal) and
 * swings side to side like a hand waving hello. The positive x rotation brings it
 * slightly forward so the hand passes in front of the headphones, not through them.
 */
export function wavingArmPose(t: number): ArmPose {
  const swing = Math.sin(t * 6.2)
  return {
    z: -2.12 + swing * 0.24,
    x: 0.5 + Math.cos(t * 6.2) * 0.06,
    y: swing * 0.2,
  }
}

export const WAVE_RAISED_LIMIT = -Math.PI / 2 // the arm never comes down past horizontal
