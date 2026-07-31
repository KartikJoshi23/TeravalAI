/**
 * DataCenterScene — the topical hero: a WebGL (react-three-fiber) view of Barq
 * AI's GPU data-center hall. Racks glow with server activity that scales with
 * the live `utilization`; a rising heat plume shifts colour/intensity with the
 * live `pue`. Both read the same Zustand store the sliders drive, so orbiting
 * the hall while dragging a slider shows the physical story behind the numbers.
 *
 * Degrades gracefully: a WebGL check + an error boundary keep any GPU failure
 * from taking down the dashboard, and reduced-motion stops the animation.
 */
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useAssumptions } from '../../store/useEvaluation';
import ErrorBoundary from '../ErrorBoundary';

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Two blocks of racks split by a central aisle. */
function rackPositions(): [number, number, number][] {
  const positions: [number, number, number][] = [];
  const cols = 10;
  const rows = 4;
  const spacingX = 0.9;
  const spacingZ = 1.5;
  const aisle = 1.6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * spacingX;
      const zBase = (r - (rows - 1) / 2) * spacingZ;
      const z = zBase + (r < rows / 2 ? -aisle / 2 : aisle / 2);
      positions.push([x, 0.9, z]);
    }
  }
  return positions;
}

const RACK_EMISSIVE = ['#38bdf8', '#a78bfa', '#38bdf8', '#60a5fa'];

function Racks({ animate }: { animate: boolean }) {
  const positions = useMemo(() => rackPositions(), []);
  const phases = useMemo(() => positions.map(() => Math.random() * Math.PI * 2), [positions]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const a = useAssumptions();

  useFrame((state) => {
    const util = a.utilization;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < mats.current.length; i++) {
      const m = mats.current[i];
      if (!m) continue;
      const pulse = animate ? 0.5 + 0.5 * Math.sin(t * 2.2 + phases[i]) : 0.7;
      m.emissiveIntensity = 0.12 + util * (0.5 + 0.9 * pulse);
    }
  });

  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.55, 1.8, 0.9]} />
          <meshStandardMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            color="#0b1120"
            emissive={RACK_EMISSIVE[i % RACK_EMISSIVE.length]}
            emissiveIntensity={0.3}
            metalness={0.55}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Cool cyan (efficient) → blue → amber → red (inefficient) as PUE rises. */
function heatColor(pue: number, out: THREE.Color): THREE.Color {
  const cool = new THREE.Color('#22d3ee');
  const mid = new THREE.Color('#60a5fa');
  const warm = new THREE.Color('#fbbf24');
  const hot = new THREE.Color('#fb7185');
  const t = THREE.MathUtils.clamp((pue - 1.05) / (1.4 - 1.05), 0, 1);
  if (t < 0.5) out.copy(cool).lerp(mid, t / 0.5);
  else out.copy(warm).lerp(hot, (t - 0.5) / 0.5);
  return out;
}

const HEAT_COUNT = 260;
const HEAT_CEIL = 4.4;

function Heat({ animate }: { animate: boolean }) {
  const a = useAssumptions();
  const matRef = useRef<THREE.PointsMaterial>(null);
  const tmp = useMemo(() => new THREE.Color(), []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(HEAT_COUNT * 3);
    const spd = new Float32Array(HEAT_COUNT);
    for (let i = 0; i < HEAT_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * HEAT_CEIL;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7;
      spd[i] = 0.3 + Math.random() * 0.7;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.userData.spd = spd;
    return g;
  }, []);

  useFrame((_, delta) => {
    const pue = a.pue;
    if (matRef.current) {
      matRef.current.color.copy(heatColor(pue, tmp));
      matRef.current.opacity = THREE.MathUtils.clamp(0.2 + (pue - 1.05) * 1.1, 0.15, 0.85);
    }
    if (!animate) return;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const spd = geom.userData.spd as Float32Array;
    const rise = 0.4 + a.utilization * 1.2;
    const d = Math.min(delta, 0.05);
    for (let i = 0; i < HEAT_COUNT; i++) {
      let y = posAttr.getY(i) + d * spd[i] * rise;
      if (y > HEAT_CEIL) y = 0;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points geometry={geom}>
      <pointsMaterial
        ref={matRef}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#60a5fa"
      />
    </points>
  );
}

function Hall({ animate }: { animate: boolean }) {
  return (
    <>
      <color attach="background" args={['#05060c']} />
      <fog attach="fog" args={['#05060c', 9, 24]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 6]} intensity={1.1} color="#bcd4ff" />
      <pointLight position={[0, 3.5, 0]} intensity={30} distance={18} decay={2} color="#38bdf8" />
      <pointLight position={[-6, 2.5, 5]} intensity={18} distance={16} decay={2} color="#a78bfa" />
      <Racks animate={animate} />
      <Heat animate={animate} />
      <Grid
        args={[40, 40]}
        cellSize={0.9}
        cellThickness={0.6}
        cellColor="#1e293b"
        sectionSize={4.5}
        sectionThickness={1}
        sectionColor="#3b4a63"
        fadeDistance={28}
        fadeStrength={1.4}
        infiniteGrid
      />
    </>
  );
}

export default function DataCenterScene() {
  const a = useAssumptions();
  const animate = !reducedMotion();
  const webgl = useMemo(() => hasWebGL(), []);

  const fallback = (
    <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-txt-dim">
      3D hall unavailable — WebGL is not supported on this device. The rest of the
      dashboard is unaffected.
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass relative overflow-hidden"
      aria-label="3D data-center hall"
    >
      <div className="relative h-[340px] w-full md:h-[400px]">
        {webgl ? (
          <ErrorBoundary fallback={fallback}>
            <Canvas
              dpr={[1, 2]}
              camera={{ position: [7.5, 4.5, 9], fov: 42 }}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
              <Hall animate={animate} />
              <OrbitControls
                makeDefault
                target={[0, 0.7, 0]}
                enablePan={false}
                enableZoom={false}
                autoRotate={animate}
                autoRotateSpeed={0.5}
                minPolarAngle={Math.PI / 3.4}
                maxPolarAngle={Math.PI / 2.15}
              />
            </Canvas>
          </ErrorBoundary>
        ) : (
          fallback
        )}

        {/* overlay caption + live readouts */}
        <div className="pointer-events-none absolute left-5 top-5">
          <h2 className="text-lg font-semibold text-txt">Live data-center hall</h2>
          <p className="text-xs text-txt-dim">
            Rack glow tracks utilization · heat plume tracks PUE — drag to orbit
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-5 left-5 flex gap-3 text-xs">
          <span className="rounded-md border border-glass-border bg-white/5 px-2.5 py-1 backdrop-blur">
            <span className="text-txt-faint">Utilization </span>
            <span className="font-mono font-medium text-blue">{(a.utilization * 100).toFixed(0)}%</span>
          </span>
          <span className="rounded-md border border-glass-border bg-white/5 px-2.5 py-1 backdrop-blur">
            <span className="text-txt-faint">PUE </span>
            <span className="font-mono font-medium text-amber">{a.pue.toFixed(2)}</span>
          </span>
        </div>
      </div>
    </motion.section>
  );
}
