import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import MainLayout from "@/layout/MainLayout";
import {
  Upload,
  Zap,
  Calculator,
  FileText,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Brain,
  DollarSign,
  BarChart3,
  Shield,
  Sparkles,
  ChevronDown,
  Star,
  Quote,  
  Crown,
  Check,
  X
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [openFaq, setOpenFaq] = useState(null);
  const [stats, setStats] = useState({
    projects: 0,
    accuracy: 0,
    saved: 0
  });

  // Check login status
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location]);

  // Animate stats on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        projects: prev.projects < 2453 ? prev.projects + 50 : 2453,
        accuracy: prev.accuracy < 95 ? prev.accuracy + 2 : 95,
        saved: prev.saved < 200 ? prev.saved + 5 : 200
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  const yHero = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  /* ────────────────────────────────────────────────────────────
     ACTIONS
  ──────────────────────────────────────────────────────────── */

  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    navigate("/dashboard");
  };

  const handleTryDemo = () => {
    const demoSection = document.getElementById("demo");
    demoSection?.scrollIntoView({ behavior: "smooth" });
  };

  /* ────────────────────────────────────────────────────────────
     DATA
  ──────────────────────────────────────────────────────────── */

  const features = [
    {
      icon: Brain,
      title: "AI Floor Plan Analysis",
      description: "Upload blueprints and get instant room detection, measurements, and cost estimates",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Calculator,
      title: "Manual Calculator",
      description: "Precise concrete calculations for M20, M25, M30 with custom wastage factors",
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: FileText,
      title: "Detailed Reports",
      description: "Export comprehensive PDF reports with material lists and cost breakdowns",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: TrendingUp,
      title: "Project Dashboard",
      description: "Track all estimates in one place with analytics and history",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: DollarSign,
      title: "Cost Breakdown",
      description: "Itemized pricing for flooring, painting, electrical, plumbing, and more",
      color: "from-rose-500 to-red-500"
    },
    {
      icon: Shield,
      title: "95% Accuracy",
      description: "Industry-leading precision powered by advanced AI models",
      color: "from-indigo-500 to-violet-500"
    }
  ];

  const steps = [
    {
      icon: Upload,
      title: "Upload Floor Plan",
      description: "Drag and drop your blueprint (JPG, PNG, BMP)",
      step: "01"
    },
    {
      icon: Zap,
      title: "AI Analysis",
      description: "Our AI detects rooms, doors, windows & dimensions",
      step: "02"
    },
    {
      icon: BarChart3,
      title: "Get Instant Estimate",
      description: "Receive detailed cost breakdown in seconds",
      step: "03"
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Civil Engineer",
      company: "BuildTech Solutions",
      quote: "Reduced our estimation time from 3 days to 10 seconds. Game changer!",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"
    },
    {
      name: "Priya Sharma",
      role: "Project Manager",
      company: "Metro Constructions",
      quote: "The accuracy is incredible. We've saved over ₹5L by avoiding material wastage.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
    },
    {
      name: "Amit Patel",
      role: "Contractor",
      company: "Smart Builders",
      quote: "Best investment for our business. The AI analysis is spot-on every time.",
      rating: 5,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Perfect for trying out",
      features: [
        { text: "5 AI analyses per month", included: true },
        { text: "Unlimited manual calculations", included: true },
        { text: "Basic reports", included: true },
        { text: "Email support", included: true },
        { text: "Advanced analytics", included: false },
        { text: "API access", included: false }
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Pro",
      price: "₹999",
      period: "/month",
      description: "For professionals",
      features: [
        { text: "Unlimited AI analyses", included: true },
        { text: "Unlimited manual calculations", included: true },
        { text: "Premium PDF reports", included: true },
        { text: "Priority support", included: true },
        { text: "Advanced analytics", included: true },
        { text: "API access", included: true }
      ],
      cta: "Start 14-Day Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large teams",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Custom integrations", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "On-premise deployment", included: true },
        { text: "Custom training", included: true },
        { text: "SLA guarantee", included: true }
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "How accurate is the AI analysis?",
      answer: "Our AI model has 95% accuracy rate, trained on thousands of construction blueprints. It detects rooms, doors, windows, and dimensions with industry-leading precision."
    },
    {
      question: "What file formats are supported?",
      answer: "We support JPG, PNG, BMP, TIFF, and WebP formats. Maximum file size is 20MB. For best results, use high-resolution scanned blueprints."
    },
    {
      question: "Can I edit the AI-generated estimates?",
      answer: "Yes! All estimates are fully customizable. You can adjust rates, add custom items, and modify quantities before exporting reports."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 14-day money-back guarantee on Pro plans. If you're not satisfied, contact support for a full refund."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-grade encryption (SSL/TLS) and never share your data with third parties. All uploads are processed securely and deleted after 30 days."
    }
  ];

  /* ────────────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────────────── */

  return (
  <MainLayout>
    <motion.div
      ref={ref}
      className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white min-h-screen overflow-x-hidden relative"
    >
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* ────────────────────────────────────────────────────────
          HERO SECTION
      ──────────────────────────────────────────────────────── */}
      <motion.section
        style={{ y: yHero, opacity: opacityHero }}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20"
      >
        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 sm:mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs sm:text-sm text-cyan-300">AI-Powered Estimation</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Construction
              </span>
              <br />
              <span className="text-white">Estimation</span>
              <br />
              <span className="text-white">in Seconds</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
              Upload floor plans and get instant AI-powered cost estimates. 
              No more manual calculations or spreadsheets.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 justify-center lg:justify-start">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/50 text-base sm:text-lg px-6 sm:px-8 h-11 sm:h-12"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Get Started Free
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleTryDemo}
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 text-base sm:text-lg px-6 sm:px-8 h-11 sm:h-12"
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Try Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                <span>14-day free trial</span>
              </div>
            </div>
          </motion.div>

          {/* Right Image/Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800"
                alt="Construction"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-white/10 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20"
              >
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-cyan-400">{stats.projects}+</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">Projects</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{stats.accuracy}%</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-purple-400">₹{stats.saved}Cr+</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">Saved</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 bg-cyan-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 sm:w-32 sm:h-32 bg-purple-500/20 rounded-full blur-2xl" />
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 hidden sm:block"
        >
          <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
        </motion.div>
      </motion.section>

      {/* ────────────────────────────────────────────────────────
          TRUST BAR
      ──────────────────────────────────────────────────────── */}
      <section className="relative py-8 sm:py-12 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cyan-400 mb-1 sm:mb-2">
                {stats.projects}+
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Projects Analyzed</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-400 mb-1 sm:mb-2">
                {stats.accuracy}%
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Accuracy Rate</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-400 mb-1 sm:mb-2">
                ₹{stats.saved}Cr+
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Cost Estimated</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-400 mb-1 sm:mb-2">
                10s
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Average Time</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          HOW IT WORKS
      ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Get accurate construction estimates in three simple steps
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 -z-0" />

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <Card className="relative z-10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 h-full">
                  <CardContent className="p-6 sm:p-8 text-center">
                    {/* Step Number */}
                    <div className="absolute -top-3 sm:-top-4 -right-3 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm sm:text-base shadow-lg">
                      {step.step}
                    </div>

                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center"
                    >
                      <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                    </motion.div>

                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          FEATURES GRID
      ──────────────────────────────────────────────────────── */}
      <section id="features" className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Everything you need for accurate construction estimation
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 transition-all duration-300 h-full group hover:shadow-2xl hover:shadow-cyan-500/20">
                  <CardContent className="p-5 sm:p-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-r ${feature.color} p-2.5 sm:p-3 mb-3 sm:mb-4 group-hover:shadow-lg transition-all`}
                    >
                      <feature.icon className="w-full h-full text-white" />
                    </motion.div>

                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          DASHBOARD PREVIEW
      ──────────────────────────────────────────────────────── */}
      <section id="dashboard" className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Manage Everything
                </span>
                <br />
                <span className="text-white">in One Place</span>
              </h2>

              <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                Track all your projects, view detailed analytics, and export professional reports from a single dashboard.
              </p>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0">
                {[
                  "Real-time project tracking",
                  "Detailed cost analytics",
                  "Comparison tools",
                  "Export to PDF/Excel"
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-sm sm:text-base text-gray-300"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="flex justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-base sm:text-lg px-6 sm:px-8 h-11 sm:h-12"
                >
                  View Dashboard
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative rounded-xl lg:rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800"
                  alt="Dashboard"
                  className="w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-400/30"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  <div>
                    <div className="text-[10px] sm:text-xs text-gray-400">This Month</div>
                    <div className="text-base sm:text-lg font-bold text-white">+45%</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          PRICING
      ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Simple Pricing
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400">
              Choose the plan that fits your needs
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="sm:col-span-1"
              >
                <Card className={`relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border h-full ${
                  plan.popular
                    ? "border-cyan-400 shadow-2xl shadow-cyan-500/20"
                    : "border-white/10"
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 sm:px-4 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">{plan.description}</p>

                    <div className="mb-4 sm:mb-6">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                        {plan.price}
                      </span>
                      <span className="text-sm sm:text-base text-gray-400">{plan.period}</span>
                    </div>

                    <Button
                      className={`w-full mb-4 sm:mb-6 h-10 sm:h-11 text-sm sm:text-base ${
                        plan.popular
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          : "bg-slate-700 hover:bg-slate-600"
                      }`}
                      onClick={handleGetStarted}
                    >
                      {plan.cta}
                    </Button>

                    <ul className="space-y-2.5 sm:space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 sm:gap-3">
                          {feature.included ? (
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={`text-xs sm:text-sm ${feature.included ? "text-gray-300" : "text-gray-600"}`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          TESTIMONIALS
      ──────────────────────────────────────────────────────── */}
      <section id="testimonials" className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                What Our Users Say
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400">
              Join thousands of satisfied professionals
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 transition-all h-full">
                  <CardContent className="p-5 sm:p-6">
                    <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400/30 mb-3 sm:mb-4" />

                    <div className="flex gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                      />
                      <div>
                        <div className="text-sm sm:text-base font-semibold text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400">
                          {testimonial.role}
                        </div>
                        <div className="text-[10px] sm:text-xs text-cyan-400">
                          {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          FAQ
      ──────────────────────────────────────────────────────── */}
      <section id="faq" className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Frequently Asked Questions
              </span>
            </h2>
          </motion.div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 transition-all overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between gap-3 sm:gap-4 hover:bg-white/5 transition-colors"
                    >
                      <span className="font-semibold text-white text-sm sm:text-base lg:text-lg pr-2">
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: openFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-xs sm:text-sm lg:text-base text-gray-400 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          FINAL CTA
      ──────────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Ready to Get Started?
              </span>
            </h2>

            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Join thousands of professionals using AI to streamline construction estimation
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-base sm:text-lg px-8 sm:px-10 h-12 sm:h-14 shadow-lg shadow-cyan-500/50"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Start Free Trial
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 text-base sm:text-lg px-8 sm:px-10 h-12 sm:h-14"
              >
                Schedule Demo
              </Button>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  </MainLayout>
);
}