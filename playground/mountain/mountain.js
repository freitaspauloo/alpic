import {
  buildTerrain,
  buildGrid,
  sceneMatrix,
  TERRAIN_HALF,
  INITIAL_YAW,
  INITIAL_PITCH,
  MIN_PITCH,
  MAX_PITCH,
  VERTEX_STRIDE,
} from "./mountain-geometry.js";

// A small, dependency-free WebGL2 renderer for the sculpted Alpine watershed.
const canvas = document.querySelector("#mountain");
const scene = document.querySelector(".terrain");
const signIn = document.querySelector(".sign-in");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

async function startTerrain() {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
  if (!gl) {
    return;
  }
  const compact = matchMedia("(max-width: 900px)");
  const response = await fetch("./assets/alpine-massif.bin");
  if (!response.ok) {
    throw new Error("Terrain unavailable");
  }
  const elevations = new Uint16Array(await response.arrayBuffer());

  const vertex = `#version 300 es
    precision highp float;
    in vec3 position, normal, macroNormal;
    in float curvature, coverage, snow;
    uniform mat4 sceneMatrix;
    out vec3 vPosition, vNormal, vMacro;
    out float vCurvature, vCoverage, vSnow;
    void main() {
      vPosition=position; vNormal=normal; vMacro=macroNormal; vCurvature=curvature;
      vCoverage=coverage; vSnow=snow;
      gl_Position=sceneMatrix*vec4(position,1.0);
    }`;
  const fragment = `#version 300 es
    precision highp float;
    in vec3 vPosition, vNormal, vMacro;
    in float vCurvature, vCoverage, vSnow;
    uniform int grid;
    uniform float pixelRatio, elapsed, yaw, pitch, terrainHalf, terrainSize;
    uniform sampler2D heightMap;
    out vec4 color;
    float hash(vec3 point) { return fract(sin(dot(point,vec3(127.1,311.7,74.7)))*43758.5453); }
    float noise(vec3 point) {
      vec3 cell=floor(point), blend=fract(point); blend=blend*blend*(3.0-2.0*blend);
      return mix(mix(mix(hash(cell),hash(cell+vec3(1,0,0)),blend.x),mix(hash(cell+vec3(0,1,0)),hash(cell+vec3(1,1,0)),blend.x),blend.y),
        mix(mix(hash(cell+vec3(0,0,1)),hash(cell+vec3(1,0,1)),blend.x),mix(hash(cell+vec3(0,1,1)),hash(cell+vec3(1,1,1)),blend.x),blend.y),blend.z);
    }
    vec3 toLocal(vec3 direction) {
      return vec3(cos(yaw)*direction.x-sin(yaw)*direction.z,direction.y,sin(yaw)*direction.x+cos(yaw)*direction.z);
    }
    float sunlight(vec3 point,vec3 light) {
      // Height-field ray marching: ridges actually shadow neighboring valleys.
      // Light is transformed into the same object space as the height texture.
      for(int step=1;step<=14;step++) {
        vec3 samplePoint=point+light*(0.055+float(step)*0.15);
        vec2 uv=(samplePoint.xz+terrainHalf)/(2.0*terrainHalf);
        if(any(lessThan(uv,vec2(0)))||any(greaterThan(uv,vec2(1)))) break;
        uv=(uv*(terrainSize-1.0)+0.5)/terrainSize;
        if(texture(heightMap,uv).r>samplePoint.y+0.035) return 0.32;
      }
      return 1.0;
    }
    void main() {
      if(grid==1) { color=vec4(0.18,0.27,0.25,1); return; }
      vec3 point=vPosition, normal=normalize(vNormal), macro=normalize(vMacro);
      if(vCoverage<0.5) discard;
      ivec2 cell=ivec2(mod(floor(gl_FragCoord.xy/pixelRatio),4.0));
      float bayer[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
      float threshold=(bayer[cell.y*4+cell.x]+0.5)/16.0;
      float stone=noise(point*vec3(22,8,22));
      float seams=noise(point*vec3(17,3,17)+noise(point*3.0)*1.3);
      vec3 sun=toLocal(normalize(vec3(-0.85,0.7,0.35)));
      vec3 view=toLocal(vec3(0,sin(pitch),cos(pitch)));
      float shadow=sunlight(point,sun);
      // One material for the entire massif, using the accepted front's
      // detailed normals, palette, cavities and fine rock grain on every face.
      vec3 faceNormal=normalize(normal);
      float diffuse=max(0.0,dot(faceNormal,sun));
      float cavity=clamp(vCurvature*0.3,0.0,0.18);
      float illumination=0.22+diffuse*shadow*0.78-cavity;
      // Glacier material follows the actual filled valley. Smaller snowfields
      // collect on gentle shoulders; rock texture cannot fragment the glacier.
      float snowLine=.64+(noise(point*vec3(7,2,7))-.5)*.10;
      bool snow=macro.y>snowLine || (vSnow>.55 && macro.y>.28);
      float tone=illumination;
      vec3 ink;
      if(snow) {
        tone=.22+max(0.0,dot(macro,sun))*shadow*.78;
        ink=tone>.83 ? vec3(.78,.94,.95) :
            tone>.57 ? vec3(.65,.86,.90) :
            tone>.36 ? vec3(.43,.69,.76) : vec3(.30,.52,.59);
        // A few small dither patches catch sunlight; the rest stays flat ink.
        float lightPatch=noise(point*4.0);
        float shimmer=sin(elapsed*1.6+hash(floor(point*18.0))*6.283)*.07;
        if(shadow>.5 && diffuse>.6 && lightPatch>.77 && threshold<.06+shimmer) ink=vec3(.91,.98,.96);
      } else {
        tone+=(stone-.5)*.06;
        ink=tone>.79 ? vec3(1.0,.47,.51) :
            tone>.59 ? vec3(.96,.32,.39) :
            tone>.44 ? vec3(.66,.25,.32) :
            tone>.28 ? vec3(.20,.29,.31) : vec3(.10,.19,.21);
        if(seams<.26 && vCurvature>.08) ink=vec3(.12,.21,.23);
        if(seams>.72 && tone>.68) ink=vec3(1.0,.65,.66);
      }
      // Sparkles are anchored to snow microfacets in object space. Independent,
      // sparse pulses blink on/off as the sun/view half-vector catches them.
      // No screen-space noise, floating particles, or whole-surface flashing.
      if(snow && shadow>0.5) {
        vec3 crystal=floor(point*105.0);
        float seed=hash(crystal);
        float pulse=pow(max(0.0,sin(elapsed*(1.8+seed*2.1)+seed*62.83)),16.0);
        float reflection=pow(max(0.0,dot(normal,normalize(sun+view))),10.0);
        float glint=pulse*(0.55+reflection*0.45)*diffuse;
        if(seed>0.97 && glint>0.27+threshold*0.25) ink=vec3(1.0,0.99,0.94);
      }
      color=vec4(ink,1.0);
    }`;
  function shader(type, source) {
    const item = gl.createShader(type);
    gl.shaderSource(item, source);
    gl.compileShader(item);
    if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(item));
    }
    return item;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("Terrain shader failed");
  }
  gl.useProgram(program);
  const uniforms = Object.fromEntries(
    ["sceneMatrix", "yaw", "pitch", "grid", "pixelRatio", "elapsed", "heightMap", "terrainHalf", "terrainSize"].map(
      (key) => [key, gl.getUniformLocation(program, key)],
    ),
  );
  const mesh = buildTerrain(elevations, compact.matches ? 321 : 513);
  const { vertices, indices } = mesh;
  const heightTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, heightTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, mesh.size, mesh.size, 0, gl.RED, gl.FLOAT, mesh.heights);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(uniforms.heightMap, 0);
  gl.uniform1f(uniforms.terrainHalf, TERRAIN_HALF);
  gl.uniform1f(uniforms.terrainSize, mesh.size);
  function geometry(data, elements) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    for (const [name, offset] of [
      ["position", 0],
      ["normal", 12],
      ["macroNormal", 24],
      ["curvature", 36],
      ["coverage", 40],
      ["snow", 44],
    ]) {
      const location = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, offset >= 36 ? 1 : 3, gl.FLOAT, false, VERTEX_STRIDE * 4, offset);
    }
    if (elements) {
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);
    }
    return vao;
  }
  const terrain = geometry(vertices, indices);
  const lines = buildGrid();
  const grid = geometry(lines);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  let clearance = null;
  let yaw = INITIAL_YAW,
    pitch = INITIAL_PITCH,
    elapsed = 0,
    velocity = 0,
    drag = null,
    paused = reduced.matches,
    autoRotate = true,
    visible = true,
    frame = 0,
    previous = 0,
    lastInteraction = 0;
  function draw(time = 0) {
    frame = 0;
    const dt = Math.min((time - previous) / 1000, 0.05);
    previous = time;
    if (!paused) {
      elapsed += dt;
    }
    if (!drag) {
      yaw += velocity * dt;
      velocity *= Math.exp(-dt * 5);
      if (!paused && autoRotate && time - lastInteraction > 2500) {
        yaw += dt * 0.035;
      }
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(uniforms.yaw, yaw);
    gl.uniform1f(uniforms.pitch, pitch);
    gl.uniformMatrix4fv(
      uniforms.sceneMatrix,
      false,
      sceneMatrix(yaw, pitch, canvas.width / canvas.height, compact.matches, clearance),
    );
    gl.uniform1f(uniforms.elapsed, elapsed);
    gl.uniform1f(uniforms.pixelRatio, Math.min(devicePixelRatio, 2));
    gl.uniform1i(uniforms.grid, 1);
    gl.bindVertexArray(grid);
    gl.drawArrays(gl.LINES, 0, lines.length / VERTEX_STRIDE);
    gl.uniform1i(uniforms.grid, 0);
    gl.bindVertexArray(terrain);
    // Offset terrain depth, not geometry, to avoid coplanar grid z-fighting.
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-1, -1);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    if (visible && !document.hidden && (!paused || Math.abs(velocity) > 0.001)) {
      requestDraw();
    }
  }
  function requestDraw() {
    if (!frame) {
      frame = requestAnimationFrame(draw);
    }
  }
  function resize() {
    const ratio = Math.min(devicePixelRatio, 2),
      rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    // Allow overlap with the transparent card and button edges, while keeping
    // the actual labels and icons clear through every rotation.
    const contentRight = Math.max(
      ...Array.from(
        signIn.querySelectorAll(".btn > span, .btn > svg"),
        (element) => element.getBoundingClientRect().right,
      ),
    );
    clearance = { left: (2 * (contentRight + 16 - rect.left)) / rect.width - 1, footprint: mesh.footprint };
    requestDraw();
  }
  new ResizeObserver(resize).observe(canvas);
  new ResizeObserver(resize).observe(signIn);
  void document.fonts.ready.then(resize);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      requestDraw();
    }
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      previous = performance.now();
      requestDraw();
    }
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    drag = { id: event.pointerId, column: event.clientX, row: event.clientY, time: performance.now() };
    velocity = 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("grabbing");
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) {
      return;
    }
    const now = performance.now(),
      dx = event.clientX - drag.column;
    yaw += dx * 0.007;
    if (event.pointerType === "mouse") {
      pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch + (event.clientY - drag.row) * 0.003));
    }
    velocity = reduced.matches
      ? 0
      : Math.max(-2, Math.min(2, (dx * 0.007) / Math.max(0.016, (now - drag.time) / 1000)));
    drag = { id: drag.id, column: event.clientX, row: event.clientY, time: now };
    lastInteraction = now;
    requestDraw();
  });
  function release() {
    drag = null;
    canvas.classList.remove("grabbing");
    lastInteraction = performance.now();
    requestDraw();
  }
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", () => {
    velocity = 0;
    release();
  });
  canvas.addEventListener("lostpointercapture", release);
  canvas.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", " "].includes(event.key)) {
      return;
    }
    event.preventDefault();
    if (event.key === " ") {
      paused = !paused;
    }
    autoRotate = false;
    velocity = 0;
    if (event.key === "ArrowLeft") {
      yaw -= 0.12;
    }
    if (event.key === "ArrowRight") {
      yaw += 0.12;
    }
    if (event.key === "ArrowUp") {
      pitch = Math.min(MAX_PITCH, pitch + 0.04);
    }
    if (event.key === "ArrowDown") {
      pitch = Math.max(MIN_PITCH, pitch - 0.04);
    }
    if (event.key === "Home") {
      yaw = INITIAL_YAW;
      pitch = INITIAL_PITCH;
    }
    requestDraw();
  });
  reduced.addEventListener("change", () => {
    paused = reduced.matches;
    velocity = 0;
    requestDraw();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    scene.classList.remove("ready");
    canvas.tabIndex = -1;
    canvas.setAttribute("aria-hidden", "true");
  });

  resize();
  canvas.tabIndex = 0;
  canvas.removeAttribute("aria-hidden");
  scene.classList.add("ready");
}
startTerrain().catch((error) => {
  console.warn("Interactive terrain unavailable:", error);
  /* The original artwork remains visible if WebGL or its data fails. */
});
