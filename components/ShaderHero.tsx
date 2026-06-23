"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";

function useHeroMotionPrefs() {
  const [lite, setLite] = useState(true);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLite(mobile || coarse || reduced);
  }, []);

  return lite;
}

function Wave() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const material = ref.current?.material as THREE.ShaderMaterial | undefined;
    if (material?.uniforms?.uTime) {
      material.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh ref={ref} rotation={[-0.35, 0, 0]}>
      <planeGeometry args={[12, 8, 128, 128]} />
      <shaderMaterial
        wireframe
        uniforms={{
          uTime: { value: 0 },
        }}
        vertexShader={`
          uniform float uTime;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin(pos.x * 2.0 + uTime) * 0.35;
            pos.z += cos(pos.y * 2.0 + uTime * 0.8) * 0.35;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;

          void main() {
            vec3 teal = vec3(0.18, 0.72, 0.59);
            vec3 gold = vec3(0.79, 0.66, 0.38);
            vec3 color = mix(teal, gold, vUv.y);
            gl_FragColor = vec4(color, 0.85);
          }
        `}
      />
    </mesh>
  );
}

function HeroLiteFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(45,212,191,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(201,169,98,0.1),transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function ShaderHeroCanvas() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.25]}
        frameloop="always"
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.4} />
        <Wave />
      </Canvas>
    </div>
  );
}

function ShaderHero() {
  const lite = useHeroMotionPrefs();

  return (
    <div className="relative h-full w-full bg-black">
      {lite ? <HeroLiteFallback /> : <ShaderHeroCanvas />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
    </div>
  );
}

export default memo(ShaderHero);
