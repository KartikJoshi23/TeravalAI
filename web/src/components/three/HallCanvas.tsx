/**
 * HallCanvas — the heavy three.js half of the data-center hero, split into its
 * own chunk so React.lazy() keeps three/postprocessing out of the main bundle.
 *
 * An open, wall-less server hall: rows of GB200 cabinets in cold/hot aisles over
 * a mirror-polished floor. Cabinets are METAL — a reflective <Environment> of
 * inline light-formers makes their edges catch a greyish-silver highlight from
 * every side, while the aisle-facing fronts glow with server activity. Bloom
 * lifts every emissive surface. Rack glow tracks `utilization`; a heat shimmer
 * tints with `pue`. Hover to highlight, click to select a rack.
 */
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Edges,
  Instances,
  Instance,
  MeshReflectorMaterial,
  Environment,
  Lightformer,
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useModelStore } from '../../store/useModelStore';
import { useAssumptions } from '../../store/useEvaluation';

const PODS = 4;
const PER_ROW = 14;
const COLD = 1.5;
const HOT = 2.1;
const X_STEP = 0.8;
const Y = 1.0;

interface Slot {
  bodyPos: [number, number, number];
  rotY: number;
  frontPos: [number, number, number];
  topPos: [number, number, number];
}

function buildSlots(): { slots: Slot[]; aisleZ: number[] } {
  const zs: { z: number; facing: 1 | -1 }[] = [];
  let z = 0;
  for (let p = 0; p < PODS; p++) {
    zs.push({ z, facing: 1 });
    zs.push({ z: z + COLD, facing: -1 });
    z += COLD + HOT;
  }
  const meanZ = zs.reduce((s, r) => s + r.z, 0) / zs.length;
  zs.forEach((r) => (r.z -= meanZ));

  const slots: Slot[] = [];
  zs.forEach((row) => {
    for (let c = 0; c < PER_ROW; c++) {
      const x = (c - (PER_ROW - 1) / 2) * X_STEP;
      const fz = row.z + row.facing * 0.47;
      slots.push({
        bodyPos: [x, Y, row.z],
        rotY: row.facing === 1 ? 0 : Math.PI,
        frontPos: [x, Y, fz],
        topPos: [x, 1.96, fz],
      });
    }
  });
  const aisleZ: number[] = [];
  for (let p = 0; p < zs.length; p += 2) aisleZ.push((zs[p].z + zs[p + 1].z) / 2);
  return { slots, aisleZ };
}

/** Canvas texture of stacked server units (louvre lines + LED dots) for rack fronts. */
function makeFrontTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#03070e';
  ctx.fillRect(0, 0, 64, 256);
  const units = 16;
  const uh = 256 / units;
  for (let i = 0; i < units; i++) {
    const y = i * uh;
    ctx.fillStyle = '#0a1a2e';
    ctx.fillRect(4, y + 2, 56, uh - 3);
    ctx.fillStyle = i % 4 === 0 ? '#7dd3fc' : '#2a86c4';
    ctx.fillRect(7, y + uh * 0.55, 50, 2);
    ctx.fillStyle = i % 3 === 0 ? '#34d399' : '#38bdf8';
    ctx.fillRect(9, y + uh * 0.28, 3, 3);
    ctx.fillStyle = '#a78bfa';
    ctx.fillRect(15, y + uh * 0.28, 2, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function HumanFigure({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.62, 0]}>
        <capsuleGeometry args={[0.2, 0.72, 6, 14]} />
        <meshStandardMaterial color="#2a3550" roughness={0.7} metalness={0.3} emissive="#38bdf8" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.16, 18, 18]} />
        <meshStandardMaterial color="#39445e" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Racks({
  slots,
  selected,
  onSelect,
  animate,
}: {
  slots: Slot[];
  selected: number | null;
  onSelect: (i: number | null) => void;
  animate: boolean;
}) {
  const frontMat = useRef<THREE.MeshStandardMaterial>(null);
  const topMat = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const util = useModelStore((s) => s.assumptions.utilization);
  const tex = useMemo(() => makeFrontTexture(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = animate ? 0.5 + 0.5 * Math.sin(t * 1.6) : 0.7;
    if (frontMat.current) frontMat.current.emissiveIntensity = 0.5 + util * (1.1 + 0.7 * pulse);
    if (topMat.current) topMat.current.emissiveIntensity = 0.6 + util * (1.4 + 0.6 * pulse);
  });

  const highlight = (i: number | null, color: string) =>
    i === null ? null : (
      <mesh position={slots[i].bodyPos} rotation={[0, slots[i].rotY, 0]}>
        <boxGeometry args={[0.66, 2.06, 0.96]} />
        <meshBasicMaterial transparent opacity={0} />
        <Edges threshold={15} color={color} />
      </mesh>
    );

  return (
    <group>
      {/* rack bodies — metallic so edges catch the environment's silver light */}
      <Instances limit={slots.length} range={slots.length}>
        <boxGeometry args={[0.62, 2.0, 0.92]} />
        <meshStandardMaterial
          color="#2a3345"
          metalness={0.92}
          roughness={0.32}
          emissive="#0e1a2e"
          emissiveIntensity={0.22}
          envMapIntensity={1.25}
        />
        {slots.map((s, i) => (
          <Instance
            key={i}
            position={s.bodyPos}
            rotation={[0, s.rotY, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(i);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(null);
              document.body.style.cursor = 'auto';
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(i);
            }}
          />
        ))}
      </Instances>

      {/* glowing, detailed server fronts */}
      <Instances limit={slots.length} range={slots.length}>
        <planeGeometry args={[0.5, 1.8]} />
        <meshStandardMaterial ref={frontMat} map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.9} toneMapped={false} />
        {slots.map((s, i) => (
          <Instance key={i} position={s.frontPos} rotation={[0, s.rotY, 0]} />
        ))}
      </Instances>

      {/* emissive top strips — glow visible from above/outside */}
      <Instances limit={slots.length} range={slots.length}>
        <boxGeometry args={[0.52, 0.05, 0.1]} />
        <meshStandardMaterial ref={topMat} color="#0b1120" emissive="#38bdf8" emissiveIntensity={1.2} toneMapped={false} />
        {slots.map((s, i) => (
          <Instance key={i} position={s.topPos} rotation={[0, s.rotY, 0]} />
        ))}
      </Instances>

      {highlight(hovered, '#7dd3fc')}
      {highlight(selected, '#fbbf24')}
    </group>
  );
}

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

const HEAT_COUNT = 110;

function Heat({ animate }: { animate: boolean }) {
  const a = useAssumptions();
  const matRef = useRef<THREE.PointsMaterial>(null);
  const tmp = useMemo(() => new THREE.Color(), []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(HEAT_COUNT * 3);
    const spd = new Float32Array(HEAT_COUNT);
    for (let i = 0; i < HEAT_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 11;
      pos[i * 3 + 1] = 2.1 + Math.random() * 1.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      spd[i] = 0.2 + Math.random() * 0.5;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.userData.spd = spd;
    return g;
  }, []);

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.color.copy(heatColor(a.pue, tmp));
      matRef.current.opacity = THREE.MathUtils.clamp(0.1 + (a.pue - 1.05) * 0.7, 0.06, 0.42);
    }
    if (!animate) return;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const spd = geom.userData.spd as Float32Array;
    const rise = 0.25 + a.utilization * 0.7;
    const d = Math.min(delta, 0.05);
    for (let i = 0; i < HEAT_COUNT; i++) {
      let y = posAttr.getY(i) + d * spd[i] * rise;
      if (y > 3.9) y = 2.1;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points geometry={geom}>
      <pointsMaterial ref={matRef} size={0.09} sizeAttenuation transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} color="#60a5fa" />
    </points>
  );
}

function Hall({
  animate,
  selected,
  onSelect,
}: {
  animate: boolean;
  selected: number | null;
  onSelect: (i: number | null) => void;
}) {
  const { slots, aisleZ } = useMemo(() => buildSlots(), []);
  const rowWidth = PER_ROW * X_STEP + 0.8;

  return (
    <>
      <color attach="background" args={['#04060d']} />
      <fog attach="fog" args={['#04060d', 18, 52]} />

      {/* reflective studio environment — gives the metal racks silver edge highlights */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[16, 6, 1]} color="#dbe7ff" />
        <Lightformer form="rect" intensity={1.1} position={[0, 3, -11]} scale={[18, 7, 1]} color="#93a6c9" />
        <Lightformer form="rect" intensity={0.9} position={[-11, 3, 0]} rotation-y={Math.PI / 2} scale={[18, 7, 1]} color="#8493b6" />
        <Lightformer form="rect" intensity={0.9} position={[11, 3, 0]} rotation-y={-Math.PI / 2} scale={[18, 7, 1]} color="#8493b6" />
      </Environment>

      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#4a5b82', '#05060c', 0.6]} />
      <directionalLight position={[8, 14, 6]} intensity={0.7} color="#cfe0ff" />
      <pointLight position={[0, 6.5, 0]} intensity={40} distance={40} decay={2} color="#dbe7ff" />
      <pointLight position={[-8, 3.5, 7]} intensity={22} distance={26} decay={2} color="#a78bfa" />
      <pointLight position={[8, 3.5, -7]} intensity={22} distance={26} decay={2} color="#38bdf8" />

      {/* mirror-polished floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[70, 70]} />
        <MeshReflectorMaterial
          resolution={512}
          blur={[400, 140]}
          mixBlur={1}
          mixStrength={22}
          roughness={0.9}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#05070f"
          metalness={0.75}
          mirror={0.45}
        />
      </mesh>

      {aisleZ.map((z, i) => (
        <mesh key={i} position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[rowWidth, 0.16]} />
          <meshStandardMaterial color="#0b1120" emissive="#38bdf8" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      ))}

      {aisleZ.map((z, i) => (
        <mesh key={`c${i}`} position={[0, 6.0, z]}>
          <boxGeometry args={[rowWidth, 0.08, 0.28]} />
          <meshStandardMaterial color="#0b1120" emissive="#e2ecff" emissiveIntensity={2.0} toneMapped={false} />
        </mesh>
      ))}

      <Racks slots={slots} selected={selected} onSelect={onSelect} animate={animate} />

      <HumanFigure position={[2.4, 0, aisleZ[1] ?? 0]} />
      <HumanFigure position={[-3.1, 0, aisleZ[2] ?? 0]} />

      <Heat animate={animate} />
      <ContactShadows position={[0, 0.015, 0]} opacity={0.42} scale={44} blur={3} far={6} color="#000000" />

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur radius={0.7} />
      </EffectComposer>
    </>
  );
}

export default function HallCanvas({
  animate,
  selected,
  onSelect,
}: {
  animate: boolean;
  selected: number | null;
  onSelect: (i: number | null) => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [9, 7, 12], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => onSelect(null)}
    >
      <Hall animate={animate} selected={selected} onSelect={onSelect} />
      <OrbitControls
        makeDefault
        target={[0, 0.9, 0]}
        enablePan={false}
        enableZoom
        minDistance={7}
        maxDistance={26}
        autoRotate={animate && selected === null}
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.25}
      />
    </Canvas>
  );
}
