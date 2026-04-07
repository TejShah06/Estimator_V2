import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Zap,
  Calculator,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Home,
  Square,
  Ruler,
  PaintBucket,
  DoorOpen,
  Frame,
  Lightbulb,
  Droplet,
  TrendingUp,
  Eye,
  Settings,
  Type // ✅ Add Type icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import MainLayout from '@/layout/MainLayout';

const AIEstimation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [useCustomRates, setUseCustomRates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // ✅ Add project name state
  const [projectName, setProjectName] = useState('');

  // Custom rates state
  const [customRates, setCustomRates] = useState({
    flooring_cost_per_sqft: 85.0,
    wall_paint_cost_per_sqft: 18.0,
    ceiling_paint_cost_per_sqft: 14.0,
    door_unit_cost: 8500.0,
    window_unit_cost: 6000.0,
    wall_height_ft: 10.0,
    electrical_per_room: 5500.0,
    plumbing_per_wet_room: 25000.0,
  });

  // Rate configuration
  const rateFields = [
    {
      key: 'flooring_cost_per_sqft',
      label: 'Flooring Cost (per sqft)',
      icon: Square,
      prefix: '₹',
      description: 'Cost per square foot for flooring materials and installation'
    },
    {
      key: 'wall_paint_cost_per_sqft',
      label: 'Wall Paint Cost (per sqft)',
      icon: PaintBucket,
      prefix: '₹',
      description: 'Cost per square foot for wall painting'
    },
    {
      key: 'ceiling_paint_cost_per_sqft',
      label: 'Ceiling Paint Cost (per sqft)',
      icon: PaintBucket,
      prefix: '₹',
      description: 'Cost per square foot for ceiling painting'
    },
    {
      key: 'door_unit_cost',
      label: 'Door Unit Cost',
      icon: DoorOpen,
      prefix: '₹',
      description: 'Cost per door including frame and installation'
    },
    {
      key: 'window_unit_cost',
      label: 'Window Unit Cost',
      icon: Frame,
      prefix: '₹',
      description: 'Cost per window including frame and installation'
    },
    {
      key: 'wall_height_ft',
      label: 'Wall Height (feet)',
      icon: Ruler,
      suffix: 'ft',
      description: 'Average wall height for calculations'
    },
    {
      key: 'electrical_per_room',
      label: 'Electrical Work (per room)',
      icon: Lightbulb,
      prefix: '₹',
      description: 'Average electrical work cost per room'
    },
    {
      key: 'plumbing_per_wet_room',
      label: 'Plumbing (per wet room)',
      icon: Droplet,
      prefix: '₹',
      description: 'Plumbing cost for bathrooms and kitchens'
    },
  ];

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/bmp', 'image/tiff', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload an image file.');
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        setError('File too large. Maximum size is 20MB.');
        return;
      }

      setFile(selectedFile);
      setError(null);

      // ✅ Auto-populate project name from filename if empty
      if (!projectName && selectedFile.name) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setProjectName(nameWithoutExt);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  // Proceed to rates selection
  const proceedToRates = () => {
    if (!file) {
      setError('Please select a floor plan image');
      return;
    }
    setStep(2);
  };

  // Handle rate input change
  const handleRateChange = (key, value) => {
    setCustomRates(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  // ✅ Updated Start Analysis function
  const startAnalysis = async () => {
    setStep(3);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      let response;
      const params = new URLSearchParams();
      
      // ✅ Add project name to params
      if (projectName.trim()) {
        params.append('project_name', projectName.trim());
      }

      if (useCustomRates) {
        // Add custom rates to params
        Object.entries(customRates).forEach(([key, value]) => {
          params.append(key, value);
        });

        response = await axios.post(
          `http://localhost:8000/floorplan/analyze-custom?${params.toString()}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:8000/floorplan/analyze?${params.toString()}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      // Store result and redirect to AnalysisReport
      const projectId = response.data.project_id || response.data.id;
      
      if (projectId) {
        navigate(`/report/${projectId}`, {
          state: { analysisData: response.data }
        });
      } else {
        setAnalysisResult(response.data);
        setStep(4);
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setUseCustomRates(false);
    setAnalysisResult(null);
    setError(null);
    setProjectName(''); // ✅ Reset project name
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pt-20 pb-12">
      <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/20 mb-4">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">AI-Powered Analysis</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Floor Plan Estimation
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload your floor plan and get instant AI-powered cost estimates with detailed breakdowns
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Upload', icon: Upload },
              { num: 2, label: 'Configure', icon: Settings },
              { num: 3, label: 'Analyze', icon: Zap },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      step >= s.num
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-slate-800 text-gray-500'
                    }`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-gray-400 mt-2">{s.label}</span>
                </div>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step > s.num ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-semibold">Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Upload */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                {!preview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-cyan-500/30 rounded-xl p-12 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    <Upload className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Upload Floor Plan
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Drag and drop your floor plan image here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported: JPG, PNG, BMP, TIFF, WEBP (Max 20MB)
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt="Floor plan preview"
                        className="w-full h-auto max-h-96 object-contain bg-slate-800"
                      />
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                          setProjectName(''); // ✅ Clear project name when removing file
                        }}
                        className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-sm text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>

                    <Button
                      onClick={proceedToRates}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12"
                    >
                      Continue to Configuration
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Rates Configuration */}
          {step === 2 && (
            <motion.div
              key="rates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                
                {/* ✅ Project Name Field - NEW */}
                <div className="mb-8">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                    <Type className="w-4 h-4 text-cyan-400" />
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., My Dream Home, Office Building A"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Give your project a memorable name (defaults to filename if empty)
                  </p>
                </div>

                {/* Custom Rates Toggle */}
                <div className="mb-8 p-6 bg-slate-800/50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Use Custom Rates
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Enable this to specify your own cost rates. Otherwise, default rates will be used.
                      </p>
                    </div>
                    <button
                      onClick={() => setUseCustomRates(!useCustomRates)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        useCustomRates ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-700'
                      }`}
                    >
                      <motion.div
                        className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
                        animate={{ x: useCustomRates ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>

                {/* Custom Rates Form */}
                <AnimatePresence>
                  {useCustomRates && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        {rateFields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                              <field.icon className="w-4 h-4 text-cyan-400" />
                              {field.label}
                            </label>
                            <div className="relative">
                              {field.prefix && (
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                  {field.prefix}
                                </span>
                              )}
                              <input
                                type="number"
                                step="0.01"
                                value={customRates[field.key]}
                                onChange={(e) => handleRateChange(field.key, e.target.value)}
                                className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                                  field.prefix ? 'pl-8' : ''
                                } ${field.suffix ? 'pr-12' : ''}`}
                              />
                              {field.suffix && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                  {field.suffix}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{field.description}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-slate-700 text-gray-300 hover:bg-slate-800"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={startAnalysis}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Analysis
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 3 && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="inline-block mb-6"
                >
                  <Loader2 className="w-16 h-16 text-cyan-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Analyzing Floor Plan
                </h3>
                {projectName && (
                  <p className="text-cyan-400 font-medium mb-2">
                    Project: {projectName}
                  </p>
                )}
                <p className="text-gray-400 mb-6">
                  Our AI is processing your floor plan. This may take a few moments...
                </p>
                <div className="space-y-3">
                  {[
                    'Detecting rooms and spaces',
                    'Measuring dimensions',
                    'Identifying doors and windows',
                    'Calculating material requirements',
                    'Generating cost estimates',
                  ].map((text, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.3 }}
                      className="flex items-center gap-3 text-gray-400"
                    >
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      {text}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      </MainLayout>
    </div>
  );
};

export default AIEstimation;  