import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MainLayout from "@/layout/MainLayout";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  ArrowLeft,
  Download,
  Box,
  Home,
  DoorOpen,
  Wind,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  CheckCircle,
  Layers,
  Clock,
  HardDrive,
  Cpu,
  RefreshCw
} from "lucide-react";

// ── small reusable info row ───────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color = "text-cyan-400" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Icon className={`w-4 h-4 ${color}`} />
        <span>{label}</span>
      </div>
      <span className="text-white text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

// ── skeleton loader ───────────────────────────────────────────────────────────
function PanelSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex justify-between items-center py-2">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-4 w-16 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ThreeDViewer() {
  const { project_id } = useParams();
  const navigate        = useNavigate();
  const location        = useLocation();
  const mountRef        = useRef(null);
  const rendererRef     = useRef(null);
  const sceneRef        = useRef(null);
  const cameraRef       = useRef(null);
  const controlsRef     = useRef(null);
  const animFrameRef    = useRef(null);

  //   Get GLB data from state
  const { glb_url, glb_blob, metadata } = location.state || {};

  // Data state
  const [modelReady,   setModelReady]   = useState(false);
  const [loadingModel, setLoadingModel] = useState(true);
  const [error,        setError]        = useState(null);
  const [downloadingGlb, setDownloadingGlb] = useState(false);

  //   Initialize Three.js on mount
  useEffect(() => {
    if (!glb_url || !mountRef.current) {
      setError("No model data found. Please upload again.");
      setLoadingModel(false);
      return;
    }

    const el       = mountRef.current;
    const w        = el.clientWidth;
    const h        = el.clientHeight;

    // Scene
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Camera
    const camera   = new THREE.PerspectiveCamera(60, w / h, 0.1, 5000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace  = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.05;
    controls.minDistance      = 1;
    controls.maxDistance      = 2000;
    controls.maxPolarAngle    = Math.PI / 2 + 0.2;
    controlsRef.current = controls;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x88ccff, 0.4);
    fill.position.set(-50, 30, -50);
    scene.add(fill);

    // Grid
    const grid = new THREE.GridHelper(200, 40, 0x1e293b, 0x1e293b);
    scene.add(grid);

    // Camera positioning
    const camDist = 20;
    camera.position.set(camDist, camDist * 0.8, camDist);
    camera.lookAt(0, 0, 0);
    controls.update();

    //   Load GLB from blob URL
    const loader = new GLTFLoader();

    loader.load(
      glb_url,  // blob:http://localhost:3000/...
      (gltf) => {
        const model = gltf.scene;

        // Enable shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
          }
        });

        // Center model
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        scene.add(model);
        controls.target.set(0, 0, 0);
        controls.update();

        setLoadingModel(false);
        setModelReady(true);
      },
      undefined,
      (err) => {
        console.error("GLB load error:", err);
        setError("Failed to load 3D model. Try refreshing.");
        setLoadingModel(false);
      }
    );

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      // Revoke blob URL on unmount
      if (glb_url) URL.revokeObjectURL(glb_url);
    };
  }, [glb_url]);

  // ── camera helpers ────────────────────────────────────────────────────────
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camDist = 20;
    cameraRef.current.position.set(camDist, camDist * 0.8, camDist);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const zoomIn  = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.multiplyScalar(0.85);
  };

  const zoomOut = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.multiplyScalar(1.18);
  };

  const topView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camDist = 30;
    cameraRef.current.position.set(0, camDist, 0);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // ── download GLB ─────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!glb_blob) return;

    try {
      setDownloadingGlb(true);

      const url  = URL.createObjectURL(glb_blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `floorplan_${project_id}.glb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Download failed. Please try again.");
    } finally {
      setDownloadingGlb(false);
    }
  };

  // ── format helpers ────────────────────────────────────────────────────────
  const fmtSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 text-white pt-16 flex flex-col">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">
                3D Viewer
              </span>
              {project_id && (
                <span className="text-xs text-gray-500">
                  · Project #{project_id}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {modelReady && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-green-400">Model Loaded</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── THREE.JS CANVAS (left / main) ── */}
          <div className="relative flex-1">

            {/* Canvas mount */}
            <div ref={mountRef} className="w-full h-full" />

            {/* Loading overlay */}
            <AnimatePresence>
              {loadingModel && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm"
                >
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
                    <div
                      className="absolute inset-3 rounded-full border-4 border-transparent border-t-purple-400 animate-spin"
                      style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Box className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-white font-medium mb-1">Loading 3D model...</p>
                  <p className="text-gray-500 text-sm">This may take a moment</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error overlay */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-white font-semibold mb-2">Something went wrong</p>
                  <p className="text-gray-400 text-sm text-center max-w-xs mb-6">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Camera controls (bottom-left of canvas) ── */}
            <AnimatePresence>
              {modelReady && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-6 left-6 flex flex-col gap-2"
                >
                  {[
                    { icon: RotateCcw,  label: "Reset view",  action: resetCamera },
                    { icon: ZoomIn,     label: "Zoom in",     action: zoomIn      },
                    { icon: ZoomOut,    label: "Zoom out",    action: zoomOut     },
                    { icon: Maximize2,  label: "Top view",    action: topView     },
                  ].map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      title={label}
                      onClick={action}
                      className="w-9 h-9 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls hint */}
            <AnimatePresence>
              {modelReady && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="absolute bottom-6 right-6 text-xs text-gray-600 text-right space-y-0.5"
                >
                  <p>🖱 Left drag — rotate</p>
                  <p>🖱 Right drag — pan</p>
                  <p>🖱 Scroll — zoom</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── SIDE PANEL (right) ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-80 flex-shrink-0 bg-slate-900/80 backdrop-blur border-l border-white/10 flex flex-col overflow-y-auto"
          >
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-white">Model Info</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Project #{project_id}
              </p>
            </div>

            {/* Panel body */}
            <div className="flex-1 px-5 py-4 space-y-5">

              {/* Metadata section */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Model Metadata
                </p>
                {metadata ? (
                  <div className="space-y-1">
                    <InfoRow
                      icon={HardDrive}
                      label="File Size"
                      value={fmtSize(metadata.file_size)}
                      color="text-cyan-400"
                    />
                    <InfoRow
                      icon={Clock}
                      label="Gen Time"
                      value={metadata.generation_time ? `${parseFloat(metadata.generation_time).toFixed(2)}s` : "—"}
                      color="text-purple-400"
                    />
                    <InfoRow
                      icon={Home}
                      label="Walls"
                      value={metadata.wall_count}
                      color="text-amber-400"
                    />
                    <InfoRow
                      icon={DoorOpen}
                      label="Doors"
                      value={metadata.door_count}
                      color="text-blue-400"
                    />
                    <InfoRow
                      icon={Wind}
                      label="Windows"
                      value={metadata.window_count}
                      color="text-green-400"
                    />
                  </div>
                ) : (
                  <PanelSkeleton />
                )}
              </div>

              {/* Status badge */}
              <AnimatePresence>
                {modelReady && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-xs font-medium text-green-400">
                        Model Ready
                      </p>
                      <p className="text-xs text-gray-500">
                        Rotate · Zoom · Pan
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Download button (pinned to bottom) ── */}
            <div className="px-5 py-4 border-t border-white/10 space-y-2">
              <Button
                onClick={handleDownload}
                disabled={!modelReady || downloadingGlb}
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-40 font-semibold transition-all"
              >
                {downloadingGlb ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download GLB
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-gray-600">
                GLB format · Works in Blender, Unity, etc.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}