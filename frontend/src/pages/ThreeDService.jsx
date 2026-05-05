import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MainLayout from "@/layout/MainLayout";
import {
  Upload,
  Box,
  Zap,
  CheckCircle,
  AlertCircle,
  FileImage,
  ArrowRight,
  Loader2,
  X,
  Image,
  Cpu,
  Layers,
  Sparkles
} from "lucide-react";

const API_BASE = "http://localhost:8000";

const PROCESSING_STEPS = [
  { icon: FileImage, label: "Uploading floor plan...",       duration: 1000 },
  { icon: Cpu,       label: "AI analyzing rooms...",         duration: 2000 },
  { icon: Layers,    label: "Detecting walls & openings...", duration: 2000 },
  { icon: Box,       label: "Generating 3D geometry...",     duration: 3000 },
  { icon: Sparkles,  label: "Rendering final model...",      duration: 2000 },
];

export default function ThreeDService() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);

  const [dragOver,       setDragOver]       = useState(false);
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [preview,        setPreview]        = useState(null);
  const [isProcessing,   setIsProcessing]   = useState(false);
  const [currentStep,    setCurrentStep]    = useState(0);
  const [error,          setError]          = useState(null);
  const [success,        setSuccess]        = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────

  const handleFile = (file) => {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/bmp", "image/webp", "image/tiff"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, BMP, WEBP, TIFF files are supported.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be less than 20 MB.");
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const animateSteps = () =>
    new Promise((resolve) => {
      let step = 0;
      const next = () => {
        if (step >= PROCESSING_STEPS.length) { resolve(); return; }
        setCurrentStep(step);
        setTimeout(() => { step++; next(); }, PROCESSING_STEPS[step].duration);
      };
      next();
    });

  const handleGenerate = async () => {
    if (!selectedFile) { 
      setError("Please select a floor plan image."); 
      return; 
    }

    const token = localStorage.getItem("token");
    if (!token) { 
      navigate("/login"); 
      return; 
    }

    setError(null);
    setIsProcessing(true);
    setCurrentStep(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Run animation in parallel with API call
      const [response] = await Promise.all([
        fetch(`${API_BASE}/floorplan-3d/upload-and-generate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }),
        animateSteps(),
      ]);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${response.status}`);
      }

      //   NEW: Get GLB binary blob directly
      const glb_blob = await response.blob();
      
      //   NEW: Get metadata from response headers
      const projectId = response.headers.get("X-Project-ID");
      const genTime = response.headers.get("X-Generation-Time");
      const fileSize = response.headers.get("X-File-Size");
      const wallCount = response.headers.get("X-Wall-Count");
      const doorCount = response.headers.get("X-Door-Count");
      const windowCount = response.headers.get("X-Window-Count");

      //   NEW: Create blob URL for Three.js
      const glb_url = URL.createObjectURL(glb_blob);

      console.log(`GLB received: ${fileSize} bytes`);

      setSuccess(true);

      // Navigate to viewer with GLB data
      setTimeout(() => {
        navigate(`/3d-viewer/${projectId}`, {
          state: {
            glb_url,        // blob:http://localhost:3000/...
            glb_blob,       // binary data for download
            metadata: {
              project_id: projectId,
              generation_time: parseFloat(genTime),
              file_size: parseInt(fileSize),
              wall_count: parseInt(wallCount),
              door_count: parseInt(doorCount),
              window_count: parseInt(windowCount),
            },
          },
        });
      }, 1500);

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-20 px-4 sm:px-6 lg:px-8">

        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
        <div className="fixed top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto py-12">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <Box className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300">3D Model Generation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Generate 3D Model
              </span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Upload your floor plan and our AI will instantly generate
              a professional 3D model you can explore and download.
            </p>
          </motion.div>

          {/* ── How it works strip ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mb-10"
          >
            {[
              { icon: Upload,    label: "Upload",   desc: "Drop your floor plan"  },
              { icon: Cpu,       label: "AI Analyze", desc: "Rooms & walls detected" },
              { icon: Box,       label: "3D Model",  desc: "View & download GLB"   },
            ].map((item, i) => (
              <Card
                key={i}
                className="bg-slate-800/40 border-white/10 text-center"
              >
                <CardContent className="p-4">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* ── Main Upload Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
              <CardContent className="p-8">

                <AnimatePresence mode="wait">

                  {/* ── Processing overlay ── */}
                  {isProcessing && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      {success ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-400" />
                          </div>
                          <p className="text-xl font-semibold text-green-400">
                            3D Model Ready!
                          </p>
                          <p className="text-gray-400">Redirecting to viewer...</p>
                        </motion.div>
                      ) : (
                        <>
                          {/* Animated spinner */}
                          <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
                            <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Box className="w-8 h-8 text-cyan-400" />
                            </div>
                          </div>

                          {/* Steps */}
                          <div className="space-y-3 max-w-xs mx-auto">
                            {PROCESSING_STEPS.map((step, i) => {
                              const Icon = step.icon;
                              const isDone    = i < currentStep;
                              const isCurrent = i === currentStep;
                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                                    isCurrent
                                      ? "bg-cyan-500/10 border border-cyan-500/30"
                                      : isDone
                                      ? "opacity-50"
                                      : "opacity-30"
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                  ) : isCurrent ? (
                                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                                  ) : (
                                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  )}
                                  <span className={`text-sm ${isCurrent ? "text-cyan-300" : isDone ? "text-gray-400" : "text-gray-600"}`}>
                                    {step.label}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* ── Normal upload UI ── */}
                  {!isProcessing && (
                    <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                      {/* Error banner */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
                          >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                            <button
                              onClick={() => setError(null)}
                              className="ml-auto hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Drop zone */}
                      <div
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onClick={() => !selectedFile && fileRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                          dragOver
                            ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                            : selectedFile
                            ? "border-green-400/50 bg-green-500/5"
                            : "border-white/20 hover:border-cyan-400/50 hover:bg-cyan-500/5 cursor-pointer"
                        }`}
                        style={{ minHeight: "280px" }}
                      >
                        <AnimatePresence mode="wait">

                          {/* Preview */}
                          {selectedFile && preview ? (
                            <motion.div
                              key="preview"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="p-4"
                            >
                              <div className="relative">
                                <img
                                  src={preview}
                                  alt="Floor plan preview"
                                  className="w-full max-h-64 object-contain rounded-xl"
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                                >
                                  <X className="w-4 h-4 text-white" />
                                </button>
                              </div>

                              {/* File info */}
                              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                  <Image className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {selectedFile.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                              </div>
                            </motion.div>
                          ) : (
                            /* Empty state */
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex flex-col items-center justify-center h-full p-12 text-center"
                            >
                              <motion.div
                                animate={dragOver ? { scale: 1.2 } : { scale: 1 }}
                                className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center"
                              >
                                <Upload className="w-10 h-10 text-cyan-400" />
                              </motion.div>

                              <p className="text-xl font-semibold text-white mb-2">
                                {dragOver ? "Drop it here!" : "Drop your floor plan"}
                              </p>
                              <p className="text-gray-400 mb-4 text-sm">
                                or click to browse files
                              </p>
                              <div className="flex flex-wrap justify-center gap-2">
                                {["JPG", "PNG", "BMP", "WEBP", "TIFF"].map((ext) => (
                                  <span
                                    key={ext}
                                    className="px-2 py-0.5 text-xs rounded-full bg-white/5 border border-white/10 text-gray-400"
                                  >
                                    {ext}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-gray-600 mt-3">Max 20 MB</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFile(e.target.files[0])}
                        />
                      </div>

                      {/* Generate button */}
                      <motion.div className="mt-6">
                        <Button
                          onClick={handleGenerate}
                          disabled={!selectedFile}
                          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all"
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          Generate 3D Model
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>

                        {!selectedFile && (
                          <p className="text-center text-xs text-gray-500 mt-3">
                            Upload a floor plan to enable generation
                          </p>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-gray-600 mt-6"
          >
            Supports architectural floor plans, CAD exports, and scanned blueprints.
            Best results with high-resolution images.
          </motion.p>
        </div>
      </div>
    </MainLayout>
  );
}