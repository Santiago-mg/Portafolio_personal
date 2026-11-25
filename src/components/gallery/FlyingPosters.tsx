// Adapted from React Bits (https://reactbits.dev) — MIT + Commons Clause, © 2026 David Haz
//
// Changes for this site: own CSS classes instead of Tailwind; a right-sized rectangular
// texture atlas (one batched upload instead of a 4096² atlas re-uploaded per image);
// `rotationCenter` so posters can face the viewer at the centre of the band; posters fade
// in only once their atlas is on the GPU; rendering pauses offscreen and in hidden tabs;
// page-scroll input is ignored with reduced motion and does not "catch up" after being
// offscreen; a non-interactive instance never takes pointer events.
'use client';

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';

export type FlyingPostersItem = string | { image: string; link?: string; alt?: string };

export interface FlyingPostersProps {
  items?: FlyingPostersItem[];
  planeWidth?: number;
  planeHeight?: number;
  distortion?: number;
  scrollEase?: number;
  cameraFov?: number;
  cameraZ?: number;
  gap?: number;
  columns?: number;
  columnGap?: number;
  alternate?: boolean;
  radius?: number;
  rotation?: number;
  /** 0 = original behaviour; 0.5 = posters face the camera at the vertical centre */
  rotationCenter?: number;
  axis?: 'vertical' | 'horizontal' | 'diagonal';
  speed?: number;
  lean?: number;
  fade?: number;
  shading?: number;
  wheel?: boolean;
  drag?: boolean;
  pageScroll?: number;
  onItemClick?: (item: { image: string; link?: string; alt?: string }, index: number) => void;
  className?: string;
  style?: CSSProperties;
}

type Engine = { loadItems: (list: FlyingPostersItem[]) => void; wake: () => void };

const VERTEX = `#version 300 es
in vec2 aPosition;
in vec4 aPoster;
uniform mat4 uProjection;
uniform float uCamera;
uniform vec2 uPoster;
uniform float uDepth;
uniform float uSpacing;
uniform float uLoop;
uniform float uColumnGap;
uniform float uColumns;
uniform float uScroll;
uniform float uAlternate;
uniform float uViewHeight;
uniform float uRotation;
uniform float uRotationCenter;
uniform float uDistortion;
uniform vec3 uAxis;
uniform float uLean;
out vec2 vUv;
flat out float vItem;
out float vFacing;
out float vScreenY;

mat4 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat4(
    oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
    oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 0.0,
    oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
  return (rotationMatrix(axis, angle) * vec4(v, 1.0)).xyz;
}

float qinticInOut(float t) {
  return t < 0.5 ? 16.0 * pow(t, 5.0) : -0.5 * abs(pow(2.0 * t - 2.0, 5.0)) + 1.0;
}

void main() {
  float column = aPoster.x;
  float direction = uAlternate > 0.5 && mod(column, 2.0) > 0.5 ? -1.0 : 1.0;
  float base = -uLoop * 0.5 + (aPoster.y + 0.5) * uSpacing + column * 0.41 * uSpacing;
  float y = mod(base - uScroll * direction + uLoop * 0.5, uLoop) - uLoop * 0.5;
  float x = (column - (uColumns - 1.0) * 0.5) * uColumnGap;
  float position = 5.0 + (y + uViewHeight) / (2.0 * uViewHeight) * 10.0;
  float offset = (dot(vec2(1.0, 1.0), aPosition) + 0.25) / 0.5;
  float progress = clamp(
    (clamp(position * 0.05, 0.0, 1.0) - 0.01 * uDistortion * offset) / (1.0 - 0.01 * uDistortion),
    0.0,
    2.0
  );
  float angle = (qinticInOut(progress) - uRotationCenter) * uRotation;
  vec3 local = rotate(vec3(aPosition, 0.0), uAxis, angle);
  vec3 normal = rotate(vec3(0.0, 0.0, 1.0), uAxis, angle);
  local = rotate(local * vec3(uPoster, uDepth), vec3(1.0, 0.0, 0.0), uLean * direction);
  normal = rotate(normal, vec3(1.0, 0.0, 0.0), uLean * direction);
  vec3 world = local + vec3(x, y, 0.0);
  gl_Position = uProjection * vec4(world.xy, world.z - uCamera, 1.0);
  vUv = aPosition + 0.5;
  vItem = aPoster.z;
  vFacing = normal.z;
  vScreenY = gl_Position.y / gl_Position.w;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
uniform vec2 uGrid;
uniform vec2 uInset;
uniform vec2 uPoster;
uniform float uRadius;
uniform float uFade;
uniform float uShading;
uniform float uReveal;
in vec2 vUv;
flat in float vItem;
in float vFacing;
in float vScreenY;
out vec4 outColor;

void main() {
  vec2 p = (vUv - 0.5) * uPoster;
  float r = min(uRadius, 0.5 * min(uPoster.x, uPoster.y));
  vec2 q = abs(p) - (0.5 * uPoster - r);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float aa = max(fwidth(d), 0.0001);
  float mask = r > 0.0 ? 1.0 - smoothstep(-aa, aa, d) : 1.0;
  vec2 cell = vec2(mod(vItem, uGrid.x), floor(vItem / uGrid.x));
  vec2 local = vec2(vUv.x, 1.0 - vUv.y);
  vec4 sampled = texture(uAtlas, (cell + uInset + local * (1.0 - 2.0 * uInset)) / uGrid);
  vec3 color = sampled.rgb;
  color *= mix(1.0, 0.4 + 0.6 * abs(vFacing), uShading);
  float t = clamp((1.0 - abs(vScreenY)) / max(uFade, 0.0001), 0.0, 1.0);
  float fade = uFade > 0.0 ? t * t * t * (t * (t * 6.0 - 15.0) + 10.0) : 1.0;
  float alpha = sampled.a * mask * fade * uReveal;
  if (alpha < 0.002) discard;
  outColor = vec4(color * alpha, alpha);
}`;

const AXES: Record<string, number[]> = { vertical: [0, 1, 0], horizontal: [1, 0, 0], diagonal: [1, 1, 0] };
const REFERENCE_FOV = (45 * Math.PI) / 180;
const REFERENCE_Z = 20;
const GRID_X = 100;
const GRID_Y = 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const toItem = (item: FlyingPostersItem | undefined): { image: string; link?: string; alt?: string } =>
  typeof item === 'string' ? { image: item } : item || { image: '' };

const FlyingPosters = ({
  items = [],
  planeWidth = 320,
  planeHeight = 320,
  distortion = 3,
  scrollEase = 0.01,
  cameraFov = 45,
  cameraZ = 20,
  gap,
  columns = 1,
  columnGap = 40,
  alternate = true,
  radius = 0,
  rotation = 180,
  rotationCenter = 0,
  axis = 'vertical',
  speed = 0,
  lean = 0,
  fade = 0,
  shading = 0,
  wheel = true,
  drag = true,
  pageScroll = 0,
  onItemClick,
  className = '',
  style,
}: FlyingPostersProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const settings = {
    planeWidth: Math.max(10, planeWidth),
    planeHeight: Math.max(10, planeHeight),
    distortion: clamp(distortion, 0, 50),
    scrollEase: clamp(scrollEase, 0.001, 1),
    cameraFov: clamp(cameraFov, 10, 120),
    cameraZ: Math.max(1, cameraZ),
    gap,
    columns: clamp(Math.round(columns), 1, 8),
    columnGap: Math.max(0, columnGap),
    alternate,
    radius: Math.max(0, radius),
    rotation,
    rotationCenter: clamp(rotationCenter, 0, 1),
    axis: AXES[axis] ? axis : 'vertical',
    speed,
    lean: clamp(lean, 0, 2),
    fade: clamp(fade, 0, 1),
    shading: clamp(shading, 0, 1),
    wheel,
    drag,
    pageScroll,
  };
  const settingsRef = useRef(settings);
  const itemsRef = useRef(items);
  const clickRef = useRef(onItemClick);
  useLayoutEffect(() => {
    settingsRef.current = settings;
    itemsRef.current = items;
    clickRef.current = onItemClick;
  });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!root || !canvas || !gl) return undefined;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return undefined;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of [
      'uProjection',
      'uCamera',
      'uPoster',
      'uDepth',
      'uSpacing',
      'uLoop',
      'uColumnGap',
      'uColumns',
      'uScroll',
      'uAlternate',
      'uViewHeight',
      'uRotation',
      'uRotationCenter',
      'uDistortion',
      'uAxis',
      'uLean',
      'uAtlas',
      'uGrid',
      'uInset',
      'uRadius',
      'uFade',
      'uShading',
      'uReveal',
    ]) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }

    const positions: number[] = [];
    const indices: number[] = [];
    for (let y = 0; y <= GRID_Y; y++) {
      for (let x = 0; x <= GRID_X; x++) positions.push(x / GRID_X - 0.5, y / GRID_Y - 0.5);
    }
    for (let y = 0; y < GRID_Y; y++) {
      for (let x = 0; x < GRID_X; x++) {
        const i = y * (GRID_X + 1) + x;
        indices.push(i + GRID_X + 1, i, i + GRID_X + 2, i, i + 1, i + GRID_X + 2);
      }
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    const posterBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posterBuffer);
    const posterLocation = gl.getAttribLocation(program, 'aPoster');
    gl.enableVertexAttribArray(posterLocation);
    gl.vertexAttribPointer(posterLocation, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(posterLocation, 1);
    gl.bindVertexArray(null);

    const atlasTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.uniform1i(uniforms.uAtlas, 0);
    const maxTexture = Math.min(4096, Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 2048);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    // Rectangular cells sized to what the planes need on screen (DPR included).
    const atlas = {
      canvas: document.createElement('canvas'),
      cols: 1,
      rows: 1,
      cellW: 256,
      cellH: 256,
      key: '',
      images: [] as (HTMLImageElement | null)[],
      loading: 0,
      dirty: false,
      dirtySince: 0,
      uploaded: false,
    };
    const pointer = { active: false, id: -1, origin: 0, startY: 0, startX: 0, start: 0 };
    const state = {
      width: 1,
      height: 1,
      dpr: 1,
      scroll: 0,
      target: 0,
      velocity: 0,
      lean: 0,
      reveal: 0,
      slots: 0,
      count: 0,
      layoutKey: '',
      pageY: window.scrollY,
    };
    let raf = 0;
    let last = 0;
    let visible = true;
    let alive = true;
    let request = 0;

    const metrics = () => {
      const s = settingsRef.current;
      const fov = (s.cameraFov * Math.PI) / 180;
      const unit = state.height / (2 * Math.tan(REFERENCE_FOV / 2) * REFERENCE_Z);
      const distance = s.cameraZ * unit;
      const spacing = s.planeHeight + (s.gap ?? 5 * unit);
      const scale = (2 * distance * Math.tan(fov / 2)) / state.height;
      return { fov, unit, spacing, distance, scale };
    };

    const layout = () => {
      const s = settingsRef.current;
      const list = itemsRef.current;
      const { spacing, scale } = metrics();
      const slots = Math.max(list.length, Math.ceil((state.height * scale + s.planeHeight) / spacing) + 1);
      const key = [slots, s.columns, list.length].join('|');
      if (key === state.layoutKey) return;
      state.layoutKey = key;
      state.slots = slots;
      state.count = slots * s.columns;
      const total = Math.max(1, list.length);
      const data = new Float32Array(state.count * 4);
      for (let column = 0; column < s.columns; column++) {
        for (let slot = 0; slot < slots; slot++) {
          data.set([column, slot, (slot + column * 2) % total, 0], (column * slots + slot) * 4);
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, posterBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };

    const paintCell = (index: number) => {
      const image = atlas.images[index];
      const ctx = atlas.canvas.getContext('2d');
      if (!image || !ctx) return;
      const aspect = atlas.cellW / atlas.cellH;
      let sw = image.naturalWidth;
      let sh = image.naturalHeight;
      if (sw / sh > aspect) sw = sh * aspect;
      else sh = sw / aspect;
      const x = (index % atlas.cols) * atlas.cellW;
      const y = Math.floor(index / atlas.cols) * atlas.cellH;
      ctx.clearRect(x, y, atlas.cellW, atlas.cellH);
      ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, atlas.cellW, atlas.cellH);
      if (!atlas.dirty) atlas.dirtySince = performance.now();
      atlas.dirty = true;
    };

    /** Resizes the atlas to the current plane size; repaints every loaded image when it changes. */
    const fitAtlas = () => {
      const s = settingsRef.current;
      const total = Math.max(1, atlas.images.length);
      atlas.cols = Math.ceil(Math.sqrt(total));
      atlas.rows = Math.ceil(total / atlas.cols);
      const cellW = Math.round(clamp(s.planeWidth * state.dpr, 64, Math.floor(maxTexture / atlas.cols)));
      const cellH = Math.round(clamp(s.planeHeight * state.dpr, 64, Math.floor(maxTexture / atlas.rows)));
      const key = [atlas.cols, atlas.rows, cellW, cellH].join('|');
      if (key === atlas.key) return;
      atlas.key = key;
      atlas.cellW = cellW;
      atlas.cellH = cellH;
      atlas.canvas.width = atlas.cols * cellW;
      atlas.canvas.height = atlas.rows * cellH;
      atlas.images.forEach((_, i) => paintCell(i));
    };

    const uploadAtlas = () => {
      atlas.dirty = false;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
      gl.generateMipmap(gl.TEXTURE_2D);
      atlas.uploaded = true;
    };

    const loadItems = (list: FlyingPostersItem[]) => {
      const current = ++request;
      const entries = list.map(toItem);
      atlas.images = entries.map(() => null);
      atlas.key = '';
      atlas.loading = entries.length;
      fitAtlas();
      state.layoutKey = '';
      entries.forEach((entry, index) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.decoding = 'async';
        const settle = () => {
          if (!alive || current !== request) return;
          atlas.loading = Math.max(0, atlas.loading - 1);
          wake();
        };
        image.onload = () => {
          if (!alive || current !== request) return;
          atlas.images[index] = image;
          paintCell(index);
          settle();
        };
        image.onerror = settle;
        image.src = entry.image || '';
      });
      wake();
    };

    const posterAt = (clientX: number, clientY: number) => {
      const s = settingsRef.current;
      const rect = canvas.getBoundingClientRect();
      const { spacing, scale } = metrics();
      const x = (clientX - rect.left - rect.width / 2) * scale;
      const y = (rect.height / 2 - (clientY - rect.top)) * scale;
      const loop = state.slots * spacing;
      for (let column = 0; column < s.columns; column++) {
        const direction = s.alternate && column % 2 === 1 ? -1 : 1;
        const cx = (column - (s.columns - 1) / 2) * (s.planeWidth + s.columnGap);
        if (Math.abs(x - cx) > s.planeWidth / 2) continue;
        for (let slot = 0; slot < state.slots; slot++) {
          const base = -loop / 2 + (slot + 0.5) * spacing + column * 0.41 * spacing;
          const raw = base - state.scroll * direction + loop / 2;
          const cy = (((raw % loop) + loop) % loop) - loop / 2;
          if (Math.abs(y - cy) <= s.planeHeight / 2) {
            return (slot + column * 2) % Math.max(1, itemsRef.current.length);
          }
        }
      }
      return -1;
    };

    const render = () => {
      const s = settingsRef.current;
      const { fov, unit, spacing, distance } = metrics();
      const aspect = state.width / state.height;
      const f = 1 / Math.tan(fov / 2);
      const near = Math.max(0.5, distance * 0.02);
      const far = distance * 4;
      const projection = new Float32Array(16);
      projection[0] = f / aspect;
      projection[5] = f;
      projection[10] = (far + near) / (near - far);
      projection[11] = -1;
      projection[14] = (2 * far * near) / (near - far);
      const axisVector = AXES[s.axis];
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!atlas.uploaded || state.reveal <= 0) return;
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.uniformMatrix4fv(uniforms.uProjection, false, projection);
      gl.uniform1f(uniforms.uCamera, distance);
      gl.uniform2f(uniforms.uPoster, s.planeWidth, s.planeHeight);
      gl.uniform1f(uniforms.uDepth, unit);
      gl.uniform1f(uniforms.uSpacing, spacing);
      gl.uniform1f(uniforms.uLoop, state.slots * spacing);
      gl.uniform1f(uniforms.uColumnGap, s.planeWidth + s.columnGap);
      gl.uniform1f(uniforms.uColumns, s.columns);
      gl.uniform1f(uniforms.uScroll, state.scroll);
      gl.uniform1f(uniforms.uAlternate, s.alternate ? 1 : 0);
      gl.uniform1f(uniforms.uViewHeight, state.height);
      gl.uniform1f(uniforms.uRotation, (s.rotation * Math.PI) / 180);
      gl.uniform1f(uniforms.uRotationCenter, s.rotationCenter);
      gl.uniform1f(uniforms.uDistortion, s.distortion);
      gl.uniform3f(uniforms.uAxis, axisVector[0], axisVector[1], axisVector[2]);
      gl.uniform1f(uniforms.uLean, state.lean);
      gl.uniform2f(uniforms.uGrid, atlas.cols, atlas.rows);
      gl.uniform2f(uniforms.uInset, 1.5 / atlas.cellW, 1.5 / atlas.cellH);
      gl.uniform1f(uniforms.uRadius, s.radius);
      gl.uniform1f(uniforms.uFade, s.fade);
      gl.uniform1f(uniforms.uShading, s.shading);
      gl.uniform1f(uniforms.uReveal, state.reveal);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
      gl.bindVertexArray(vao);
      gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0, state.count);
      gl.bindVertexArray(null);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) {
        last = 0;
        return;
      }
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      layout();
      fitAtlas();
      // One upload once every image has arrived (or after 250 ms), not one per image.
      if (atlas.dirty && (atlas.loading === 0 || now - atlas.dirtySince > 250)) uploadAtlas();
      if (atlas.uploaded) state.reveal = Math.min(1, state.reveal + dt / (reduce ? 0.01 : 0.6));
      if (!pointer.active && !reduce) state.target -= s.speed * dt;
      const previous = state.scroll;
      state.scroll += (state.target - state.scroll) * (1 - Math.pow(1 - s.scrollEase, dt * 60));
      state.velocity += ((state.scroll - previous) / dt - state.velocity) * (1 - Math.exp(-dt * 8));
      const leanTarget = reduce ? 0 : clamp(-state.velocity * s.lean * 0.0006, -0.5, 0.5);
      state.lean += (leanTarget - state.lean) * (1 - Math.exp(-dt * 6));
      render();
      const busy =
        (s.speed !== 0 && !reduce) ||
        Math.abs(state.target - state.scroll) > 0.05 ||
        Math.abs(state.lean) > 0.0005 ||
        (atlas.uploaded && state.reveal < 1) ||
        atlas.dirty;
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (raf || !alive || !visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };

    const onWheel = (event: WheelEvent) => {
      if (!settingsRef.current.wheel) return;
      event.preventDefault();
      const lines = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? state.height : 1;
      state.target += event.deltaY * lines * 0.01 * metrics().unit;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointer.startX = event.clientX;
      pointer.startY = event.clientY;
      pointer.start = performance.now();
      if (!settingsRef.current.drag) return;
      canvas.setPointerCapture?.(event.pointerId);
      pointer.active = true;
      pointer.id = event.pointerId;
      pointer.origin = state.scroll;
      wake();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointer.active || event.pointerId !== pointer.id) return;
      state.target = pointer.origin + (pointer.startY - event.clientY) * 0.1 * metrics().unit;
      wake();
    };

    const onPointerUp = (event: PointerEvent) => {
      const tap =
        Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) < 6 &&
        performance.now() - pointer.start < 450;
      if (pointer.active && event.pointerId === pointer.id) {
        pointer.active = false;
        canvas.releasePointerCapture?.(event.pointerId);
      }
      if (tap && clickRef.current) {
        const index = posterAt(event.clientX, event.clientY);
        if (index >= 0) clickRef.current(toItem(itemsRef.current[index]), index);
      }
      wake();
    };

    const onScroll = () => {
      const factor = reduce ? 0 : settingsRef.current.pageScroll;
      const y = window.scrollY;
      if (factor) {
        state.target += (y - state.pageY) * factor;
        // Offscreen: jump with the page instead of racing to catch up on re-entry.
        if (!visible) state.scroll = state.target;
        else wake();
      }
      state.pageY = y;
    };

    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = Math.max(1, root.clientWidth);
      state.height = Math.max(1, root.clientHeight);
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      state.layoutKey = '';
      layout();
      fitAtlas();
      render();
      wake();
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    engineRef.current = { loadItems, wake };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const visibility = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    visibility.observe(root);
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      engineRef.current = null;
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      resizeObserver.disconnect();
      visibility.disconnect();
      gl.deleteTexture(atlasTexture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteBuffer(posterBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.loadItems(items);
  }, [items]);

  useEffect(() => {
    engineRef.current?.wake();
  });

  const interactive = wheel || drag || !!onItemClick;
  return (
    <div ref={rootRef} className={`fx-fp${className ? ` ${className}` : ''}`} style={style}>
      <canvas
        ref={canvasRef}
        className="fx-fp-canvas"
        style={{
          touchAction: drag ? 'none' : 'auto',
          cursor: drag ? undefined : 'default',
          pointerEvents: interactive ? undefined : 'none',
        }}
      />
    </div>
  );
};

export default FlyingPosters;
