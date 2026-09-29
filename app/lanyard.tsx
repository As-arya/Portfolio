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
  useSpringJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import Image from "next/image";
import { IconArrowsMove, IconRotate, IconHandGrab } from "@tabler/icons-react";
import { useCopy } from "./preferences";
import {
  anchorHeight,
  springRestLength,
  springStiffness,
  jointMass,
  maxRopeSegment,
  cardAnchorOffset,
  dropPositions,
  canResetLanyard,
  clampDragPoint,
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
type LanyardProps = {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  frontImage?: string;
  backImage?: string;
  imageFit?: "cover" | "contain";
  lanyardImage?: string;
  lanyardWidth?: number;
};
function StaticCard({
  flipped,
  frontImage,
  backImage,
}: {
  flipped: boolean;
  frontImage: string;
  backImage: string;
}) {
  return (
    <div className="lanyard-static">
      <div className="static-strap" />
      <Image
        src={flipped ? backImage : frontImage}
        width={256}
        height={384}
        alt={flipped ? "Tech stack stickers" : "Asarya Jachred Alotia"}
      />
    </div>
  );
}
export default function Lanyard({
  position = [0, 0, 20],
  gravity = [0, -40, 0],
  fov = 20,
  frontImage = "/lanyard/front.png",
  backImage = "/lanyard/back.png",
  imageFit = "cover",
  lanyardImage = "/lanyard/strap.png",
  lanyardWidth = 1,
}: LanyardProps) {
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
  const fallback = (
    <StaticCard flipped={flipped} frontImage={frontImage} backImage={backImage} />
  );
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
              camera={{ position, fov }}
              dpr={[1, 1.5]}
              frameloop={visible ? "always" : "never"}
              gl={{ alpha: true, antialias: true }}
              fallback={fallback}
            >
              <ambientLight intensity={0.7} />
              <Suspense fallback={null}>
                <Physics
                  gravity={gravity}
                  timeStep={1 / 60}
                  interpolate
                  numSolverIterations={12}
                  paused={!visible}
                >
                  <Band
                    key={replay}
                    visible={visible}
                    flipped={flipped}
                    impulse={impulse}
                    onReady={() => setReady(true)}
                    frontImage={frontImage}
                    backImage={backImage}
                    imageFit={imageFit}
                    lanyardImage={lanyardImage}
                    lanyardWidth={lanyardWidth}
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
  visible,
  flipped,
  impulse,
  onReady,
  frontImage,
  backImage,
  imageFit,
  lanyardImage,
  lanyardWidth,
}: {
  visible: boolean;
  flipped: boolean;
  impulse: number;
  onReady: () => void;
  frontImage: string;
  backImage: string;
  imageFit: "cover" | "contain";
  lanyardImage: string;
  lanyardWidth: number;
}) {
  const fixed = useRef<Body>(null!),
    j1 = useRef<Body>(null!),
    j2 = useRef<Body>(null!),
    j3 = useRef<Body>(null!),
    card = useRef<Body>(null!);
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null!);
  const dragDepth = useRef(0);
  const freeSpinUntil = useRef(0);
  const recoilStart = useRef(0);
  const dragStart = useRef(new THREE.Vector3());
  const dragRotation = useRef(new THREE.Quaternion());
  const releaseSpin = useRef(new THREE.Vector3());
  const flipPending = useRef(false);
  const lastFlipped = useRef(flipped);
  const [dragged, setDragged] = useState<THREE.Vector3 | null>(null);
  const dragVelocity = useRef(new THREE.Vector3());
  const previousDragPoint = useRef(new THREE.Vector3());
  const releasePending = useRef(false);
  const { nodes, materials } = useGLTF("/lanyard/card.glb") as unknown as {
    nodes: Record<string, THREE.Mesh>;
    materials: {
      base: THREE.MeshStandardMaterial;
      metal: THREE.MeshStandardMaterial;
    };
  };
  const [front, back, strap] = useTexture([
    frontImage,
    backImage,
    lanyardImage,
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
      const scale = (imageFit === "contain" ? Math.min : Math.max)(
        w / img.width,
        h / img.height,
      );
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
  }, [front, back, imageFit, materials]);
  useEffect(() => () => cardMap.dispose(), [cardMap]);
  const math = useMemo(
    () => ({
      point: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      attachment: new THREE.Vector3(),
      tilt: new THREE.Quaternion(),
      tiltAngles: new THREE.Euler(),
      slack: 0,
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
    angularDamping: 2.2,
    linearDamping: 5,
  };
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], maxRopeSegment]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], maxRopeSegment]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], maxRopeSegment]);
  useSpringJoint(fixed, j1, [
    [0, 0, 0], [0, 0, 0], springRestLength, springStiffness, 1,
  ]);
  useSpringJoint(j1, j2, [
    [0, 0, 0], [0, 0, 0], springRestLength, springStiffness, 1,
  ]);
  useSpringJoint(j2, j3, [
    [0, 0, 0], [0, 0, 0], springRestLength, springStiffness, 1,
  ]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, cardAnchorOffset, 0],
  ]);
  useEffect(() => {
    onReady();
  }, []); // The scene owns one ready notification per mount.
  useEffect(() => {
    if (!visible) return;
    [j1, j2, j3, card].forEach((body) => body.current?.wakeUp());
  }, [visible]);
  useEffect(() => {
    if (impulse && card.current) {
      card.current.applyImpulse({ x: 1.5, y: 0.7, z: 0.3 }, true);
      card.current.applyTorqueImpulse({ x: 0.08, y: 0.55, z: 0.15 }, true);
      freeSpinUntil.current = performance.now() + 1500;
    }
  }, [impulse]);
  useEffect(() => {
    if (lastFlipped.current === flipped) return;
    lastFlipped.current = flipped;
    card.current?.wakeUp();
    freeSpinUntil.current = 0;
    flipPending.current = true;
  }, [flipped]);
  strap.wrapS = strap.wrapT = THREE.RepeatWrapping;
  function endDrag() {
    if (!dragged || releasePending.current) return;
    releasePending.current = true;
    freeSpinUntil.current = performance.now() + 900;
    const position = card.current.translation();
    const dx = position.x - dragStart.current.x;
    const dy = position.y - dragStart.current.y;
    if (Math.hypot(dx, dy, position.z - dragStart.current.z) > 0.5) {
      recoilStart.current = performance.now();
      freeSpinUntil.current = performance.now() + 1500;
      releaseSpin.current
        .set(
          -dy * 0.7 - dragVelocity.current.y * 0.15,
          dx * 0.7 + dragVelocity.current.x * 0.15,
          (dragged.x * dragVelocity.current.y - dragged.y * dragVelocity.current.x) * 0.05,
        )
        .clampLength(0, 7);
    }
    setDragged(null);
  }
  useEffect(() => {
    if (!dragged) return;
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [dragged]);
  function release(e: ThreeEvent<PointerEvent>) {
    const target = e.target as Element;
    if (target.hasPointerCapture?.(e.pointerId))
      target.releasePointerCapture(e.pointerId);
    endDrag();
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
      math.point.sub(dragged);
      math.attachment
        .set(0, cardAnchorOffset, 0)
        .applyQuaternion(card.current.rotation());
      math.point.set(
        ...clampDragPoint(
          math.point.x,
          math.point.y,
          math.point.z,
          math.attachment,
        ),
      );
      [card, j1, j2, j3].forEach((r) => r.current.wakeUp());
      if (
        Number.isFinite(math.point.x) &&
        Number.isFinite(math.point.y) &&
        Number.isFinite(math.point.z)
      ) {
        math.direction
          .copy(math.point)
          .sub(previousDragPoint.current)
          .divideScalar(Math.max(dt, 1 / 120))
          .clampLength(0, 12);
        dragVelocity.current.lerp(math.direction, 1 - Math.exp(-delta * 20));
        previousDragPoint.current.copy(math.point);
        card.current.setNextKinematicTranslation(math.point);
        math.tiltAngles.set(
          THREE.MathUtils.clamp((dragStart.current.y - math.point.y) * 0.5, -1.6, 1.6),
          THREE.MathUtils.clamp((math.point.x - dragStart.current.x) * 0.5, -1.6, 1.6),
          0,
        );
        math.tilt.setFromEuler(math.tiltAngles).premultiply(dragRotation.current);
        card.current.setNextKinematicRotation(math.tilt);
      }
    } else if (releasePending.current) {
      releasePending.current = false;
      // Transfer the measured drag velocity when the body becomes dynamic.
      dragVelocity.current.clampLength(0, 12);
      card.current.setLinvel(dragVelocity.current, true);
      if (recoilStart.current) {
        math.attachment
          .set(0, cardAnchorOffset, 0)
          .applyQuaternion(card.current.rotation())
          .add(card.current.translation());
        math.direction
          .copy(fixed.current.translation())
          .sub(math.attachment);
        const stretch = Math.max(0, math.direction.length() - 3);
        if (stretch > 0)
          card.current.applyImpulse(
            math.direction.normalize().multiplyScalar(Math.min(stretch * 0.15, 0.7)),
            true,
          );
        card.current.setAngvel(releaseSpin.current, true);
        releaseSpin.current.set(0, 0, 0);
      }
    }
    if (recoilStart.current) {
      const progress = Math.min((performance.now() - recoilStart.current) / 1100, 1);
      const damping = 0.35 + 4.65 * progress * progress;
      [j1, j2, j3, card].forEach((body) =>
        body.current.setLinearDamping(damping),
      );
      card.current.setAngularDamping(0.4 + 1.8 * progress * progress);
      if (progress === 1) recoilStart.current = 0;
    }
    math.p1.lerp(j1.current.translation(), 1 - Math.exp(-delta * 12));
    math.p2.lerp(j2.current.translation(), 1 - Math.exp(-delta * 12));
    math.attachment
      .set(0, cardAnchorOffset, 0)
      .applyQuaternion(card.current.rotation())
      .add(card.current.translation());
    math.curve.points[0].copy(math.attachment);
    math.curve.points[1].copy(math.p2);
    math.curve.points[2].copy(math.p1);
    math.curve.points[3].copy(fixed.current.translation());
    math.slack = THREE.MathUtils.damp(math.slack, dragged ? 0 : 0.11, 8, delta);
    math.curve.points[1].z += math.slack;
    math.curve.points[2].z += math.slack * 0.6;
    math.curve.curveType = "chordal";
    band.current.geometry.setPoints(math.curve.getPoints(32));
    // The fixed anchor is offscreen; shift the printed logo down the visible band.
    const uv = band.current.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) + 0.25);
    uv.needsUpdate = true;
    if (!dragged && (flipPending.current || performance.now() > freeSpinUntil.current)) {
      const linear = card.current.linvel();
      if (flipPending.current || Math.hypot(linear.x, linear.y, linear.z) < 1.5) {
        const q = card.current.rotation();
        const angular = card.current.angvel();
        const yaw = Math.atan2(
          2 * (q.w * q.y + q.x * q.z),
          1 - 2 * (q.y * q.y + q.z * q.z),
        );
        const target = flipped ? Math.PI : 0;
        const error = Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw));
        if (Math.abs(error) < 0.04 && Math.abs(angular.y) < 0.2)
          flipPending.current = false;
        if (Math.abs(error) > 0.015 || Math.abs(angular.y) > 0.03) {
          card.current.setAngvel(
            {
              x: angular.x,
              y: THREE.MathUtils.damp(
                angular.y,
                THREE.MathUtils.clamp(error * 8, -7, 7),
                12,
                delta,
              ),
              z: angular.z,
            },
            true,
          );
        }
      }
    }
  });
  return (
    <>
      <group>
        <RigidBody
          ref={fixed}
          position={[0, anchorHeight, 0]}
          {...bodyProps}
          type="fixed"
        />
        <RigidBody ref={j1} position={dropPositions[0]} {...bodyProps}>
          <BallCollider args={[0.08]} mass={jointMass} collisionGroups={0} />
        </RigidBody>
        <RigidBody ref={j2} position={dropPositions[1]} {...bodyProps}>
          <BallCollider args={[0.08]} mass={jointMass} collisionGroups={0} />
        </RigidBody>
        <RigidBody ref={j3} position={dropPositions[2]} {...bodyProps}>
          <BallCollider args={[0.08]} mass={jointMass} collisionGroups={0} />
        </RigidBody>
        <RigidBody
          ref={card}
          position={dropPositions[3]}
          {...bodyProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
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
              releasePending.current = false;
              dragVelocity.current.set(0, 0, 0);
              releaseSpin.current.set(0, 0, 0);
              dragStart.current.copy(card.current.translation());
              dragRotation.current.copy(card.current.rotation());
              flipPending.current = false;
              recoilStart.current = 0;
              [j1, j2, j3, card].forEach((body) =>
                body.current.setLinearDamping(5),
              );
              card.current.setAngularDamping(2.2);
              previousDragPoint.current.copy(card.current.translation());
              setDragged(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(card.current.translation()),
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
          lineWidth={lanyardWidth}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
