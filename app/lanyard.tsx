"use client";
// Rope-joint structure adapted from React Bits' Lanyard by David Haz.
// License: public/lanyard/REACT-BITS-LICENSE.md.
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Canvas,
  extend,
  useFrame,
  type ThreeElement,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import Image from "next/image";
import { IconArrowsMove, IconRotate, IconHandGrab } from "@tabler/icons-react";
import { useCopy } from "./preferences";

extend({ MeshLineGeometry, MeshLineMaterial });
declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function StaticCard({ flipped }: { flipped: boolean }) {
  return (
    <div className="lanyard-static">
      <div className="static-strap" />
      <Image
        src={flipped ? "/lanyard/back.png" : "/lanyard/front.png"}
        width={256}
        height={384}
        alt={flipped ? "Tech stack stickers" : "Asarya Jachred Alotia"}
      />
    </div>
  );
}
export default function Lanyard() {
  const { t } = useCopy();
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false),
    [loaded, setLoaded] = useState(false),
    [reduced, setReduced] = useState(false);
  const [flipped, setFlipped] = useState(false),
    [impulse, setImpulse] = useState(0),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [replay, setReplay] = useState(0);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    change();
    query.addEventListener("change", change);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setLoaded(true);
      },
      { rootMargin: "100px" },
    );
    if (host.current) observer.observe(host.current);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", change);
    };
  }, []);
  useEffect(() => {
    // Returning to Home rearms the drop. Physics waits while About is offscreen,
    // so the visitor sees the drop on returning to the card, not a loading flash.
    const home = document.getElementById("home");
    if (!home) return;
    let wasHome = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const atHome = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (atHome && !wasHome) {
          setFlipped(false);
          setReplay((value) => value + 1);
        }
        wasHome = atHome;
      },
      { threshold: 0.5 },
    );
    observer.observe(home);
    return () => observer.disconnect();
  }, []);
  const fallback = <StaticCard flipped={flipped} />;
  return (
    <div
      className="lanyard-scene"
      ref={host}
      data-ready={ready}
      data-replay={replay}
    >
      <div
        className="lanyard-stage"
        role="img"
        aria-label={t(
          "Lanyard 3D interaktif. Tarik foto atau gunakan kontrol di bawah.",
          "Interactive 3D lanyard. Drag the portrait or use the controls below.",
        )}
      >
        {reduced ? (
          fallback
        ) : loaded ? (
          <SceneBoundary fallback={fallback} onFailure={() => setFailed(true)}>
            <Canvas
              camera={{ position: [0, 0, 16], fov: 24 }}
              dpr={[1, 1.5]}
              frameloop={visible ? "always" : "never"}
              gl={{ alpha: true, antialias: true }}
              fallback={fallback}
            >
              <ambientLight intensity={1.5} />
              <Suspense fallback={null}>
                <Physics
                  gravity={[0, -32, 0]}
                  timeStep={1 / 60}
                  paused={!visible}
                >
                  <Band
                    flipped={flipped}
                    impulse={impulse}
                    replay={replay}
                    onReady={() => setReady(true)}
                  />
                </Physics>
                <Environment resolution={128}>
                  <Lightformer
                    intensity={3}
                    position={[0, 2, 5]}
                    scale={[8, 4, 1]}
                  />
                  <Lightformer
                    intensity={4}
                    position={[-4, 0, 2]}
                    rotation={[0, 0.7, 0]}
                    scale={[2, 8, 1]}
                  />
                  <Lightformer
                    intensity={2}
                    position={[5, -1, 1]}
                    scale={[3, 5, 1]}
                  />
                </Environment>
              </Suspense>
            </Canvas>
          </SceneBoundary>
        ) : (
          fallback
        )}
        {!ready && !failed && !reduced && loaded && (
          <span className="scene-loading" role="status">
            {t("Memuat lanyard...", "Loading lanyard...")}
          </span>
        )}
      </div>
      <div className="lanyard-controls">
        <span className="lanyard-hint">
          <IconHandGrab size={17} />
          {t("Tarik kartunya. Rasakan ayunannya.", "Pick it up. Let it swing.")}
        </span>
        <div>
          <button
            className="pill glass small"
            onClick={() => setFlipped(!flipped)}
            aria-pressed={flipped}
          >
            <IconRotate size={16} />
            {flipped
              ? t("Lihat depan", "See front")
              : t("Balik kartu", "Flip card")}
          </button>
          {!reduced && (
            <button
              className="icon-button"
              onClick={() => setImpulse((v) => v + 1)}
              aria-label={t("Ayunkan kartu", "Swing card")}
            >
              <IconArrowsMove size={19} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
type Body = RapierRigidBody;
function Band({
  flipped,
  impulse,
  replay,
  onReady,
}: {
  flipped: boolean;
  impulse: number;
  replay: number;
  onReady: () => void;
}) {
  const fixed = useRef<Body>(null!),
    j1 = useRef<Body>(null!),
    j2 = useRef<Body>(null!),
    j3 = useRef<Body>(null!),
    card = useRef<Body>(null!);
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null!);
  const [dragged, setDragged] = useState<THREE.Vector3 | null>(null);
  const { nodes, materials } = useGLTF("/lanyard/card.glb") as unknown as {
    nodes: Record<string, THREE.Mesh>;
    materials: {
      base: THREE.MeshStandardMaterial;
      metal: THREE.MeshStandardMaterial;
    };
  };
  const [front, back, strap] = useTexture([
    "/lanyard/front.png",
    "/lanyard/back.png",
    "/lanyard/strap.png",
  ]);
  const cardMap = useMemo(() => {
    const base = materials.base.map!;
    const baseImage = base.image as { width: number; height: number };
    const canvas = document.createElement("canvas");
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    const ctx = canvas.getContext("2d")!;
    // The original atlas contains a light card edge. Replace it with the dark
    // holder, including padding outside the face UVs to prevent white seams.
    ctx.fillStyle = "#202222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const drawFace = (img: HTMLImageElement, x: number, height: number) => {
      const w = canvas.width / 2,
        h = Math.ceil(canvas.height * height);
      const scale = Math.max(w / img.width, h / img.height);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, w, h);
      ctx.clip();
      ctx.drawImage(
        img,
        x + (w - img.width * scale) / 2,
        (h - img.height * scale) / 2,
        img.width * scale,
        img.height * scale,
      );
      ctx.restore();
      // Extrude the last row into the gutter for texture filtering at the edge.
      ctx.drawImage(canvas, x, h - 1, w, 1, x, h, w, 8);
    };
    drawFace(front.image as HTMLImageElement, 0, 0.755);
    drawFace(back.image as HTMLImageElement, canvas.width / 2, 0.757);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.flipY = base.flipY;
    map.anisotropy = 8;
    return map;
  }, [front, back, materials]);
  useEffect(() => () => cardMap.dispose(), [cardMap]);
  const math = useMemo(
    () => ({
      point: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      p1: new THREE.Vector3(),
      p2: new THREE.Vector3(),
      curve: new THREE.CatmullRomCurve3(
        Array.from({ length: 4 }, () => new THREE.Vector3()),
      ),
    }),
    [],
  );
  const bodyProps = {
    colliders: false as const,
    canSleep: true,
    angularDamping: 3,
    linearDamping: 3,
  };
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 0.85]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 0.85]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 0.85]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);
  useEffect(() => {
    onReady();
  }, []); // The scene owns one ready notification per mount.
  useEffect(() => {
    if (impulse && card.current) {
      card.current.applyImpulse({ x: 2.6, y: 1.2, z: 0.5 }, true);
      card.current.applyTorqueImpulse({ x: 0.15, y: 0.1, z: 0.3 }, true);
    }
  }, [impulse]);
  useEffect(() => {
    card.current?.wakeUp();
  }, [flipped]);
  const pendingDrop = useRef(true);
  useEffect(() => {
    setDragged(null);
    pendingDrop.current = true;
  }, [replay]);
  strap.wrapS = strap.wrapT = THREE.RepeatWrapping;
  function release(e: ThreeEvent<PointerEvent>) {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    setDragged(null);
  }
  useFrame((state, dt) => {
    if (!card.current || !band.current) return;
    if (pendingDrop.current) {
      // React Bits' suspended start: short horizontal rope, then gravity drops
      // the card. Reset existing bodies instead of reloading the model/canvas.
      const starts = [
        [0.4, 3.35, 0],
        [0.8, 3.35, 0],
        [1.2, 3.35, 0],
        [1.2, 1.9, 0],
      ];
      [j1, j2, j3, card].forEach((ref, index) => {
        const [x, y, z] = starts[index];
        ref.current.setTranslation({ x, y, z }, true);
        ref.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
        ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      });
      math.p1.copy(j1.current.translation());
      math.p2.copy(j2.current.translation());
      pendingDrop.current = false;
    }
    const delta = Math.min(dt, 0.04);
    if (dragged) {
      math.point
        .set(state.pointer.x, state.pointer.y, 0.5)
        .unproject(state.camera);
      math.direction.copy(math.point).sub(state.camera.position).normalize();
      math.point.add(
        math.direction.multiplyScalar(-math.point.z / math.direction.z),
      );
      math.point.sub(dragged);
      math.point.x = THREE.MathUtils.clamp(math.point.x, -3.4, 3.4);
      math.point.y = THREE.MathUtils.clamp(math.point.y, -2, 3.7);
      math.point.z = THREE.MathUtils.clamp(math.point.z, -1, 1);
      [card, j1, j2, j3].forEach((r) => r.current.wakeUp());
      card.current.setNextKinematicTranslation(math.point);
    }
    math.p1.lerp(j1.current.translation(), Math.min(1, delta * 22));
    math.p2.lerp(j2.current.translation(), Math.min(1, delta * 22));
    math.curve.points[0].copy(j3.current.translation());
    math.curve.points[1].copy(math.p2);
    math.curve.points[2].copy(math.p1);
    math.curve.points[3].copy(fixed.current.translation());
    math.curve.curveType = "chordal";
    band.current.geometry.setPoints(math.curve.getPoints(32));
    if (!dragged) {
      const q = card.current.rotation(),
        velocity = card.current.angvel();
      const yaw = Math.atan2(
        2 * (q.w * q.y + q.x * q.z),
        1 - 2 * (q.y * q.y + q.z * q.z),
      );
      const target = flipped ? Math.PI : 0;
      const error = Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw));
      if (Math.abs(error) > 0.008)
        card.current.setAngvel(
          { x: velocity.x, y: velocity.y + error * delta * 12, z: velocity.z },
          true,
        );
    }
  });
  return (
    <>
      <group position={[0, 3.35, 0]}>
        <RigidBody ref={fixed} {...bodyProps} type="fixed" />
        <RigidBody ref={j1} position={[0, -0.85, 0]} {...bodyProps}>
          <BallCollider args={[0.08]} />
        </RigidBody>
        <RigidBody ref={j2} position={[0, -1.7, 0]} {...bodyProps}>
          <BallCollider args={[0.08]} />
        </RigidBody>
        <RigidBody ref={j3} position={[0, -2.55, 0]} {...bodyProps}>
          <BallCollider args={[0.08]} />
        </RigidBody>
        <RigidBody
          ref={card}
          position={[0.2, -4, 0]}
          {...bodyProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.04]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as Element).setPointerCapture(e.pointerId);
              setDragged(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(card.current.translation()),
              );
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={() => setDragged(null)}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                roughness={0.7}
                metalness={0.08}
                clearcoat={0.15}
                clearcoatRoughness={0.22}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry}>
              <meshStandardMaterial
                color="#b8c2ce"
                roughness={0.28}
                metalness={0.95}
              />
            </mesh>
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          args={[{ resolution: new THREE.Vector2(1024, 1024) }]}
          color="white"
          depthTest={false}
          resolution={[1024, 1024]}
          useMap={1}
          map={strap}
          repeat={[-1, 1]}
          lineWidth={0.8}
        />
      </mesh>
    </>
  );
}
