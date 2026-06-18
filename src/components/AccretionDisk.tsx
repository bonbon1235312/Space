"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;

  attribute float aScale;
  attribute vec3 aColor;

  varying vec3 vColor;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // subtle per-particle twinkle so the disk shimmers
    float twinkle = 0.75 + 0.25 * sin(uTime * 3.0 + aScale * 53.0);

    gl_PointSize = uSize * aScale * twinkle;
    gl_PointSize *= (1.0 / - viewPosition.z);

    vColor = aColor;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    // soft circular glow falloff
    float d = distance(gl_PointCoord, vec2(0.5));
    float strength = clamp(1.0 - d * 2.0, 0.0, 1.0);
    strength = pow(strength, 2.0);

    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color, strength);
  }
`;

const COUNT = 500;

export function AccretionDisk({
  radius = 0.85,
  color = "#9b7bff",
}: {
  radius?: number;
  color?: string;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, scales } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);

    const innerR = radius * 1.35;
    const outerR = radius * 3.0;

    const hot = new THREE.Color("#ffffff");
    const cool = new THREE.Color(color);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // bias toward the inner edge: pow > 1 clusters samples near 0
      const t = Math.pow(Math.random(), 1.6);
      const r = innerR + (outerR - innerR) * t;

      const angle = Math.random() * Math.PI * 2;

      // thin disk: vertical scatter shrinks as radius grows
      const thickness = 0.06 * (1.0 - t * 0.8);
      const y = (Math.random() - 0.5) * thickness;

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = y;
      positions[i3 + 2] = Math.sin(angle) * r;

      // hot/white near the inner edge, cooling to the accent outward
      const mixed = hot.clone().lerp(cool, t);
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;

      // tiny particles, slightly brighter/larger near the hot inner edge
      scales[i] = (Math.random() * 0.6 + 0.4) * (1.3 - t * 0.5);
    }

    return { positions, colors, scales };
  }, [radius, color]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 14 },
    }),
    []
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (pointsRef.current) {
      // orbit: spin the disk around its own Y a bit faster than the galaxy
      pointsRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group rotation={[-0.35, 0, 0.08]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        </bufferGeometry>
        <shaderMaterial
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          transparent
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </points>
    </group>
  );
}
