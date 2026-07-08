import * as THREE from "./vendor/three.module.min.js";

const scenes = [
  {
    title: "Moonlit Departure",
    image: "./assets/moon-canoe-tree.jpg",
    action: "Paddle",
    mood: 0x58ffe2,
    text:
      "Under a bright moon, four ordinary travelers step into a wooden canoe. The water is calm, the grass behind them is silver with night, and soft music drifts from somewhere beyond the reeds. With one careful paddle, the canoe leaves the shore and glides toward the glowing tree in the distance.",
  },
  {
    title: "The First Portal",
    image: "./assets/silver-fairy-tree.jpg",
    action: "Open Portal",
    mood: 0xd9f3ff,
    text:
      "A ring of light rises from the lake. It does not roar or shake; it simply hums like a friendly question. The travelers pass through it and see stars reflected below the canoe, as if the water has become a second sky.",
  },
  {
    title: "Waters of Time",
    image: "./assets/blossom-fairy-tree.jpg",
    action: "Drift",
    mood: 0xff8bdd,
    text:
      "The canoe crosses many gentle portals of space and time. In one, winter trees sparkle with frost. In another, flowers bloom above the water like lanterns. The moon follows every turn, bright and patient, guiding them toward the fairy tree.",
  },
  {
    title: "At the Fairy Tree",
    image: "./assets/moon-canoe-tree.jpg",
    action: "Greet",
    mood: 0xff9ee8,
    text:
      "At last the canoe reaches the island. Fairies circle the pink branches, surprised by the newcomers. The travelers wave, but the fairies flutter backward. Here, guests do not step onto the roots until they ask the tree for welcome.",
  },
  {
    title: "Learning Customs",
    image: "./assets/silver-fairy-tree.jpg",
    action: "Listen",
    mood: 0x9ef28a,
    text:
      "The disagreement is small but important. The humans think a smile is enough. The fairies explain that every visitor must offer a kind word to the tree, a quiet bow to the water, and a promise to leave no shadow of harm behind.",
  },
  {
    title: "New Friends",
    image: "./assets/blossom-fairy-tree.jpg",
    action: "Share",
    mood: 0xf7d48b,
    text:
      "The travelers teach the fairies a shore song from home. The fairies answer with music made of wings, blossoms, and moonlight. Soon everyone is laughing softly. Different customs become new bridges, and the strangers become lifelong friends.",
  },
  {
    title: "Mystery at the Roots",
    image: "./assets/blossom-fairy-tree.jpg",
    action: "Answer",
    mood: 0xb48cff,
    text:
      "Before farewell, the oldest fairy asks one simple mystery: What grows brighter when it is shared, but cannot be held in a hand?",
    question: {
      answers: ["Kindness", "A locked box", "A hidden stone"],
      correct: 0,
      response:
        "Yes. Kindness grows brighter when it is shared. The fairy tree glows from root to blossom.",
    },
  },
  {
    title: "Farewell for Now",
    image: "./assets/shore-grass-home.jpg",
    action: "Return",
    mood: 0x58ffe2,
    text:
      "The fairies wave farewell for now. The canoe turns toward shore, crossing the moonlit water with magical music drifting beside it. When the travelers step onto the green grass, they carry a new custom home: greet every unknown place with wonder, patience, and care.",
  },
];

const canvas = document.querySelector("#worldCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x07101d, 20, 76);

const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
camera.position.set(0, 8.2, 18);
camera.lookAt(0, 1.2, 0);

const loader = new THREE.TextureLoader();
const clock = new THREE.Clock();

const state = {
  index: 0,
  pulse: 0,
  moving: 0,
  music: false,
  questionAnswered: false,
  audio: null,
};

const ui = {
  image: document.querySelector("#sceneImage"),
  kicker: document.querySelector("#sceneKicker"),
  title: document.querySelector("#sceneTitle"),
  text: document.querySelector("#sceneText"),
  choices: document.querySelector("#choicePanel"),
  previous: document.querySelector("#prevButton"),
  next: document.querySelector("#nextButton"),
  interact: document.querySelector("#interactButton"),
  progress: document.querySelector("#progressFill"),
  sound: document.querySelector("#soundButton"),
};

const waterUniforms = {
  time: { value: 0 },
  colorA: { value: new THREE.Color(0x081725) },
  colorB: { value: new THREE.Color(0x1d5265) },
};

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 90, 90, 90),
  new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 p = position;
        float wave = sin(p.x * 0.45 + time * 1.5) * 0.12 + cos(p.y * 0.38 + time) * 0.1;
        p.z += wave;
        vWave = wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 colorA;
      uniform vec3 colorB;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        float shimmer = smoothstep(0.35, 1.0, vUv.y) + vWave * 1.2;
        vec3 color = mix(colorA, colorB, shimmer);
        gl_FragColor = vec4(color, 0.92);
      }
    `,
    transparent: true,
  }),
);
water.rotation.x = -Math.PI / 2;
water.position.y = -0.05;
scene.add(water);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(58, 48, 32),
  new THREE.MeshBasicMaterial({ color: 0x07101d, side: THREE.BackSide }),
);
scene.add(sky);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(2.4, 48, 32),
  new THREE.MeshBasicMaterial({ color: 0xd9f3ff }),
);
moon.position.set(-9, 12, -18);
scene.add(moon);

const moonLight = new THREE.PointLight(0xd9f3ff, 8, 65);
moonLight.position.copy(moon.position);
scene.add(moonLight);

scene.add(new THREE.HemisphereLight(0xa7dfff, 0x182718, 1.2));
const roseLight = new THREE.PointLight(0xff8bdd, 4.6, 34);
roseLight.position.set(6, 5.5, -4);
scene.add(roseLight);

function mat(color, roughness = 0.7, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

const canoe = new THREE.Group();
scene.add(canoe);

const boat = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.55, 1.18), mat(0x6a3f23, 0.62));
boat.position.y = 0.42;
boat.scale.z = 0.8;
boat.castShadow = true;
canoe.add(boat);

const bow = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.2, 4), mat(0x6a3f23, 0.62));
bow.rotation.z = Math.PI / 2;
bow.position.set(2.75, 0.42, 0);
canoe.add(bow);

const stern = bow.clone();
stern.rotation.z = -Math.PI / 2;
stern.position.x = -2.75;
canoe.add(stern);

const paddle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.6, 12), mat(0xdec093, 0.52));
paddle.rotation.set(0.8, 0.15, -0.72);
paddle.position.set(-1.6, 0.82, 0.82);
canoe.add(paddle);

const people = [];
[-1.45, -0.45, 0.55, 1.45].forEach((x, i) => {
  const person = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.5, 6, 12), mat([0xb7c7cf, 0x9c7d62, 0xe9e4d6, 0xcaa87d][i], 0.74));
  body.position.y = 0.88;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), mat([0xe3c2a0, 0xb38361, 0xd8b38d, 0x8f6247][i], 0.7));
  head.position.y = 1.28;
  person.add(body, head);
  person.position.x = x;
  people.push(person);
  canoe.add(person);
});

const tree = new THREE.Group();
scene.add(tree);

const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.78, 5.3, 18), mat(0x513429, 0.9));
trunk.position.set(0, 2.6, -10);
trunk.castShadow = true;
tree.add(trunk);

const crown = new THREE.Group();
for (let i = 0; i < 24; i += 1) {
  const blossom = new THREE.Mesh(
    new THREE.SphereGeometry(0.72 + Math.random() * 0.45, 18, 12),
    new THREE.MeshStandardMaterial({
      color: i % 3 === 0 ? 0xff8bdd : 0xffb8ea,
      roughness: 0.5,
      emissive: 0x5b123d,
      emissiveIntensity: 0.22,
    }),
  );
  const angle = i * 0.82;
  const radius = 1.2 + (i % 7) * 0.45;
  blossom.position.set(Math.cos(angle) * radius, 4.6 + Math.sin(i) * 1.1, -10 + Math.sin(angle) * 1.1);
  blossom.castShadow = true;
  crown.add(blossom);
}
tree.add(crown);

const branches = [];
for (let i = 0; i < 12; i += 1) {
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 3.2, 8), mat(0x513429, 0.82));
  branch.position.set(Math.cos(i) * 0.75, 4.1 + Math.sin(i * 2) * 0.45, -10 + Math.sin(i) * 0.5);
  branch.rotation.z = i * 0.4;
  branch.rotation.x = 1.1;
  branches.push(branch);
  tree.add(branch);
}

const island = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.4, 0.55, 42), mat(0x24482f, 0.8));
island.position.set(0, 0.08, -10);
tree.add(island);

const fairies = [];
for (let i = 0; i < 12; i += 1) {
  const fairy = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 8),
    new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff8bdd : 0xd9f3ff }),
  );
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xf4e8ff, transparent: true, opacity: 0.62, side: THREE.DoubleSide });
  const wingA = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), wingMat);
  const wingB = wingA.clone();
  wingA.position.set(-0.12, 0.04, 0);
  wingB.position.set(0.12, 0.04, 0);
  fairy.add(body, wingA, wingB, new THREE.PointLight(i % 2 ? 0xff8bdd : 0xd9f3ff, 0.8, 5));
  fairy.userData.seed = i * 0.73;
  fairies.push(fairy);
  scene.add(fairy);
}

const portals = [];
for (let i = 0; i < 4; i += 1) {
  const portal = new THREE.Mesh(
    new THREE.TorusGeometry(1.2 + i * 0.12, 0.035, 12, 80),
    new THREE.MeshBasicMaterial({ color: [0x58ffe2, 0xff8bdd, 0xd9f3ff, 0x9ef28a][i], transparent: true, opacity: 0.58 }),
  );
  portal.position.set(-6 + i * 4, 2.2 + i * 0.25, -3 - i * 3.2);
  portal.rotation.y = Math.PI / 2;
  portal.visible = false;
  portals.push(portal);
  scene.add(portal);
}

const shoreTexture = loader.load("./assets/shore-grass-home.jpg");
shoreTexture.colorSpace = THREE.SRGBColorSpace;
const shore = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 8),
  new THREE.MeshBasicMaterial({ map: shoreTexture, transparent: true, opacity: 0.78 }),
);
shore.position.set(0, 3.6, 8.5);
shore.rotation.y = Math.PI;
scene.add(shore);

function setScene(index) {
  state.index = THREE.MathUtils.clamp(index, 0, scenes.length - 1);
  const page = scenes[state.index];
  ui.image.src = page.image;
  ui.kicker.textContent = `Scene ${state.index + 1}`;
  ui.title.textContent = page.title;
  ui.text.textContent = page.text;
  ui.interact.textContent = page.action;
  ui.previous.disabled = state.index === 0;
  ui.next.disabled = false;
  ui.progress.style.width = `${((state.index + 1) / scenes.length) * 100}%`;
  roseLight.color.setHex(page.mood);
  waterUniforms.colorB.value.setHex(page.mood);
  buildChoices(page);
  portals.forEach((portal, i) => {
    portal.visible = state.index >= 1 && state.index <= 3 && i <= state.index;
  });
}

function buildChoices(page) {
  ui.choices.innerHTML = "";
  if (!page.question) return;
  page.question.answers.forEach((answer, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", () => {
      state.questionAnswered = true;
      [...ui.choices.children].forEach((child, childIndex) => {
        child.classList.toggle("is-correct", childIndex === page.question.correct);
        child.classList.toggle("is-soft", childIndex !== page.question.correct);
      });
      ui.text.textContent = i === page.question.correct
        ? page.question.response
        : "The fairy smiles gently. Try again: the answer is something kind that becomes stronger when shared.";
    });
    ui.choices.appendChild(button);
  });
}

function interact() {
  state.pulse = 1;
  state.moving = 1;
  if (scenes[state.index].question && !state.questionAnswered) {
    ui.text.textContent = "Choose an answer below to help the travelers understand the fairy tree.";
    return;
  }
  if (state.index < scenes.length - 1) setTimeout(() => setScene(state.index + 1), 520);
}

function ensureAudio() {
  if (state.audio) return state.audio;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const gain = ctx.createGain();
  gain.gain.value = 0.035;
  gain.connect(ctx.destination);
  const oscillators = [196, 247, 294].map((freq, i) => {
    const osc = ctx.createOscillator();
    const tone = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    tone.gain.value = 0.35 / (i + 1);
    osc.connect(tone);
    tone.connect(gain);
    osc.start();
    return osc;
  });
  state.audio = { ctx, gain, oscillators };
  return state.audio;
}

function toggleMusic() {
  const audio = ensureAudio();
  state.music = !state.music;
  ui.sound.classList.toggle("is-on", state.music);
  audio.gain.gain.setTargetAtTime(state.music ? 0.045 : 0.0001, audio.ctx.currentTime, 0.08);
}

ui.previous.addEventListener("click", () => setScene(state.index - 1));
ui.next.addEventListener("click", () => setScene(state.index + 1));
ui.interact.addEventListener("click", interact);
ui.sound.addEventListener("click", toggleMusic);

function resize() {
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function animate() {
  const t = clock.getElapsedTime();
  const delta = clock.getDelta();
  waterUniforms.time.value = t;

  const sceneProgress = state.index / Math.max(1, scenes.length - 1);
  canoe.position.set(
    Math.sin(t * 0.7) * 0.18,
    0.1 + Math.sin(t * 1.4) * 0.08,
    THREE.MathUtils.lerp(6.5, -7.2, sceneProgress),
  );
  canoe.rotation.y = Math.sin(t * 0.8) * 0.05;
  canoe.rotation.z = Math.sin(t * 1.2) * 0.018;
  paddle.rotation.z = -0.72 + Math.sin(t * 2.4) * (state.moving ? 0.42 : 0.12);
  people.forEach((person, i) => {
    person.rotation.z = Math.sin(t * 1.8 + i) * 0.03;
  });

  state.moving = Math.max(0, state.moving - delta * 0.5);
  state.pulse = Math.max(0, state.pulse - delta * 0.8);

  tree.scale.setScalar(1 + state.pulse * 0.035 + Math.sin(t * 1.3) * 0.006);
  crown.rotation.y = Math.sin(t * 0.25) * 0.08;
  roseLight.intensity = 4.2 + Math.sin(t * 2.6) * 0.6 + state.pulse * 3;
  moon.position.y = 12 + Math.sin(t * 0.35) * 0.25;
  moonLight.position.copy(moon.position);

  fairies.forEach((fairy, i) => {
    const seed = fairy.userData.seed;
    const radius = 3.4 + (i % 4) * 0.55;
    fairy.position.set(
      Math.cos(t * 0.75 + seed) * radius,
      2.6 + Math.sin(t * 1.7 + seed) * 1.15,
      -9.8 + Math.sin(t * 0.75 + seed) * 1.4,
    );
    fairy.rotation.y = t * 1.5 + seed;
    fairy.scale.setScalar(1 + Math.sin(t * 8 + seed) * 0.08);
  });

  portals.forEach((portal, i) => {
    portal.rotation.z = t * (0.55 + i * 0.18);
    portal.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.06);
  });

  camera.position.z = THREE.MathUtils.lerp(18, 15, sceneProgress);
  camera.position.y = THREE.MathUtils.lerp(8.2, 7.2, sceneProgress);
  camera.lookAt(0, 1.5, -4.2);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
setScene(0);
resize();
animate();
