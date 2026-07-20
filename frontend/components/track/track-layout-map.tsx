"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import * as THREE from "three";
import {
  type Location,
  type Driver,
  type Session,
  fetchLocation,
  fetchSessions,
  fetchDrivers,
  fetchPositions,
  fetchIntervals,
  driverColor,
} from "@/lib/openf1";

const MOCK_TRACK_POINTS = [
  [-5.8, 0, -2.2], [-4.9, 0, -5.4], [-1.4, 0, -6.0], [2.2, 0, -5.1],
  [5.1, 0, -3.0], [5.6, 0, 0.8], [3.7, 0, 3.5], [0.4, 0, 4.8],
  [-3.4, 0, 4.0], [-5.9, 0, 1.4],
];

interface Props {
  sessionKey: number | null;
  drivers: Driver[];
  liveInterval?: number;
}

export function TrackLayoutMap({ sessionKey, drivers, liveInterval = 3000 }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const carMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const clockRef = useRef<THREE.Clock | null>(null);
  const frameIdRef = useRef(0);
  const driverProgressRef = useRef<Map<number, number>>(new Map());
  const trackDataRef = useRef<Location[]>([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#04060a", 0.038);
    scene.background = new THREE.Color("#04060a");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 120);
    camera.position.set(0, 12, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight("#6080b0", 0.5));
    const key = new THREE.DirectionalLight("#ffffff", 2.5);
    key.position.set(6, 10, 8);
    scene.add(key);
    const fill = new THREE.PointLight("#2dd4ff", 6, 25);
    fill.position.set(-6, 3, -4);
    scene.add(fill);
    const rim = new THREE.PointLight("#ff254a", 6, 20);
    rim.position.set(5, 2, -4);
    scene.add(rim);

    const grid = new THREE.GridHelper(20, 20, "#0a1520", "#081018");
    grid.position.y = -0.05;
    scene.add(grid);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(8.2, 8.2, 0.06, 96),
      new THREE.MeshStandardMaterial({ color: "#080d14", metalness: 0.1, roughness: 0.9 })
    );
    base.position.y = -0.08;
    scene.add(base);

    const clock = new THREE.Clock();
    clockRef.current = clock;

    function animate() {
      const elapsed = clock.getElapsedTime();
      const curve = curveRef.current;

      carMeshesRef.current.forEach((group, driverNumber) => {
        const progress = driverProgressRef.current.get(driverNumber) ?? 0;
        if (!curve) return;
        const t = (progress + elapsed * 0.006) % 1;
        const pt = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        group.position.set(pt.x, 0.38, pt.z);
        group.rotation.y = Math.atan2(tangent.x, tangent.z);
        group.visible = true;
      });

      scene.rotation.y = Math.sin(elapsed * 0.1) * 0.05;
      camera.position.y = 12 + Math.sin(elapsed * 0.12) * 0.4;

      renderer.render(scene, camera);
      frameIdRef.current = window.requestAnimationFrame(animate);
    }
    animate();

    function resize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    return () => {
      window.cancelAnimationFrame(frameIdRef.current);
      ro.disconnect();
      renderer.dispose();
      base.geometry.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const buildCurve = useCallback((points: Array<{ x: number; y: number; z: number }>) => {
    const scene = sceneRef.current;
    if (!scene || points.length < 2) return;

    const threePoints = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(threePoints, true, "catmullrom", 0.5);
    curveRef.current = curve;

    const existing = scene.getObjectByName("track-group");
    if (existing) scene.remove(existing);
    const group = new THREE.Group();
    group.name = "track-group";

    const trackTube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 320, 0.3, 16, true),
      new THREE.MeshStandardMaterial({ color: "#111827", metalness: 0.3, roughness: 0.55 })
    );
    const racingLine = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 320, 0.05, 8, true),
      new THREE.MeshStandardMaterial({
        color: "#2dd4ff", emissive: "#2dd4ff", emissiveIntensity: 1.6,
        transparent: true, opacity: 0.9,
      })
    );
    const glowLine = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 320, 0.16, 8, true),
      new THREE.MeshStandardMaterial({
        color: "#2dd4ff", emissive: "#2dd4ff", emissiveIntensity: 0.25,
        transparent: true, opacity: 0.1,
      })
    );
    const kerb = new THREE.Mesh(
      new THREE.TorusGeometry(8.4, 0.03, 8, 96),
      new THREE.MeshStandardMaterial({ color: "#ff254a", emissive: "#ff254a", emissiveIntensity: 0.5 })
    );
    kerb.rotation.x = Math.PI / 2;
    kerb.position.y = 0.01;

    const markerMat = new THREE.MeshStandardMaterial({
      color: "#e5edf8", emissive: "#6ee7ff", emissiveIntensity: 0.3,
    });
    for (let i = 0; i < 22; i++) {
      const pt = curve.getPointAt(i / 22);
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 12), markerMat);
      marker.position.set(pt.x, 0.3, pt.z);
      group.add(marker);
    }

    group.add(trackTube, racingLine, glowLine, kerb);
    scene.add(group);
    (racingLine.material as THREE.MeshStandardMaterial).userData.isRacingLine = true;

    driverProgressRef.current.forEach((_, dn) => {
      const group = carMeshesRef.current.get(dn);
      if (group) scene.add(group);
    });
  }, []);

  useEffect(() => {
    if (!sessionKey) return;
    fetchLocation(sessionKey)
      .then((data) => {
        trackDataRef.current = data;
        if (data.length > 0) {
          const normalized = normalizeTrack(data);
          buildCurve(normalized);
        }
      })
      .catch(() => {
        const mock = MOCK_TRACK_POINTS.map(([x, y, z]) => ({ x, y, z }));
        buildCurve(mock);
      });
  }, [sessionKey, buildCurve]);

  useEffect(() => {
    if (!sessionKey) return;
    let cancelled = false;

    async function updateLive() {
      if (!sessionKey) return;
      try {
        const [positions, intervals] = await Promise.all([
          fetchPositions(sessionKey),
          fetchIntervals(sessionKey),
        ]);
        if (cancelled) return;

        const data = trackDataRef.current;
        if (data.length === 0) return;

        const driverPositions = new Map<number, Location[]>();
        data.forEach((pt) => {
          if (!driverPositions.has(pt.driver_number)) driverPositions.set(pt.driver_number, []);
          driverPositions.get(pt.driver_number)!.push(pt);
        });

        positions.forEach((pos) => {
          const pts = driverPositions.get(pos.driver_number);
          if (!pts || pts.length === 0) return;
          const latest = pts[pts.length - 1];
          const normalized = normalizeSingle(latest, data);
          const progress = positionToProgress(pos.position, drivers.length);
          driverProgressRef.current.set(pos.driver_number, progress);

          const scene = sceneRef.current;
          if (!scene) return;

          let mesh = carMeshesRef.current.get(pos.driver_number);
          if (!mesh) {
            const driver = drivers.find((d) => d.driver_number === pos.driver_number);
            const color = driver ? driverColor(driver) : "#888888";
            mesh = buildCarMesh(color);
            carMeshesRef.current.set(pos.driver_number, mesh);
            scene.add(mesh);
          }
          mesh.position.set(normalized.x, 0.38, normalized.z);
          mesh.visible = true;
        });
      } catch {
        // silently ignore
      }
    }

    updateLive();
    const id = setInterval(updateLive, liveInterval);
    return () => {
      cancelled = true;
      clearInterval(id);
      const scene = sceneRef.current;
      carMeshesRef.current.forEach((mesh) => {
        scene?.remove(mesh);
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      carMeshesRef.current.clear();
      driverProgressRef.current.clear();
    };
  }, [sessionKey, drivers, liveInterval]);

  return (
    <div className="relative h-[360px] min-h-[300px] overflow-hidden rounded-xl border border-electricBlue/20 bg-[#04060a] md:h-[420px]">
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <div className="rounded-lg border border-electricBlue/20 bg-carbon/80 px-3 py-2 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-electricBlue">Track Layout</p>
            <p className="mt-0.5 font-mono text-xs text-slate-300">
              {sessionKey ? `Session #${sessionKey}` : "OpenF1"} • Real circuit
            </p>
          </div>
          {sessionKey && (
            <div className="flex items-center gap-1.5 rounded-lg border border-racingGreen/30 bg-carbon/80 px-3 py-2 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-racingGreen opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-racingGreen" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-racingGreen">Live</p>
            </div>
          )}
        </div>
        {drivers.length > 0 && (
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-7">
            {drivers.slice(0, 14).map((driver) => (
              <div
                key={driver.driver_number}
                className="flex items-center gap-1 rounded-md border border-white/10 bg-carbon/70 px-2 py-1 backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: driverColor(driver) }} />
                <span className="text-[9px] font-mono font-semibold text-slate-200">
                  {driver.last_name ?? driver.driver_number}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeTrack(data: Location[]): Array<{ x: number; y: number; z: number }> {
  const driverGroups = new Map<number, Location[]>();
  data.forEach((pt) => {
    if (!driverGroups.has(pt.driver_number)) driverGroups.set(pt.driver_number, []);
    driverGroups.get(pt.driver_number)!.push(pt);
  });

  let bestDriver = 0;
  let maxPts = 0;
  driverGroups.forEach((pts, dn) => {
    if (pts.length > maxPts) { maxPts = pts.length; bestDriver = dn; }
  });

  const primary = driverGroups.get(bestDriver) ?? data;
  const xs = primary.map((p) => p.x);
  const zs = primary.map((p) => p.z);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const zMin = Math.min(...zs), zMax = Math.max(...zs);
  const scale = 16 / Math.max(xMax - xMin || 1, zMax - zMin || 1);

  return primary.map((p) => ({
    x: (p.x - (xMin + xMax) / 2) * scale,
    y: 0,
    z: (p.z - (zMin + zMax) / 2) * scale,
  }));
}

function normalizeSingle(pt: Location, data: Location[]): { x: number; y: number; z: number } {
  const xs = data.map((p) => p.x);
  const zs = data.map((p) => p.z);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const zMin = Math.min(...zs), zMax = Math.max(...zs);
  const scale = 16 / Math.max(xMax - xMin || 1, zMax - zMin || 1);
  return {
    x: (pt.x - (xMin + xMax) / 2) * scale,
    y: 0,
    z: (pt.z - (zMin + zMax) / 2) * scale,
  };
}

function positionToProgress(position: number, total: number): number {
  return Math.max(0, Math.min(1, 1 - (position - 1) / Math.max(total - 1, 1)));
}

function buildCarMesh(color: string): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.35,
    metalness: 0.6, roughness: 0.25,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.7), bodyMat);
  const haloMat = new THREE.MeshStandardMaterial({ color: "#f8fafc", metalness: 0.3, roughness: 0.4 });
  const halo = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.2), haloMat);
  halo.position.y = 0.12;
  const rearMat = new THREE.MeshStandardMaterial({ color: "#ff8700", emissive: "#ff8700", emissiveIntensity: 2 });
  const rear = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.02), rearMat);
  rear.position.set(0, 0, 0.36);
  group.add(body, halo, rear);
  group.visible = false;
  return group;
}
