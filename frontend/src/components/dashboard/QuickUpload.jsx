import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileImage,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Eye
} from "lucide-react"

//   CORRECTED PATH: ../../services/api
import api from "../../services/api"

const QuickUpload = () => {
  const navigate = useNavigate()
  
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

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

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/bmp": [".bmp"],
      "image/tiff": [".tiff"],
      "image/webp": [".webp"]
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false,
    disabled: analyzing
  })

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    setResult(null)
    setProgress(0)
  }

  //   Handle Analysis
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

    //   Add this safety check
    if (!response.data || !response.data.id) {
      console.error("Backend response missing ID:", response.data)
      setError("Analysis succeeded but failed to save project ID.")
      setAnalyzing(false)
      return
    }

    // Now we know ID exists
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

  //   Manual View Report
  const handleViewReport = () => {
    if (result?.id) {
      navigate(`/report/ai-${result.id}`)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl border border-gray-100 p-6 h-full
                 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Quick Analyze
        </h2>
      </div>

      {/* Drop Zone */}
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...getRootProps()}
            className={`flex-1 border-2 border-dashed rounded-xl
                       flex flex-col items-center justify-center p-6
                       cursor-pointer transition-all min-h-[200px]
                       ${isDragActive
                         ? "border-blue-500 bg-blue-50"
                         : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                       }`}
          >
            <input {...getInputProps()} />

            <motion.div
              animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              transition={{ type: "spring" }}
            >
              <div className={`p-4 rounded-full mb-3 ${
                isDragActive ? "bg-blue-100" : "bg-gray-100"
              }`}>
                <Upload className={`w-8 h-8 ${
                  isDragActive ? "text-blue-500" : "text-gray-400"
                }`} />
              </div>
            </motion.div>

            <p className="text-sm font-medium text-gray-700 text-center">
              {isDragActive
                ? "Drop your floor plan here!"
                : "Drag & drop floor plan"
              }
            </p>

            <p className="text-xs text-gray-400 mt-1 text-center">
              or click to browse
            </p>

            <div className="flex items-center gap-2 mt-3">
              {["JPG", "PNG", "BMP"].map((fmt) => (
                <span
                  key={fmt}
                  className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
                >
                  {fmt}
                </span>
              ))}
              <span className="text-xs text-gray-400">Max 20MB</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col"
          >
            {/* File Preview */}
            <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-4">
              {preview && (
                <img
                  src={preview}
                  alt="Floor plan preview"
                  className="w-full h-40 object-contain bg-gray-50"
                />
              )}

              {/* Remove button */}
              {!analyzing && !result && (
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full
                             shadow-md hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
                </button>
              )}

              {/* Analyzing overlay */}
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                    <p className="text-white text-sm mt-2 font-medium">
                      Analyzing...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Success overlay */}
              {result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
                >
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* File info */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <FileImage className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-700 font-medium truncate flex-1">
                {file.name}
              </span>
              <span className="text-xs text-gray-400">
                {formatSize(file.size)}
              </span>
            </div>

            {/* Progress bar */}
            {analyzing && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Processing</span>
                  <span className="text-xs font-medium text-blue-600">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${
                      progress >= 100 ? "bg-green-500" : "bg-blue-500"
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
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700">
                      Analysis Complete!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {result.rooms_count} rooms • {result.doors_count} doors • {result.windows_count} windows
                    </p>
                  </div>
                </div>

                {/* View Report Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewReport}
                  className="w-full py-3 bg-green-600 hover:bg-green-700
                             text-white font-medium rounded-xl
                             transition-colors flex items-center justify-center gap-2"
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
                className="w-full py-3 bg-blue-600 hover:bg-blue-700
                           text-white font-medium rounded-xl
                           transition-colors flex items-center justify-center gap-2"
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
            className="flex items-center gap-2 p-3 bg-red-50 rounded-lg mt-3"
          >
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="flex-shrink-0">
              <X className="w-3 h-3 text-red-400 hover:text-red-600" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default QuickUpload