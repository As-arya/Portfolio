"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import "./gradient-waves.css";

// Adapted from React Bits GradientWaves; license: public/lanyard/REACT-BITS-LICENSE.md.
const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uWaveScale;
uniform float uWaveRatio;
uniform float uSwell;
uniform float uTurbulence;
uniform float uTilt;
uniform float uZoom;
uniform float uHeight;
uniform float uFogDepth;
uniform float uSteps;
uniform float uBrightness;
uniform float uOpacity;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec2 uMouse;
uniform float uParallax;
uniform bool uEnableMouse;
uniform vec3 uHorizonColor;
uniform vec3 uWaveColor;
uniform vec3 uCrestColor;
out vec4 fragColor;

const float MAX_DIST = 20000.0;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float plasma(vec3 r, vec2 freq, vec4 tc) {
  float mx = r.x + tc.x;
  mx += uSwell * sin((r.y + mx) / 20.0 + tc.y);
  float my = r.y - tc.z;
  my += uTurbulence * cos(r.x / 23.0 + tc.w);
  return r.z - (sin(mx * freq.x) * uAmplitude + sin(my * freq.y) * uAmplitude + uHeight);
}

float raymarch(vec3 pos, vec3 dir, vec2 freq, vec4 tc) {
  float dist = 0.0;
  for (int i = 0; i < 128; i++) {
    if (float(i) >= uSteps) break;
    float dscene = plasma(pos + dist * dir, freq, tc);
    if (abs(dscene) < 0.1) break;
    dist += 0.9 * dscene;
    if (!(abs(dist) < MAX_DIST)) return MAX_DIST;
  }
  return dist;
}

void main() {
  float T = iTime * uSpeed;
  vec2 freq = vec2(uWaveScale / 7.0, (uWaveScale * uWaveRatio) / 3.0);
  vec4 tc = vec4(T / 0.130, T / 0.810, T / 0.200, T / 0.710);
  float c, s;
  float vfov = (3.14159 / 2.3) / max(uZoom, 0.05);
  vec3 cam = vec3(0.0, 0.0, 30.0);
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) - 0.5;
  uv.x *= iResolution.x / iResolution.y;
  uv.y *= -1.0;

  vec3 dir = vec3(0.0, 0.0, -1.0);
  float ulen = length(uv);
  float xrot = vfov * ulen;
  c = cos(xrot); s = sin(xrot);
  dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  vec2 nuv = ulen > 1e-5 ? uv / ulen : vec2(1.0, 0.0);
  c = nuv.x; s = nuv.y;
  dir = mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0) * dir;
  c = cos(uTilt); s = sin(uTilt);
  dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;

  if (uEnableMouse) {
    float yaw = (uMouse.x - 0.5) * uParallax * 0.4;
    float pitch = (uMouse.y - 0.5) * uParallax * 0.4;
    c = cos(yaw); s = sin(yaw);
    dir = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c) * dir;
    c = cos(pitch); s = sin(pitch);
    dir = mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c) * dir;
  }

  float dist = raymarch(cam, dir, freq, tc);
  vec3 pos = cam + dist * dir;

  float t = clamp(uFogDepth / max(dist, 0.001), 0.0, 1.0);
  vec3 body = mix(uWaveColor, uCrestColor, clamp(pos.z * 0.08 + 0.5, 0.0, 1.0));
  vec3 col = mix(uHorizonColor, body, t);
  col *= uBrightness;
  col = clamp(col, 0.0, 1.0);

  float alpha = clamp(t, 0.0, 1.0) * uOpacity;
  if (uGrain > 0.5) {
    float g = hash21(gl_FragCoord.xy + mod(iTime, 64.0) * 11.0);
    alpha += (g - 0.5) * uGrainIntensity;
  }
  alpha = clamp(alpha, 0.0, 1.0);
  fragColor = vec4(col * alpha, alpha);
}
`;

export default function GradientWaves() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2", { alpha: true, antialias: false, premultipliedAlpha: true })) return;
    const renderer = new Renderer({ canvas, webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(devicePixelRatio || 1, 1) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
        uSpeed: { value: 0.2 }, uAmplitude: { value: 2.5 }, uWaveScale: { value: 0.6 },
        uWaveRatio: { value: 0.9 }, uSwell: { value: 35 }, uTurbulence: { value: 20 },
        uTilt: { value: 1.11 }, uZoom: { value: 1 }, uHeight: { value: 5.5 }, uFogDepth: { value: 15 },
        uSteps: { value: innerWidth < 768 ? 40 : 70 }, uBrightness: { value: 1 }, uOpacity: { value: 1 },
        uGrain: { value: 1 }, uGrainIntensity: { value: 0.015 },
        uMouse: { value: new Float32Array([0.5, 0.5]) }, uParallax: { value: 0.2 }, uEnableMouse: { value: false },
        uHorizonColor: { value: new Float32Array(3) }, uWaveColor: { value: new Float32Array(3) }, uCrestColor: { value: new Float32Array(3) },
      },
      depthTest: false, depthWrite: false,
    });
    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(canvas);
    const uniforms = program.uniforms;
    const reduced = matchMedia("(prefers-reduced-motion: reduce), (prefers-contrast: more), (prefers-reduced-transparency: reduce)");
    const coarsePointer = matchMedia("(pointer: coarse)");
    const mouse = uniforms.uMouse.value as Float32Array;
    const target = [0.5, 0.5];
    let frame = 0;
    let lastTime = 0;

    function render() {
      if (!gl.isContextLost()) renderer.render({ scene: mesh });
    }
    function resize() {
      renderer.setSize(Math.max(1, container!.clientWidth), Math.max(1, container!.clientHeight));
      uniforms.iResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
      uniforms.uSteps.value = innerWidth < 768 ? 40 : 70;
      render();
    }
    function updateColors() {
      const style = getComputedStyle(container!);
      for (const [uniform, property] of [["uHorizonColor", "--waves-horizon"], ["uWaveColor", "--waves-body"], ["uCrestColor", "--waves-crest"]]) {
        const hex = style.getPropertyValue(property).trim().replace("#", "");
        uniforms[uniform].value.set([0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255));
      }
      render();
    }
    function animate(time: number) {
      frame = requestAnimationFrame(animate);
      if (lastTime && time - lastTime < 1000 / 30) return;
      uniforms.iTime.value += lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
      lastTime = time;
      mouse[0] += (target[0] - mouse[0]) * 0.08;
      mouse[1] += (target[1] - mouse[1]) * 0.08;
      render();
    }
    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
    function updateMotion() {
      stop();
      uniforms.uEnableMouse.value = !reduced.matches && !coarsePointer.matches;
      uniforms.uGrain.value = reduced.matches ? 0 : 1;
      if (reduced.matches) {
        uniforms.iTime.value = 0;
        mouse.set([0.5, 0.5]);
      }
      if (document.hidden || gl.isContextLost()) return;
      render();
      if (!reduced.matches) frame = requestAnimationFrame(animate);
    }
    function onPointerMove(event: PointerEvent) {
      if (!uniforms.uEnableMouse.value || event.pointerType === "touch") return;
      target[0] = Math.max(0, Math.min(1, event.clientX / innerWidth));
      target[1] = 1 - Math.max(0, Math.min(1, event.clientY / innerHeight));
    }
    function resetPointer() { target[0] = target[1] = 0.5; }
    function onContextLost() {
      stop();
      canvas.style.visibility = "hidden";
    }

    updateColors();
    resize();
    updateMotion();
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(container);
    const themeObserver = new MutationObserver(updateColors);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    reduced.addEventListener("change", updateMotion);
    coarsePointer.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateMotion);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("pointerleave", resetPointer);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      stop();
      sizeObserver.disconnect();
      themeObserver.disconnect();
      reduced.removeEventListener("change", updateMotion);
      coarsePointer.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateMotion);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("pointerleave", resetPointer);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.remove();
      program.remove();
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div ref={containerRef} className="gradient-waves" aria-hidden="true" />;
}

