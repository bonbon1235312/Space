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

    // subtle per-star twinkle
    float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + aScale * 42.0);

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
    strength = pow(strength, 2.2);

    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color, strength);
  }
`;

const COUNT = 24000;
const RADIUS = 7;
const BRANCHES = 4;
const SPIN = 1.05;
const RANDOMNESS = 0.28;
const RANDOMNESS_POWER = 3;

export function Galaxy() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, scales } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);

    const inside = new THREE.Color("#ff8a3d");
    const outside = new THREE.Color("#3b6dff");

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const r = Math.random() * RADIUS;
      const branchAngle = ((i % BRANCHES) / BRANCHES) * Math.PI * 2;
      const spinAngle = r * SPIN;

      const rand = () =>
        Math.pow(Math.random(), RANDOMNESS_POWER) *
        (Math.random() < 0.5 ? 1 : -1) *
        RANDOMNESS *
        r;

      positions[i3] = Math.cos(branchAngle + spinAngle) * r + rand();
      positions[i3 + 1] = rand() * 0.5; // flatter on the vertical axis -> disc
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + rand();

      const mixed = inside.clone().lerp(outside, r / RADIUS);
      colors[i3] = mixed.r;
      colors[i3 + 1] = mixed.g;
      colors[i3 + 2] = mixed.b;

      scales[i] = Math.random() * 1.1 + 0.35;
    }

    return { positions, colors, scales };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 48 },
    }),
    []
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
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
  );
}
