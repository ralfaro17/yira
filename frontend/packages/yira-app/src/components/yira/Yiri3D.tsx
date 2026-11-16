import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react"
import { useTranslation } from "react-i18next"
import * as THREE from "three"
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js"
import { clone } from "three/addons/utils/SkeletonUtils.js"

import type { CrewStatus } from "@/api/types"
import { cn } from "@/lib/utils"

import {
  EXPRESSIONS,
  applyExpression,
  createFaceRig,
  stepExpression,
  wavingArmPose,
  type Expression,
  type FaceRig,
} from "./yiri/expressions"

export type YiriAnimationMode = "idle" | "wave" | "spin"

export interface Yiri3DProps extends HTMLAttributes<HTMLDivElement> {
  /** Animation preset: "idle" (gentle float & head tilt), "wave" (waving right arm), "spin" (horizontal 360 spin) */
  mode?: YiriAnimationMode
  /** When true, forces the horizontal spin animation (used during active scan execution) */
  isScanning?: boolean
  /** Health status for accent coloring: stable (blue), observation (amber), critical (red) */
  status?: CrewStatus
  /** Fallback image URL shown while loading or if WebGL is disabled */
  fallbackSrc?: string
  alt?: string
  /** Scale multiplier of the model (default 1) */
  modelScale?: number
  /** Distance of the camera from the model (default 1.85) */
  cameraDistance?: number
  /** Whether the mascot follows pointer / cursor movements (default true) */
  interactive?: boolean
  className?: string
  style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Model cache: download and parse the 3D GLB file once for the whole app
// ---------------------------------------------------------------------------
let cachedGLTFPromise: Promise<GLTF> | null = null

function getYiriGLTF(): Promise<GLTF> {
  if (!cachedGLTFPromise) {
    const loader = new GLTFLoader()
    cachedGLTFPromise = new Promise<GLTF>((resolve, reject) => {
      // Primary clean URL served by sharedPublic / public
      loader.load(
        "/yira/yiri.glb",
        (gltf) => resolve(gltf),
        undefined,
        () => {
          // Fallback to URL-encoded filename if needed
          loader.load(
            "/YIRI_MODELO_3D_FIEL.glb%202b.glb",
            (gltf) => resolve(gltf),
            undefined,
            (err) => {
              cachedGLTFPromise = null
              reject(err)
            },
          )
        },
      )
    })
  }
  return cachedGLTFPromise
}

let webglSupport: boolean | undefined

function supportsWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport
  try {
    const probe = document.createElement("canvas")
    webglSupport = !!(probe.getContext("webgl2") || probe.getContext("webgl"))
  } catch {
    webglSupport = false
  }
  return webglSupport
}

// Status accent colors for Yiri's headphones, hair tuft, headband and eyebrows
const ACCENT_COLORS: Record<CrewStatus, { main: number; dark: number }> = {
  stable: { main: 0x1948ad, dark: 0x0a3c90 },
  observation: { main: 0xf59e0b, dark: 0xb45309 },
  critical: { main: 0xef4444, dark: 0x991b1b },
  unknown: { main: 0x1948ad, dark: 0x0a3c90 },
}

/**
 * Interactive 3D Mascot Yiri rendered with Three.js from the high-fidelity GLB.
 *
 * Supports:
 * - "wave": Energetic arm-waving hello (used on login and welcome screens)
 * - "spin": Fast horizontal 360° spin (triggered when executing scans)
 * - "idle": Organic floating, breathing scale, curiosity head tilts, and pointer tracking
 * - Status-based accent lighting and material tinting (stable/blue, observation/amber, critical/red)
 * - Status-based facial expression: smile ":)" (stable), serious ":|" (observation), sad ":(" (critical)
 */
export function Yiri3D({
  mode = "idle",
  isScanning = false,
  status = "stable",
  fallbackSrc = "/yira/login/mascot-waving.png",
  alt: altProp,
  modelScale = 1,
  cameraDistance = 1.85,
  interactive = true,
  className,
  style,
  ...rest
}: Yiri3DProps) {
  const { t } = useTranslation()
  const alt = altProp ?? t("layout.yiriAlt")
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [webglOk] = useState(supportsWebGL)
  const [loadFailed, setLoadFailed] = useState(false)
  const hasError = !webglOk || loadFailed

  // Current animation mode: isScanning prop overrides mode to "spin"
  const activeMode: YiriAnimationMode = isScanning ? "spin" : mode

  // Mutable refs read by the animation loop (synced after render, never during it)
  const modeRef = useRef(activeMode)
  const statusRef = useRef(status)
  const interactiveRef = useRef(interactive)
  useEffect(() => {
    modeRef.current = activeMode
    statusRef.current = status
    interactiveRef.current = interactive
  }, [activeMode, status, interactive])

  // Pointer position normalized to [-1, 1]
  const pointerTarget = useRef({ x: 0, y: 0 })
  const pointerCurrent = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    let isDisposed = false
    let animationFrameId = 0
    let isVisible = true

    // 1. Scene setup
    const scene = new THREE.Scene()

    // 2. Camera setup
    const initialWidth = container.clientWidth || 300
    const initialHeight = container.clientHeight || 300
    const camera = new THREE.PerspectiveCamera(36, initialWidth / initialHeight, 0.1, 25)
    camera.position.set(0, 0, cameraDistance)

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(initialWidth, initialHeight, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // 4. Lighting setup
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.4)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
    keyLight.position.set(2, 3, 3)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.2)
    rimLight.position.set(-2.5, 1.5, -2)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6)
    fillLight.position.set(0, -1, 2)
    scene.add(fillLight)

    // 5. Load model and attach to scene
    let rigNode: THREE.Object3D | null = null
    let cuerpoPivot: THREE.Object3D | null = null
    let cabezaPivot: THREE.Object3D | null = null
    let armDerPivot: THREE.Object3D | null = null
    let armIzqPivot: THREE.Object3D | null = null
    let mechonPivot: THREE.Object3D | null = null

    // Materials to tint with status color
    const accentMaterials: { mat: THREE.MeshStandardMaterial; isDark: boolean }[] = []

    // Facial expression (mouth + eyebrows), eased toward the current status
    let faceRig: FaceRig | null = null
    const expression: Expression = { ...EXPRESSIONS[statusRef.current] }

    // 0 = arm in the current mode's pose, 1 = fully raised waving pose (eased, so it never snaps)
    let waveBlend = modeRef.current === "wave" ? 1 : 0

    getYiriGLTF()
      .then((gltf) => {
        if (isDisposed) return

        // Deep-clone scene graph
        const mascotRoot = clone(gltf.scene)

        // Remove studio camera & sample swatches from the Blender export
        const unwanted = ["MUESTRA_Azul", "MUESTRA_Azul_Oscuro", "MUESTRA_Blanco", "Estudio_Objetivo"]
        unwanted.forEach((name) => {
          const node = mascotRoot.getObjectByName(name)
          if (node) {
            node.visible = false
            node.parent?.remove(node)
          }
        })

        // Locate pivots
        rigNode = mascotRoot.getObjectByName("RIG_YIRI") || mascotRoot
        cuerpoPivot = mascotRoot.getObjectByName("PIVOT_CUERPO") || null
        cabezaPivot = mascotRoot.getObjectByName("PIVOT_CABEZA") || null
        armDerPivot = mascotRoot.getObjectByName("PIVOT_BRAZO_DER") || null
        armIzqPivot = mascotRoot.getObjectByName("PIVOT_BRAZO_IZQ") || null
        mechonPivot = mascotRoot.getObjectByName("PIVOT_MECHON") || null

        // Center Yiri around (0, 0, 0)
        rigNode.position.set(0, -0.5, 0)
        rigNode.scale.setScalar(modelScale)

        // Clone and register accent materials for dynamic status tinting
        mascotRoot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            if (mesh.material) {
              const mat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial
              mesh.material = mat
              const matName = mat.name || ""
              // Accent materials: headphones, hair tuft, back piece, eyebrows, smile
              if (matName.includes("Azul") && !matName.includes("Ojos")) {
                const isDark = matName.includes("Boca") || matName.includes("Cejas")
                accentMaterials.push({ mat, isDark })
              }
            }
          }
        })

        // Apply initial status colors and facial expression
        updateStatusColors(statusRef.current)
        faceRig = createFaceRig(mascotRoot)
        Object.assign(expression, EXPRESSIONS[statusRef.current])
        applyExpression(faceRig, expression)

        scene.add(mascotRoot)
        setIsLoaded(true)
      })
      .catch((err) => {
        console.warn("[Yiri3D] Failed to load 3D GLB model, falling back to 2D image:", err)
        setLoadFailed(true)
      })

    function updateStatusColors(currentStatus: CrewStatus) {
      const colors = ACCENT_COLORS[currentStatus] || ACCENT_COLORS.stable
      accentMaterials.forEach(({ mat, isDark }) => {
        mat.color.setHex(isDark ? colors.dark : colors.main)
      })
    }

    // 6. Resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const width = entry.contentRect.width || 300
      const height = entry.contentRect.height || 300
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    })
    resizeObserver.observe(container)

    // 7. Intersection observer to pause rendering when offscreen
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })
    intersectionObserver.observe(container)

    // 8. Pointer event tracking for interactive head/body tilt
    function onPointerMove(e: PointerEvent) {
      if (!interactiveRef.current || !container) return
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      pointerTarget.current.x = THREE.MathUtils.clamp(x, -1, 1)
      pointerTarget.current.y = THREE.MathUtils.clamp(y, -1, 1)
    }

    function onPointerLeave() {
      pointerTarget.current.x = 0
      pointerTarget.current.y = 0
    }

    window.addEventListener("pointermove", onPointerMove)
    container.addEventListener("pointerleave", onPointerLeave)

    // 9. Render & Animation loop
    const clock = new THREE.Clock()
    let prevStatus = statusRef.current

    function animate() {
      if (isDisposed) return
      animationFrameId = requestAnimationFrame(animate)

      if (!isVisible) return

      const delta = clock.getDelta()
      const t = clock.getElapsedTime()
      const currentMode = modeRef.current

      // Check if status changed
      if (statusRef.current !== prevStatus) {
        prevStatus = statusRef.current
        updateStatusColors(prevStatus)
      }

      // Ease the face toward the status expression (smile / serious / sad)
      if (faceRig && stepExpression(expression, EXPRESSIONS[statusRef.current], delta)) {
        applyExpression(faceRig, expression)
      }
      waveBlend += ((currentMode === "wave" ? 1 : 0) - waveBlend) * Math.min(1, delta * 5)

      // Smooth pointer lerping
      pointerCurrent.current.x = THREE.MathUtils.lerp(pointerCurrent.current.x, pointerTarget.current.x, 0.08)
      pointerCurrent.current.y = THREE.MathUtils.lerp(pointerCurrent.current.y, pointerTarget.current.y, 0.08)
      const px = pointerCurrent.current.x
      const py = pointerCurrent.current.y

      if (rigNode) {
        if (currentMode === "spin") {
          // Continuous horizontal 360 spin during scan execution
          rigNode.rotation.y += delta * 4.8
        } else {
          // Smoothly return to front-facing orientation
          rigNode.rotation.y = THREE.MathUtils.lerp(rigNode.rotation.y, 0, 0.1)
        }
      }

      if (cuerpoPivot) {
        if (currentMode === "spin") {
          // Energetic vertical bob during scan
          cuerpoPivot.position.y = 0.2 + Math.sin(t * 3.6) * 0.04
          cuerpoPivot.scale.setScalar(1 + Math.sin(t * 3.6) * 0.018)
          cuerpoPivot.rotation.z = Math.sin(t * 2.0) * 0.03
          cuerpoPivot.rotation.x = Math.sin(t * 2.5) * 0.03
        } else if (currentMode === "wave") {
          // Cheerful bounce while waving
          cuerpoPivot.position.y = 0.2 + Math.sin(t * 2.8) * 0.035
          cuerpoPivot.scale.setScalar(1 + Math.sin(t * 2.8) * 0.015)
          cuerpoPivot.rotation.z = Math.sin(t * 1.5) * 0.02 + px * 0.03
          cuerpoPivot.rotation.x = Math.sin(t * 2.0) * 0.02 - py * 0.03
        } else {
          // Idle organic breathing float
          cuerpoPivot.position.y = 0.2 + Math.sin(t * 2.0) * 0.03
          cuerpoPivot.scale.setScalar(1 + Math.sin(t * 2.0) * 0.012)
          cuerpoPivot.rotation.z = Math.sin(t * 1.2) * 0.02 + px * 0.04
          cuerpoPivot.rotation.x = Math.sin(t * 1.5) * 0.018 - py * 0.04
        }
      }

      if (cabezaPivot) {
        if (currentMode === "spin") {
          cabezaPivot.rotation.z = Math.sin(t * 3.6) * 0.03
          cabezaPivot.rotation.x = expression.headDroop
          cabezaPivot.rotation.y = 0
        } else if (currentMode === "wave") {
          // Friendly head tilt towards the waving arm with curious eye tracking
          cabezaPivot.rotation.z = -0.06 + Math.sin(t * 2.8) * 0.035
          cabezaPivot.rotation.x = Math.sin(t * 2.0) * 0.02 - py * 0.08 + expression.headDroop
          cabezaPivot.rotation.y = px * 0.2
        } else {
          // Idle head looking around + cursor following
          cabezaPivot.rotation.z = Math.sin(t * 1.4) * 0.035 + px * 0.06
          cabezaPivot.rotation.x = Math.sin(t * 1.7) * 0.025 - py * 0.08 + expression.headDroop
          cabezaPivot.rotation.y = px * 0.22
        }
      }

      if (mechonPivot) {
        // Tuft / antenna lag bounce
        if (currentMode === "wave") {
          mechonPivot.rotation.z = Math.sin(t * 5.8 - 0.4) * 0.12
          mechonPivot.rotation.x = Math.cos(t * 2.8) * 0.06
        } else if (currentMode === "spin") {
          mechonPivot.rotation.z = Math.sin(t * 4.8) * 0.15
          mechonPivot.rotation.x = Math.cos(t * 4.8) * 0.1
        } else {
          mechonPivot.rotation.z = Math.sin(t * 2.0 - 0.5) * 0.08
          mechonPivot.rotation.x = Math.cos(t * 2.0 - 0.5) * 0.05
        }
      }

      if (armDerPivot && armIzqPivot) {
        // Pose of the current non-waving mode
        let rz: number, rx: number, ry: number
        if (currentMode === "spin") {
          // Arms floating dynamically during rotation
          rz = -0.14 - Math.sin(t * 3.6) * 0.05
          rx = 0.08
          ry = 0
          armIzqPivot.rotation.z = 0.14 + Math.sin(t * 3.6) * 0.05
          armIzqPivot.rotation.x = 0.08
          armIzqPivot.rotation.y = 0
        } else {
          // Idle gentle swaying (also the left arm's pose while waving)
          rz = Math.sin(t * 2.0) * 0.04
          rx = Math.cos(t * 1.8) * 0.02
          ry = 0
          armIzqPivot.rotation.z = currentMode === "wave" ? 0.06 + Math.sin(t * 2.2) * 0.025 : -Math.sin(t * 2.0) * 0.04
          armIzqPivot.rotation.x = Math.cos(t * 1.8) * 0.02
          armIzqPivot.rotation.y = 0
        }

        // Waving: right arm held up above the shoulder and swinging side to side the whole time.
        // Blended in/out so it rises smoothly, and never drops back to rest while in "wave" mode.
        const wave = wavingArmPose(t)
        armDerPivot.rotation.z = THREE.MathUtils.lerp(rz, wave.z, waveBlend)
        armDerPivot.rotation.x = THREE.MathUtils.lerp(rx, wave.x, waveBlend)
        armDerPivot.rotation.y = THREE.MathUtils.lerp(ry, wave.y, waveBlend)
      }

      renderer.render(scene, camera)
    }

    animate()

    // 10. Cleanup on unmount
    return () => {
      isDisposed = true
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("pointermove", onPointerMove)
      container.removeEventListener("pointerleave", onPointerLeave)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      faceRig?.dispose()
      renderer.dispose()
    }
  }, [cameraDistance, modelScale])

  // If WebGL fails completely, render the fallback image
  if (hasError) {
    return (
      <div ref={containerRef} className={cn("relative flex items-center justify-center", className)} style={style} {...rest}>
        <img src={fallbackSrc} alt={alt} className="size-full object-contain" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={style}
      {...rest}
    >
      <canvas ref={canvasRef} className="size-full outline-none" tabIndex={-1} aria-label={alt} />
      {/* Smooth transition from fallback image while the 3D model loads */}
      {!isLoaded && fallbackSrc && (
        <img
          src={fallbackSrc}
          alt={alt}
          className="pointer-events-none absolute inset-0 size-full object-contain transition-opacity duration-300"
        />
      )}
    </div>
  )
}
