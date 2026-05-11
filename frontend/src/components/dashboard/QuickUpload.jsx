import { useState, useCallback }    from "react"
import { useNavigate }              from "react-router-dom"
import { useDropzone }              from "react-dropzone"
import { motion, AnimatePresence }  from "framer-motion"
import {
  Upload, FileImage, X, CheckCircle2,
  AlertCircle, Loader2, Zap, Eye,
} from "lucide-react"
import api from "../../services/api"

const QuickUpload = () => {
  const navigate = useNavigate()

  const [file,      setFile]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [error,     setError]     = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [result,    setResult]    = useState(null)

  // ── Dropzone ────────────────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null)
    setResult(null)

    if (rejectedFiles.length > 0) {
      setError("Invalid file. Please upload JPG, PNG, or BMP under 20MB")
      return
    }

    const selectedFile = acceptedFiles[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png":  [".png"],
      "image/bmp":  [".bmp"],
      "image/tiff": [".tiff"],
      "image/webp": [".webp"],
    },
    maxSize:  20 * 1024 * 1024,
    multiple: false,
    disabled: analyzing,
  })

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    setResult(null)
    setProgress(0)
  }

  // ── Analyze ─────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return
    try {
      setAnalyzing(true)
      setProgress(0)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("project_name", `Quick Analysis - ${new Date().toLocaleDateString()}`)

      const response = await api.post("/floorplan/analyze", formData)
      setProgress(100)
      setResult(response.data)

      if (!response.data || !response.data.id) {
        setError("Analysis succeeded but failed to save project ID.")
        setAnalyzing(false)
        return
      }

      setTimeout(() => {
        navigate(`/report/ai-${response.data.id}`)
      }, 1500)

    } catch (err) {
      console.error("Analysis failed:", err)
      setError(err.response?.data?.detail || "Analysis failed.")
      setProgress(0)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleViewReport = () => {
    if (result?.id) navigate(`/report/ai-${result.id}`)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024)        return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl
                 border border-white/10 rounded-2xl p-6 h-full flex flex-col shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20
                        border border-amber-400/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Quick Analyze</h2>
          <p className="text-xs text-gray-500">Upload a floor plan to get started</p>
        </div>
      </div>

      {/* Drop Zone / Preview */}
      <AnimatePresence mode="wait">

        {/* ── Drop Zone ── */}
        {!file && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col
                        items-center justify-center p-6 cursor-pointer transition-all
                        min-h-[200px] ${
              isDragActive
                ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                : "border-white/10 hover:border-cyan-400/50 hover:bg-cyan-500/5"
            }`}
          >
            <input {...getInputProps()} />

            <motion.div
              animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              transition={{ type: "spring" }}
            >
              <div className={`p-4 rounded-2xl mb-3 ${
                isDragActive
                  ? "bg-cyan-500/20 border border-cyan-400/30"
                  : "bg-white/5 border border-white/10"
              }`}>
                <Upload className={`w-8 h-8 ${
                  isDragActive ? "text-cyan-400" : "text-gray-500"
                }`} />
              </div>
            </motion.div>

            <p className="text-sm font-medium text-gray-300 text-center">
              {isDragActive ? "Drop your floor plan here!" : "Drag & drop floor plan"}
            </p>
            <p className="text-xs text-gray-500 mt-1 text-center">or click to browse</p>

            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              {["JPG", "PNG", "BMP", "TIFF"].map((fmt) => (
                <span
                  key={fmt}
                  className="text-[10px] bg-white/5 border border-white/10
                             text-gray-400 px-2 py-0.5 rounded-full"
                >
                  {fmt}
                </span>
              ))}
              <span className="text-[10px] text-gray-600">Max 20MB</span>
            </div>
          </motion.div>
        )}

        {/* ── File Preview ── */}
        {file && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col"
          >
            {/* Image preview */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 mb-4">
              {preview && (
                <img
                  src={preview}
                  alt="Floor plan preview"
                  className="w-full h-40 object-contain bg-slate-950/50"
                />
              )}

              {/* Remove button */}
              {!analyzing && !result && (
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 backdrop-blur
                             rounded-full border border-white/10 hover:bg-red-500/20
                             hover:border-red-400/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                </button>
              )}

              {/* Analyzing overlay */}
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm
                             flex items-center justify-center"
                >
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                    <p className="text-white text-sm mt-2 font-medium">Analyzing...</p>
                  </div>
                </motion.div>
              )}

              {/* Success overlay */}
              {result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-green-500/10 backdrop-blur-sm
                             flex items-center justify-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                </motion.div>
              )}
            </div>

            {/* File info */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <FileImage className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 font-medium truncate flex-1">
                {file.name}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatSize(file.size)}
              </span>
            </div>

            {/* Progress bar */}
            {analyzing && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Processing</span>
                  <span className="text-xs font-semibold text-cyan-400">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${
                      progress >= 100
                        ? "bg-green-400"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Success message */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="flex items-start gap-2 p-3 bg-green-500/10 border
                                border-green-400/20 rounded-xl mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-300">
                      Analysis Complete!
                    </p>
                    <p className="text-xs text-green-400/70 mt-0.5">
                      {result.rooms_count} rooms •{" "}
                      {result.doors_count} doors •{" "}
                      {result.windows_count} windows
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewReport}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500
                             hover:from-green-600 hover:to-emerald-600 text-white font-semibold
                             rounded-xl transition-all flex items-center justify-center gap-2
                             shadow-lg shadow-green-500/20"
                >
                  <Eye className="w-4 h-4" />
                  View Full Report
                </motion.button>
              </motion.div>
            )}

            {/* Analyze button */}
            {!analyzing && !result && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                           hover:from-cyan-600 hover:to-blue-600 text-white font-semibold
                           rounded-xl transition-all flex items-center justify-center gap-2
                           shadow-lg shadow-cyan-500/20"
              >
                <Zap className="w-4 h-4" />
                Analyze Floor Plan
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border
                       border-red-400/20 rounded-xl mt-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="flex-shrink-0">
              <X className="w-3 h-3 text-red-400 hover:text-red-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default QuickUpload