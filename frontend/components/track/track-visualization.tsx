"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const carSpecs = [
  { code: "NOR", color: "#ff8700", offset: 0 },
  { code: "VER", color: "#2dd4ff", offset: 0.19 },
  { code: "LEC", color: "#ff254a", offset: 0.37 },
  { code: "RUS", color: "#27f4d2", offset: 0.56 }
];

export function TrackVisualization() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const container = mount;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#070a0f", 8, 32);

    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 11, 13);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#9fb7d7", 1.25);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
    keyLight.position.set(4, 9, 5);
    scene.add(keyLight);
    const blueLight = new THREE.PointLight("#2dd4ff", 15, 20);
    blueLight.position.set(-4, 2, 3);
    scene.add(blueLight);
    const redLight = new THREE.PointLight("#ff254a", 10, 18);
    redLight.position.set(5, 2, -4);
    scene.add(redLight);

    const trackPoints = [
      new THREE.Vector3(-5.8, 0, -2.2),
      new THREE.Vector3(-4.9, 0, -5.4),
      new THREE.Vector3(-1.4, 0, -6.0),
      new THREE.Vector3(2.2, 0, -5.1),
      new THREE.Vector3(5.1, 0, -3.0),
      new THREE.Vector3(5.6, 0, 0.8),
      new THREE.Vector3(3.7, 0, 3.5),
      new THREE.Vector3(0.4, 0, 4.8),
      new THREE.Vector3(-3.4, 0, 4.0),
      new THREE.Vector3(-5.9, 0, 1.4)
    ];
    const curve = new THREE.CatmullRomCurve3(trackPoints, true, "catmullrom", 0.8);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(8.4, 8.4, 0.08, 96),
      new THREE.MeshStandardMaterial({ color: "#0b111a", metalness: 0.2, roughness: 0.72 })
    );
    base.position.y = -0.1;
    scene.add(base);

    const trackTube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 260, 0.28, 14, true),
      new THREE.MeshStandardMaterial({ color: "#151b24", metalness: 0.45, roughness: 0.38 })
    );
    scene.add(trackTube);

    const racingLine = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 260, 0.045, 8, true),
      new THREE.MeshStandardMaterial({ color: "#2dd4ff", emissive: "#2dd4ff", emissiveIntensity: 1.7 })
    );
    racingLine.position.y = 0.16;
    scene.add(racingLine);

    const pitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.8, 0.05, 1.9),
      new THREE.Vector3(-2.0, 0.05, 2.8),
      new THREE.Vector3(1.8, 0.05, 2.7),
      new THREE.Vector3(4.1, 0.05, 1.6)
    ]);
    const pitLane = new THREE.Mesh(
      new THREE.TubeGeometry(pitCurve, 80, 0.09, 8, false),
      new THREE.MeshStandardMaterial({ color: "#ff254a", emissive: "#ff254a", emissiveIntensity: 1.2 })
    );
    scene.add(pitLane);

    const markerGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 12);
    const markerMaterial = new THREE.MeshStandardMaterial({ color: "#e5edf8", emissive: "#6ee7ff", emissiveIntensity: 0.5 });
    for (let index = 0; index < 18; index += 1) {
      const point = curve.getPoint(index / 18);
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(point.x, 0.32, point.z);
      scene.add(marker);
    }

    const cars = carSpecs.map((spec) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.18, 0.76),
        new THREE.MeshStandardMaterial({ color: spec.color, emissive: spec.color, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.28 })
      );
      const halo = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.12, 0.24),
        new THREE.MeshStandardMaterial({ color: "#f8fafc", metalness: 0.2, roughness: 0.4 })
      );
      halo.position.y = 0.16;
      group.add(body, halo);
      scene.add(group);
      return { group, offset: spec.offset };
    });

    const grid = new THREE.GridHelper(18, 18, "#163142", "#101923");
    grid.position.y = -0.05;
    scene.add(grid);

    const clock = new THREE.Clock();
    let frameId = 0;

    function animate() {
      const elapsed = clock.getElapsedTime();
      cars.forEach((car, index) => {
        const progress = (elapsed * (0.035 + index * 0.003) + car.offset) % 1;
        const point = curve.getPointAt(progress);
        const tangent = curve.getTangentAt(progress);
        car.group.position.set(point.x, 0.43 + index * 0.015, point.z);
        car.group.rotation.y = Math.atan2(tangent.x, tangent.z);
      });
      racingLine.material.emissiveIntensity = 1.35 + Math.sin(elapsed * 2.2) * 0.45;
      scene.rotation.y = Math.sin(elapsed * 0.18) * 0.08;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    }

    function resize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div className="relative h-[360px] min-h-[320px] overflow-hidden rounded-md border border-line bg-[#05070b] md:h-[430px]" ref={mountRef}>
      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-line bg-carbon/70 px-3 py-2 backdrop-blur">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-electricBlue">3D Track Map</div>
        <div className="mt-1 font-mono text-sm text-slate-300">Monaco GP race simulation</div>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 grid gap-2 text-xs font-semibold text-slate-300 sm:grid-cols-4">
        {carSpecs.map((car) => (
          <div key={car.code} className="flex items-center gap-2 rounded-md border border-line bg-carbon/70 px-3 py-2 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: car.color }} />
            {car.code}
          </div>
        ))}
      </div>
    </div>
  );
}
