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
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import Image from "next/image";
import { IconArrowsMove, IconRotate, IconHandGrab } from "@tabler/icons-react";
import { useCopy } from "./preferences";
import {
  anchorHeight,
  ropeLength,
  dropPositions,
  canResetLanyard,
} from "./lanyard-motion";

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
      { rootMargin: "0px" },
    );
    if (host.current) observer.observe(host.current);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", change);
    };
  }, []);
  useEffect(() => {
    // Rearm only at the very top, with the entire canvas outside the viewport.
    let wasHome = false;
    const checkHome = () => {
      const stage = host.current?.querySelector(".lanyard-stage");
      if (!stage) return;
      const atHome = canResetLanyard(
        window.scrollY,
        stage.getBoundingClientRect().top,
        window.innerHeight,
      );
      if (atHome && !wasHome) {
        setFlipped(false);
        setImpulse(0);
        setReplay((value) => value + 1);
      }
      wasHome = atHome;
    };
    checkHome();
    window.addEventListener("scroll", checkHome, { passive: true });
    return () => window.removeEventListener("scroll", checkHome);
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
              <ambientLight intensity={0.7} />
              <Suspense fallback={null}>
                <Physics
                  gravity={[0, -20, 0]}
                  timeStep={1 / 60}
                  interpolate
                  numSolverIterations={12}
                  paused={!visible}
                >
                  <Band
                    key={replay}
                    flipped={flipped}
                    impulse={impulse}
                    onReady={() => setReady(true)}
                  />
                </Physics>
                <Environment resolution={128}>
                  <Lightformer
                    intensity={1.5}
                    position={[0, 2, 5]}
                    scale={[8, 4, 1]}
                  />
                  <Lightformer
                    intensity={2}
                    position={[-4, 0, 2]}
                    rotation={[0, 0.7, 0]}
                    scale={[2, 8, 1]}
                  />
                  <Lightformer
                    intensity={1}
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
  onReady,
}: {
  flipped: boolean;
  impulse: number;
  onReady: () => void;
}) {
  const fixed = useRef<Body>(null!),
    j1 = useRef<Body>(null!),
    j2 = useRef<Body>(null!),
    j3 = useRef<Body>(null!),
    card = useRef<Body>(null!);
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null!);
  const pointerBody = useRef<Body>(null!);
  const dragDepth = useRef(0);
  const freeSpinUntil = useRef(0);
  const { world, rapier } = useRapier();
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
      rotation: new THREE.Quaternion(),
      p1: new THREE.Vector3(...dropPositions[0]),
      p2: new THREE.Vector3(...dropPositions[1]),
      curve: new THREE.CatmullRomCurve3(
        Array.from({ length: 4 }, () => new THREE.Vector3()),
      ),
    }),
    [],
  );
  const bodyProps = {
    colliders: false as const,
    canSleep: true,
    angularDamping: 0.7,
    linearDamping: 0.9,
  };
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], ropeLength]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], ropeLength]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], ropeLength]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);
  useEffect(() => {
    if (!dragged) return;
    // Grab the hit point, leaving all rotational degrees of freedom available.
    const joint = world.createImpulseJoint(
      rapier.JointData.spherical({ x: 0, y: 0, z: 0 }, dragged),
      pointerBody.current,
      card.current,
      true,
    );
    return () => {
      if (world.getImpulseJoint(joint.handle))
        world.removeImpulseJoint(joint, true);
    };
  }, [dragged, rapier, world]);
  useEffect(() => {
    onReady();
  }, []); // The scene owns one ready notification per mount.
  useEffect(() => {
    if (impulse && card.current) {
      card.current.applyImpulse({ x: 2.6, y: 1.2, z: 0.5 }, true);
      card.current.applyTorqueImpulse({ x: 0.15, y: 1.2, z: 0.3 }, true);
      freeSpinUntil.current = performance.now() + 2500;
    }
  }, [impulse]);
  useEffect(() => {
    card.current?.wakeUp();
    freeSpinUntil.current = 0;
  }, [flipped]);
  strap.wrapS = strap.wrapT = THREE.RepeatWrapping;
  function release(e: ThreeEvent<PointerEvent>) {
    const target = e.target as Element;
    if (target.hasPointerCapture?.(e.pointerId))
      target.releasePointerCapture(e.pointerId);
    freeSpinUntil.current = performance.now() + 2500;
    setDragged(null);
  }
  useFrame((state, dt) => {
    if (!card.current || !band.current) return;
    const delta = Math.min(dt, 0.04);
    if (dragged) {
      math.point
        .set(state.pointer.x, state.pointer.y, 0.5)
        .unproject(state.camera);
      math.direction.copy(math.point).sub(state.camera.position).normalize();
      math.point.add(
        math.direction.multiplyScalar(
          (dragDepth.current - math.point.z) / math.direction.z,
        ),
      );
      math.point.x = THREE.MathUtils.clamp(math.point.x, -3.4, 3.4);
      math.point.y = THREE.MathUtils.clamp(math.point.y, -2, 3.7);
      [card, j1, j2, j3].forEach((r) => r.current.wakeUp());
      pointerBody.current.setNextKinematicTranslation(math.point);
    }
    math.p1.lerp(j1.current.translation(), 1 - Math.exp(-delta * 24));
    math.p2.lerp(j2.current.translation(), 1 - Math.exp(-delta * 24));
    math.curve.points[0].copy(j3.current.translation());
    math.curve.points[1].copy(math.p2);
    math.curve.points[2].copy(math.p1);
    math.curve.points[3].copy(fixed.current.translation());
    math.curve.curveType = "chordal";
    band.current.geometry.setPoints(math.curve.getPoints(32));
    if (!dragged && performance.now() > freeSpinUntil.current) {
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
          { x: velocity.x, y: velocity.y + error * delta * 2, z: velocity.z },
          true,
        );
    }
  });
  return (
    <>
      <RigidBody ref={pointerBody} type="kinematicPosition" colliders={false} />
      <group>
        <RigidBody
          ref={fixed}
          position={[0, anchorHeight, 0]}
          {...bodyProps}
          type="fixed"
        />
        <RigidBody ref={j1} position={dropPositions[0]} {...bodyProps}>
          <BallCollider args={[0.08]} collisionGroups={0} />
        </RigidBody>
        <RigidBody ref={j2} position={dropPositions[1]} {...bodyProps}>
          <BallCollider args={[0.08]} collisionGroups={0} />
        </RigidBody>
        <RigidBody ref={j3} position={dropPositions[2]} {...bodyProps}>
          <BallCollider args={[0.08]} collisionGroups={0} />
        </RigidBody>
        <RigidBody
          ref={card}
          position={dropPositions[3]}
          {...bodyProps}
          type="dynamic"
          ccd
        >
          <CuboidCollider args={[0.8, 1.125, 0.04]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as Element).setPointerCapture(e.pointerId);
              dragDepth.current = e.point.z;
              pointerBody.current.setTranslation(e.point, true);
              pointerBody.current.setNextKinematicTranslation(e.point);
              math.rotation.copy(card.current.rotation()).invert();
              setDragged(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(card.current.translation())
                  .applyQuaternion(math.rotation),
              );
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshBasicMaterial map={cardMap} toneMapped={false} />
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
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
