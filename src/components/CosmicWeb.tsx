"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { THEORIES } from "@/lib/theories";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;

  attribute float aScale;
  attribute vec3 aColor;
  attribute float aT;

  varying vec3 vColor;
  varying float vPulse;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // a faint pulse that travels along the filament (aT = 0..1 param)
    float wave = sin(aT * 12.0 - uTime * 1.6);
    float pulse = 0.55 + 0.45 * wave;

    gl_PointSize = uSize * aScale * (0.7 + 0.4 * pulse);
    gl_PointSize *= (1.0 / - viewPosition.z);

    vColor = aColor;
    vPulse = pulse;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vPulse;

  void main() {
    // soft circular glow falloff
    float d = distance(gl_PointCoord, vec2(0.5));
    float strength = clamp(1.0 - d * 2.0, 0.0, 1.0);
    strength = pow(strength, 2.0);

    // ethereal, dim, with a travelling pulse modulating alpha
    float alpha = strength * (0.18 + 0.22 * vPulse);

    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color, alpha);
  }
`;

const POINTS_PER_FILAMENT = 220;

export function CosmicWeb() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, scales, ts, total } = useMemo(() => {
    const nodes = THEORIES.map((t) => ({
      pos: new THREE.Vector3(...t.position),
      color: new THREE.Color(t.color),
    }));

    // unique pairs of the three nodes -> 3 filaments
    const pairs: [number, number][] = [];
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        pairs.push([a, b]);
      }
    }

    const total = pairs.length * POINTS_PER_FILAMENT;
    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const scales = new Float32Array(total);
    const ts = new Float32Array(total);

    let i = 0;
    const tmp = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const perpA = new THREE.Vector3();
    const perpB = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    for (const [a, b] of pairs) {
      const start = nodes[a].pos;
      const end = nodes[b].pos;

      dir.copy(end).sub(start);
      const len = dir.length();
      dir.normalize();

      // two perpendicular axes to scatter / bow around the line
      perpA.copy(dir).cross(up);
      if (perpA.lengthSq() < 1e-4) perpA.set(1, 0, 0);
      perpA.normalize();
      perpB.copy(dir).cross(perpA).normalize();

      // the sine bow direction (mostly downward sag with a sideways lean)
      const bowDir = new THREE.Vector3()
        .addScaledVector(perpB, -0.7)
        .addScaledVector(perpA, 0.3)
        .normalize();
      const bowAmount = len * 0.18;

      for (let p = 0; p < POINTS_PER_FILAMENT; p++) {
        const i3 = i * 3;
        const t = p / (POINTS_PER_FILAMENT - 1);

        // base point along the straight line
        tmp.copy(start).addScaledVector(dir, len * t);

        // gentle sine bow, peaking at the centre (t = 0.5)
        const bow = Math.sin(t * Math.PI) * bowAmount;
        tmp.addScaledVector(bowDir, bow);

        // small per-point perpendicular jitter -> wispy gas
        const jitter = Math.sin(t * Math.PI) * 0.55 + 0.12;
        tmp.addScaledVector(
          perpA,
          (Math.random() - 0.5) * jitter
        );
        tmp.addScaledVector(
          perpB,
          (Math.random() - 0.5) * jitter
        );

        positions[i3] = tmp.x;
        positions[i3 + 1] = tmp.y;
        positions[i3 + 2] = tmp.z;

        // colour blends between the two endpoint node colours by t
        const mixed = nodes[a].color.clone().lerp(nodes[b].color, t);
        colors[i3] = mixed.r;
        colors[i3 + 1] = mixed.g;
        colors[i3 + 2] = mixed.b;

        // thin particles toward the endpoints (fatter in the middle)
        const taper = Math.sin(t * Math.PI);
        scales[i] = (0.35 + 0.85 * taper) * (Math.random() * 0.6 + 0.7);

        ts[i] = t;
        i++;
      }
    }

    return { positions, colors, scales, ts, total };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 26 },
    }),
    []
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (pointsRef.current) {
      // very slow shared drift so the whole web breathes
      pointsRef.current.rotation.y += delta * 0.004;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aT" args={[ts, 1]} />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent
        toneMapped={false}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
      {/* total points: {total} */}
    </points>
  );
}
