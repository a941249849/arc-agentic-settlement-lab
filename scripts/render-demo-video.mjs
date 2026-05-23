import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const captureDir = process.env.CAPTURE_DIR || "/tmp/arc-escrow-final-capture";
const workDir = process.env.WORK_DIR || "/tmp/arc-escrow-demo-render";
const output = process.env.OUTPUT || join(root, "public/demo/arc-escrow-demo.mp4");

const scenes = [
  {
    image: "01-home.png",
    step: "01 PRODUCT ENTRY",
    title: "ArcEscrow",
    caption: "AI-gated supplier settlement workspace.",
    pointer: [445, 506],
    note: "Start from the commercial outcome, not a raw transfer.",
  },
  {
    image: "02-jobs.png",
    step: "02 SETTLEMENT PIPELINE",
    title: "Deal queue",
    caption: "Track funded, pending, and releasable commercial deals.",
    pointer: [278, 270],
    note: "Operators can see what is funded, pending, and releasable.",
  },
  {
    image: "03-form.png",
    step: "03 CREATE REQUEST",
    title: "Commercial terms",
    caption: "Define release rules, invoice context, and reviewer mode.",
    pointer: [661, 520],
    note: "The product wraps wallet signing in a business workflow.",
  },
  {
    image: "04-ai-agent.png",
    step: "04 AGENT REVIEW",
    title: "Evaluator gate",
    caption: "Evaluator approves release evidence before wallet execution.",
    pointer: [763, 328],
    note: "Agentic approval is visible instead of hidden behind automation.",
  },
  {
    image: "05-identity.png",
    step: "05 IDENTITY LAYER",
    title: "Wallet context",
    caption: "Separate wallet context from approval evidence.",
    pointer: [555, 342],
    note: "This is the bridge from wallet action to business accountability.",
  },
  {
    image: "06-challenge.png",
    step: "06 SUBMISSION PACK",
    title: "Evidence package",
    caption: "Receipts, tx evidence, and product feedback in one pack.",
    pointer: [958, 420],
    note: "Ready to review as a stablecoin commerce stack prototype.",
  },
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.stdio || "pipe",
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`${command} ${args.join(" ")} failed\n${output}`);
  }
  return result;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function imageDataUri(path) {
  const data = readFileSync(path).toString("base64");
  return `data:image/png;base64,${data}`;
}

function sceneSvg(scene, index) {
  const imagePath = join(captureDir, scene.image);
  if (!existsSync(imagePath)) {
    throw new Error(`Missing capture image: ${imagePath}`);
  }

  const image = imageDataUri(imagePath);
  const [px, py] = scene.pointer;
  const progress = scenes
    .map((_, i) => {
      const x = 42 + i * 38;
      const fill = i <= index ? "#0ea5e9" : "#cbd5e1";
      return `<circle cx="${x}" cy="44" r="8" fill="${fill}"/>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#020617" flood-opacity="0.22"/>
    </filter>
    <linearGradient id="avatar" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#16a34a"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="#f8fafc"/>
  <image href="${image}" x="0" y="0" width="1280" height="720" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1280" height="720" fill="#020617" opacity="0.05"/>
  <rect x="22" y="22" width="520" height="46" rx="23" fill="#ffffff" opacity="0.94" filter="url(#shadow)"/>
  ${progress}
  <text x="276" y="51" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">${escapeXml(scene.step)}</text>
  <g filter="url(#shadow)">
    <rect x="42" y="548" width="820" height="116" rx="24" fill="#020617" opacity="0.90"/>
    <rect x="42" y="548" width="6" height="116" rx="3" fill="#0ea5e9"/>
    <text x="72" y="587" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', Arial, sans-serif" font-size="26" font-weight="800" fill="#ffffff">${escapeXml(scene.title)}</text>
    <text x="72" y="622" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', Arial, sans-serif" font-size="20" fill="#dbeafe">${escapeXml(scene.caption)}</text>
    <text x="72" y="649" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', Arial, sans-serif" font-size="15" fill="#94a3b8">${escapeXml(scene.note)}</text>
  </g>
  <g>
    <circle cx="${px}" cy="${py}" r="28" fill="#0ea5e9" opacity="0.20"/>
    <circle cx="${px}" cy="${py}" r="15" fill="#0ea5e9" opacity="0.92"/>
    <circle cx="${px}" cy="${py}" r="5" fill="#ffffff"/>
  </g>
</svg>`;
}

function avatarSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#16a34a"/>
    </linearGradient>
  </defs>
  <rect width="220" height="220" fill="#0f172a"/>
  <circle cx="110" cy="88" r="62" fill="url(#g)"/>
  <text x="110" y="107" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', Arial, sans-serif" font-size="40" font-weight="800" fill="#ffffff">刘能</text>
  <circle cx="168" cy="38" r="11" fill="#22c55e"/>
  <text x="110" y="174" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="19" font-weight="800" fill="#ffffff">LiuNeng</text>
  <text x="110" y="197" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="13" fill="#94a3b8">guided demo</text>
</svg>`;
}

rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
mkdirSync(join(root, "public/demo"), { recursive: true });

const avatarSvgPath = join(workDir, "liuneng-avatar.svg");
const avatarQuicklookPath = `${avatarSvgPath}.png`;
const avatarPngPath = join(workDir, "liuneng-avatar.png");
writeFileSync(avatarSvgPath, avatarSvg());
run("qlmanage", ["-t", "-s", "220", "-o", workDir, avatarSvgPath]);
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  avatarQuicklookPath,
  "-vf",
  "crop=162:162:0:0",
  avatarPngPath,
]);

const sceneVideos = [];
for (const [index, scene] of scenes.entries()) {
  const id = String(index + 1).padStart(2, "0");
  const svgPath = join(workDir, `${id}-${basename(scene.image, ".png")}.svg`);
  const quicklookPng = `${svgPath}.png`;
  const pngPath = join(workDir, `${id}.png`);
  const videoPath = join(workDir, `${id}.mp4`);

  writeFileSync(svgPath, sceneSvg(scene, index));
  run("qlmanage", ["-t", "-s", "1280", "-o", workDir, svgPath]);
  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    quicklookPng,
    "-vf",
    "crop=1280:1204:0:0,scale=1280:720",
    pngPath,
  ]);
  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-loop",
    "1",
    "-i",
    pngPath,
    "-i",
    avatarPngPath,
    "-filter_complex",
    "[0:v]scale=1280:720,format=rgba[base];[1:v]scale=136:136[avatar];[base][avatar]overlay=W-w-32:H-h-32,fade=t=in:st=0:d=0.18,fade=t=out:st=5.10:d=0.35,format=yuv420p",
    "-frames:v",
    "165",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-movflags",
    "+faststart",
    videoPath,
  ]);
  sceneVideos.push(videoPath);
}

const listPath = join(workDir, "concat.txt");
writeFileSync(listPath, sceneVideos.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"));
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  listPath,
  "-c",
  "copy",
  output,
]);

const probe = run("ffprobe", [
  "-v",
  "error",
  "-show_entries",
  "format=duration,size",
  "-of",
  "default=noprint_wrappers=1",
  output,
]);

process.stdout.write(`Rendered ${output}\n${probe.stdout}`);
