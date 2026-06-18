# EdgeForm Pro: On-Device Biometric Fitness Coach

An interactive, client-side web application designed to track user posture, calculate repetitions, and provide real-time biomechanical feedback using computer vision—completely on-device.

This project was built to address the lack of private, high-fidelity real-time coaching applications by combining lightweight TensorFlow.js models directly inside a responsive single-page visual dashboard.

---

## 🚀 Key Features

* **On-Device Posture Tracking:** Leverages local WebGL / CPU processing via TensorFlow.js and Google's lightweight MoveNet model to detect bodily keypoints without sending video streams to any cloud servers.
* **Instant Audio Feedback (Text-to-Speech):** Utilizes the native browser `speechSynthesis` engine to vocalize real-time coaching tips, active posture warnings, and repetition counts dynamically.
* **Custom Synthesizer Audio Alerts:** Integrated Web Audio API logic designed with a clean custom audio synthesizer class (`WorkoutAudioSynth`) to generate clean, dynamic wave tones for countdowns and form check triggers safely without external static sound assets.
* **Biometric Setup & Targets:** Interactive multi-step onboarding system designed to calibrate target objectives, training tracks, and biometric profiles depending on user input.
* **Privacy by Design:** Zero server endpoints or analytical tracking cookies. Camera streams are computed frame-by-frame and immediately cleared out of memory.

---

## 🛠️ Tech Stack

This project was built using a modern, lightweight, type-safe stack:

* **Frontend Engine:** React 18 (Functional Components, Custom Hooks)
* **Build System & Dev Server:** Vite + TypeScript (leveraging swift CJS compilation scripts)
* **Styling & Fluid Layouts:** Tailwind CSS (configured with direct design-to-utility mappings)
* **Biometrics / Machine Learning:** 
  * `@tensorflow/tfjs` (core processing)
  * `@tensorflow-models/movenet` (on-device single-pose detection model)
* **Interactive Components & Motion:** `motion/react` (staggered UI triggers, fluid deck transitions)
* **Icons & UI Accents:** `lucide-react` (SVG icons)

---

## 📂 Project Architecture

A quick overview of the key directories and modules in this structure:

```tree
├── src/
│   ├── components/       # Reusable interactive components
│   ├── hooks/
│   │   └── useMoveNet.ts # Core hook initializing TensorFlow.js & MoveNet tracking
│   ├── lib/
│   │   └── audioSynth.ts # Web Audio API oscillator logic for custom alarms/pings
│   ├── views/            # Main layout structures (WorkoutView, SetupFlow, etc.)
│   ├── App.tsx           # Primary routing logic and master system state
│   ├── main.tsx          # Application mount entrypoint
│   └── index.css         # Global styles and typography definitions
├── package.json          # Core package dependencies and build commands
└── vite.config.ts        # Vite custom bundler settings
```

---

## ⚙️ How to Run Locally (VSCode Guidelines)

You can run this application entirely offline on your local machine with these simple steps:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine (Recommended: LTS v18 or newer).

### 2. Steps to Open and Execute:
1. Open **VSCode** and select **File > Open Folder...**. Select the root of this project folder.
2. Open the built-in VSCode Terminal (`Ctrl + `` or `Ctrl + Shift + ``).
3. Install the node packages:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. The terminal will generate a local link, typically `http://localhost:3000` or `http://localhost:5173`. Open this URL in Google Chrome, Safari, or Microsoft Edge.
6. **Note on Camera Access:** Browsers usually restrict camera permissions to secure origins. For local testing, running via `localhost` is fully secure and will automatically allow camera access when requested.
