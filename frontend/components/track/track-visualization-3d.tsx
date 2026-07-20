"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Driver } from "@/lib/openf1";
import { driverColor } from "@/lib/openf1";

const CAR_COLORS = [
  "#ff8700", "#3671c6", "#e80020", "#27f4d2",
  "#229971", "#ff87bc", "#6412ff", "#b9b9b9",
  "#52e252", "#6e0000", "#ff254a", "#2dd4ff",
  "#19d084", "#ffbd45", "#ffd166", "#8b5cf6",
  "#f43f5e", "#14b8a6", "#a855f7", "#f97316",
];

interface TrackPoint {
  x: number;
  y: number;
  z: number;
  driver_number: number;
  date: string;
}

interface Props {
  drivers: Driver[];
  trackPoints?: TrackPoint[];
  liveInterval?: number;
  sessionKey?: number | null;
  onPositionUpdate?: (positions: Map<number, { x: number; y: number; z: number }>) => void;
}

export function TrackVisualization3D({ drivers, trackPoints, liveInterval = 4000, sessionKey, onPositionUpdate }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const carsRef = useRef<Map<number, THREE.Group>>(new Map());
  const clockRef = useRef<THREE.Clock | null>(null);
  const frameIdRef = useRef(0);
  const positionsRef = useRef<Map<number, { x: number; y: number; z: number; progress: number }>>(new Map());
  const driverProgressRef = useRef<Map<number, number>>(new Map());
  const [tooltip, setTooltip] = useState<{ x: number; y: number; driver: string; position: number } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#04060a", 0.042);
    scene.background = new THREE.Color("#04060a");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(44, mount.clientWidth / mount.clientHeight, 0.1, 120);
    camera.position.set(0, 14, 16);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight("#6080b0", 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight("#ffffff", 2.8);
    keyLight.position.set(6, 12, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#2dd4ff", 0.4);
    fillLight.position.set(-8, 4, -6);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight("#ff254a", 8, 30);
    rimLight.position.set(6, 3, -5);
    scene.add(rimLight);

    const clock = new THREE.Clock();
    clockRef.current = clock;

    const curve = curveRef.current;
    if (!curve) return;

    const baseGeom = new THREE.CylinderGeometry(9, 9, 0.07, 96);
    const baseMat = new THREE.MeshStandardMaterial({
      color: "#080d14",
      metalness: 0.1,
      roughness: 0.85,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = -0.08;
    scene.add(base);

    const kerbGeom = new THREE.TorusGeometry(9.2, 0.04, 8, 96);
    const kerbMat = new THREE.MeshStandardMaterial({
      color: "#ff254a",
      emissive: "#ff254a",
      emissiveIntensity: 0.6,
    });
    const kerb = new THREE.Mesh(kerbGeom, kerbMat);
    kerb.rotation.x = Math.PI / 2;
    kerb.position.y = 0.02;
    scene.add(kerb);

    const trackTube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 320, 0.32, 16, true),
      new THREE.MeshStandardMaterial({ color: "#111827", metalness: 0.3, roughness: 0.55 })
    );
    scene.add(trackTube);

    const racingLine = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 320, 0.05, 8, true),
      new THREE.MeshStandardMaterial({
        color: "#2dd4ff",
        emissive: "#2dd4ff",
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0.9,
      })
    );
    racingLine.position.y = 0.18;
    scene.add(racingLine);

    const glowLine = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 320, 0.18, 8, true),
      new THREE.MeshStandardMaterial({
        color: "#2dd4ff",
        emissive: "#2dd4ff",
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.12,
      })
    );
    glowLine.position.y = 0.16;
    scene.add(glowLine);

    const markerGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 12);
    const markerMat = new THREE.MeshStandardMaterial({
      color: "#e5edf8",
      emissive: "#6ee7ff",
      emissiveIntensity: 0.4,
    });
    for (let i = 0; i < 22; i++) {
      const t = i / 22;
      const pt = curve.getPointAt(t);
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.position.set(pt.x, 0.34, pt.z);
      scene.add(marker);
    }

    drivers.forEach((driver, i) => {
      const group = new THREE.Group();
      const color = driverColor(driver);

      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        metalness: 0.6,
        roughness: 0.25,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.72), bodyMat);
      const haloMat = new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 0.9,
      });
      const halo = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.22), haloMat);
      halo.position.y = 0.14;

      const lightMat = new THREE.MeshStandardMaterial({
        color: "#ff8700",
        emissive: "#ff8700",
        emissiveIntensity: 2.5,
      });
      const rearLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.02), lightMat);
      rearLight.position.set(0, 0, 0.37);

      group.add(body, halo, rearLight);
      group.visible = false;
      scene.add(group);
      carsRef.current.set(driver.driver_number, group);

      const progress = i / drivers.length;
      driverProgressRef.current.set(driver.driver_number, progress);
    });

    const grid = new THREE.GridHelper(20, 20, "#0d1a2a", "#0a1520");
    grid.position.y = -0.06;
    scene.add(grid);

    function animate() {
      const elapsed = clock.getElapsedTime();

      positionsRef.current.forEach((pos, driverNumber) => {
        const car = carsRef.current.get(driverNumber);
        if (!car || !curveRef.current) return;
        const t = (pos.progress + elapsed * 0.008) % 1;
        const pt = curveRef.current.getPointAt(t);
        const tangent = curveRef.current.getTangentAt(t);
        car.position.set(pt.x, 0.4, pt.z);
        car.rotation.y = Math.atan2(tangent.x, tangent.z);
        car.visible = true;
        ((car.children[2] as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(elapsed * 4 + driverNumber) * 0.8;
      });

      (racingLine.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4 + Math.sin(elapsed * 2.5) * 0.5;
      scene.rotation.y = Math.sin(elapsed * 0.12) * 0.06;
      camera.position.y = 14 + Math.sin(elapsed * 0.15) * 0.5;

      renderer.render(scene, camera);
      frameIdRef.current = window.requestAnimationFrame(animate);
    }
    animate();

    function resize() {
      const w = mount!.clientWidth;
      const h = mount!.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    return () => {
      window.cancelAnimationFrame(frameIdRef.current);
      ro.disconnect();
      renderer.dispose();
      base.geometry.dispose();
      kerb.geometry.dispose();
      trackTube.geometry.dispose();
      racingLine.geometry.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!trackPoints || trackPoints.length === 0) return;

    const normalized = normalizeTrackPoints(trackPoints);
    const threePoints = normalized.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    if (threePoints.length >= 2) {
      curveRef.current = new THREE.CatmullRomCurve3(threePoints, true, "catmullrom", 0.5);
    }
  }, [trackPoints]);

  useEffect(() => {
    drivers.forEach((driver, i) => {
      const group = carsRef.current.get(driver.driver_number);
      if (!group) return;
      group.visible = true;
      if (!driverProgressRef.current.has(driver.driver_number)) {
        driverProgressRef.current.set(driver.driver_number, i / drivers.length);
      }
    });
  }, [drivers]);

  return (
    <div className="relative h-[360px] min-h-[320px] overflow-hidden rounded-xl border border-electricBlue/20 bg-[#04060a] md:h-[440px]">
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <div className="rounded-lg border border-electricBlue/20 bg-carbon/80 px-3 py-2 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-electricBlue">Track Map</p>
            <p className="mt-0.5 font-mono text-xs text-slate-300">
              {sessionKey ? `Session #${sessionKey}` : "Monaco GP"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-racingGreen/30 bg-carbon/80 px-3 py-2 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-racingGreen opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-racingGreen" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-racingGreen">Live</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {drivers.slice(0, 10).map((driver) => (
            <div
              key={driver.driver_number}
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-carbon/70 px-2 py-1.5 backdrop-blur-sm"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: driverColor(driver) }}
              />
              <span className="text-[10px] font-mono font-semibold text-slate-200">
                {driver.last_name ?? String(driver.driver_number)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeTrackPoints(
  points: TrackPoint[]
): Array<{ x: number; y: number; z: number }> {
  if (points.length === 0) return [];

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const zs = points.map((p) => p.z);

  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const zMin = Math.min(...zs), zMax = Math.max(...zs);
  const xRange = xMax - xMin || 1;
  const zRange = zMax - zMin || 1;
  const scale = 16 / Math.max(xRange, zRange);

  return points.map((p) => ({
    x: (p.x - (xMin + xMax) / 2) * scale,
    y: 0,
    z: (p.z - (zMin + zMax) / 2) * scale,
  }));
}
