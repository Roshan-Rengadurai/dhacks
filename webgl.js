(() => {
  const canvas = document.getElementById("hero-webgl");
  if (!canvas) return;

  const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
  if (!gl) return;

  const vertexSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_pointer;

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = dot(i, vec2(127.1, 311.7));
      float b = dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7));
      float c = dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7));
      float d = dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7));
      float va = fract(sin(a) * 43758.5453123);
      float vb = fract(sin(b) * 43758.5453123);
      float vc = fract(sin(c) * 43758.5453123);
      float vd = fract(sin(d) * 43758.5453123);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(va, vb, u.x) + (vc - va) * u.y * (1.0 - u.x) + (vd - vb) * u.x * u.y;
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      st.x *= u_resolution.x / u_resolution.y;

      vec2 drift = vec2(u_time * 0.03, u_time * 0.02);
      vec2 pointer = (u_pointer - 0.5) * 0.2;

      float n1 = noise((st + drift + pointer) * 2.2);
      float n2 = noise((st - drift) * 4.1);
      float blend = smoothstep(0.2, 0.8, n1);
      float depth = mix(n1, n2, 0.45);

      vec3 base = vec3(0.06, 0.11, 0.08);
      vec3 moss = vec3(0.18, 0.31, 0.2);
      vec3 lichen = vec3(0.45, 0.58, 0.38);

      vec3 color = mix(base, moss, blend);
      color = mix(color, lichen, depth * 0.6);

      float vignette = smoothstep(1.1, 0.2, length(st - 0.5));
      gl_FragColor = vec4(color * vignette, 1.0);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, "position");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const timeLocation = gl.getUniformLocation(program, "u_time");
  const pointerLocation = gl.getUniformLocation(program, "u_pointer");

  let pointer = { x: 0.5, y: 0.5 };

  function resize() {
    const scale = window.devicePixelRatio || 1;
    const width = Math.floor(canvas.clientWidth * scale);
    const height = Math.floor(canvas.clientHeight * scale);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function render(time) {
    resize();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, time * 0.001);
    gl.uniform2f(pointerLocation, pointer.x, pointer.y);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  window.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: (event.clientX - rect.left) / rect.width,
      y: 1 - (event.clientY - rect.top) / rect.height,
    };
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(render);
})();
