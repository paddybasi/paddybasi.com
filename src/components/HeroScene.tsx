import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Lightformer, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { MathUtils, type Group, type Mesh, type MeshPhysicalMaterial } from 'three';
import { unlock } from '../lib/quests';
import { useRootAttr } from '../lib/useRootAttr';

type Theme = 'dark' | 'light' | 'adventure';

const PALETTE: Record<Theme, { blobs: string[]; rings: [string, string]; sparkles: string; light: number }> = {
  dark: { blobs: ['#6d28d9', '#0e7490', '#4d7c0f'], rings: ['#22d3ee', '#a3e635'], sparkles: '#c4b5fd', light: 1 },
  light: { blobs: ['#8b5cf6', '#06b6d4', '#84cc16'], rings: ['#0891b2', '#65a30d'], sparkles: '#7c3aed', light: 1.6 },
  // Forest gem, gold rings and fairy-dust sparkles.
  adventure: { blobs: ['#2f855a', '#b7791f', '#2b6cb0'], rings: ['#f6c744', '#4ade80'], sparkles: '#fde68a', light: 1.3 },
};

function useTheme(): Theme {
  const theme = useRootAttr('theme');
  const mode = useRootAttr('mode');
  return mode === 'adventure' ? 'adventure' : theme === 'dark' ? 'dark' : 'light';
}

function Blob({ theme, still }: { theme: Theme; still: boolean }) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshPhysicalMaterial & { distort: number }>(null);
  const [hovered, setHovered] = useState(false);
  const [colour, setColour] = useState(0);
  const { blobs } = PALETTE[theme];

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
  }, [hovered]);

  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return;
    material.current.distort = MathUtils.damp(material.current.distort, hovered ? 0.6 : 0.38, 4, delta);
    mesh.current.scale.setScalar(MathUtils.damp(mesh.current.scale.x, hovered ? 1.12 : 1, 5, delta));
  });

  return (
    <mesh
      ref={mesh}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => {
        setColour((c) => (c + 1) % blobs.length);
        unlock('orb');
      }}
    >
      <icosahedronGeometry args={[1.1, 48]} />
      <MeshDistortMaterial
        ref={material as never}
        color={blobs[colour]}
        distort={0.38}
        speed={still ? 0 : 1.8}
        roughness={0.12}
        metalness={0.15}
        clearcoat={1}
        clearcoatRoughness={0.1}
        iridescence={1}
        iridescenceIOR={1.4}
      />
    </mesh>
  );
}

function Scene({ theme, still }: { theme: Theme; still: boolean }) {
  const rig = useRef<Group>(null);
  const orbit = useRef<Group>(null);
  // Cursor position across the whole window (-1…1), so the lean works even off the canvas.
  const cursor = useRef({ x: 0, y: 0 });
  const { rings, sparkles, light } = PALETTE[theme];

  useEffect(() => {
    const move = (e: PointerEvent) => {
      cursor.current = { x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 };
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useFrame((_, delta) => {
    // Lean the whole scene towards the cursor.
    if (rig.current) {
      rig.current.rotation.y = MathUtils.damp(rig.current.rotation.y, cursor.current.x * 0.5, 3, delta);
      rig.current.rotation.x = MathUtils.damp(rig.current.rotation.x, -cursor.current.y * 0.35, 3, delta);
    }
    if (orbit.current && !still) orbit.current.rotation.z += delta * 0.35;
  });

  return (
    <>
      <ambientLight intensity={0.4 * light} />
      <directionalLight position={[3, 4, 5]} intensity={1.5 * light} />
      <pointLight position={[-4, -2, 2]} intensity={30} color={rings[0]} />
      {/* Local light-formers instead of a downloaded HDR: no network requests. */}
      <Environment resolution={256}>
        <Lightformer form="ring" intensity={3} color="#a78bfa" position={[0, 4, -6]} scale={8} />
        <Lightformer form="rect" intensity={2} color="#22d3ee" position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#a3e635" position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <group ref={rig}>
        <Float speed={still ? 0 : 2} rotationIntensity={0.5} floatIntensity={0.8}>
          <Blob theme={theme} still={still} />
        </Float>

        <group rotation={[1.15, 0.25, 0]}>
          <mesh>
            <torusGeometry args={[2.05, 0.012, 16, 160]} />
            <meshBasicMaterial color={rings[0]} transparent opacity={0.7} />
          </mesh>
          <group ref={orbit}>
            {[0, 2.1, 4.2].map((a, i) => (
              <mesh key={a} position={[Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0]}>
                <sphereGeometry args={[i === 0 ? 0.11 : 0.07, 32, 32]} />
                <meshStandardMaterial color={rings[i % 2]} emissive={rings[i % 2]} emissiveIntensity={1.5} />
              </mesh>
            ))}
          </group>
        </group>
        <mesh rotation={[1.9, -0.4, 0.3]}>
          <torusGeometry args={[2.5, 0.006, 16, 180]} />
          <meshBasicMaterial color={rings[1]} transparent opacity={0.45} />
        </mesh>

        <Sparkles count={70} scale={[6, 5, 4]} size={2.2} speed={still ? 0 : 0.35} opacity={0.8} color={sparkles} />
      </group>
    </>
  );
}

/** Interactive WebGL hero: hover the blob to excite it, click to change its colour. Renders nothing without WebGL. */
export default function HeroScene() {
  const wrapper = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [visible, setVisible] = useState(true);
  const [supported] = useState(() => !!document.createElement('canvas').getContext('webgl2'));
  const [still] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Stop rendering while scrolled out of view.
  useEffect(() => {
    if (!wrapper.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(wrapper.current);
    return () => io.disconnect();
  }, []);

  if (!supported) return null;

  return (
    <div ref={wrapper} aria-hidden="true" className="size-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        frameloop={!visible ? 'never' : still ? 'demand' : 'always'}
      >
        <Scene theme={theme} still={still} />
      </Canvas>
    </div>
  );
}
