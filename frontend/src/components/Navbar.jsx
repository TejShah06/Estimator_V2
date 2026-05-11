import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  ChevronDown,
  Menu,
  X,
  Zap,
  Calculator,
  Info,
  Box,
 
  Check,
  ArrowRight,
} from "lucide-react";

// Import auth utilities
import { isLoggedIn as checkLogin, removeToken, getToken } from "@/utils/auth";

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [isLoggedIn,           setIsLoggedIn]           = useState(false);
  const [mobileMenuOpen,       setMobileMenuOpen]       = useState(false);
  const [companyDropdownOpen,  setCompanyDropdownOpen]  = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [pricingDropdownOpen,  setPricingDropdownOpen]  = useState(false);

  // Use sessionStorage-based auth check
  useEffect(() => {
    setIsLoggedIn(checkLogin());
  }, [location]);

  // Close all dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCompanyDropdownOpen(false);
    setServicesDropdownOpen(false);
    setPricingDropdownOpen(false);
  }, [location]);

  //  Logout clears sessionStorage via removeToken()
  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    navigate("/");
  };

  // ── Nav data ──────────────────────────────────────────────────────────────
  const companyLinks = [
    { title: "About Us", description: "Learn our story and mission", icon: Building2, to: "/about"   },
    { title: "Blog",     description: "Insights and industry news",  icon: Info,      to: "/blog"    },
    { title: "Contact",  description: "Get in touch with us",        icon: Mail,      to: "/contact" },
  ];

  const servicesLinks = [
    { title: "Manual Estimation",     description: "Detailed manual construction estimation",          icon: Calculator, to: "/calculator"    },
    { title: "AI-Powered Estimation", description: "Leverage AI for accurate construction estimates",  icon: Zap,        to: "/ai-estimation" },
    { title: "3D Model Viewer",       description: "Generate and view 3D models from floor plans",     icon: Box,        to: "/3d-service"    },
  ];

  const pricingPlans = [
    {
      name:     "Basic",
      price:    "Free",
      color:    "text-gray-300",
      bgColor:  "bg-white/5",
      border:   "border-white/10",
      features: ["5 AI / month", "3 3D / month", "Manual PDF"],
    },
    {
      name:     "Advanced",
      price:    "₹399/mo",
      color:    "text-cyan-300",
      bgColor:  "bg-cyan-500/10",
      border:   "border-cyan-400/30",
      features: ["Unlimited AI", "15 3D / month", "All PDFs + GLB"],
      popular:  true,
    },
    {
      name:     "Extreme",
      price:    "₹699/mo",
      color:    "text-purple-300",
      bgColor:  "bg-purple-500/10",
      border:   "border-purple-400/30",
      features: ["Unlimited AI", "Unlimited 3D", "All PDFs + GLB"],
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI Estimator
            </span>
          </Link>

          {/* ── Desktop Navigation ────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-6">

            {/* Home */}
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/" ? "text-cyan-400" : "text-gray-300 hover:text-white"
              }`}
            >
              Home
            </Link>

            {/* ── Company Dropdown ──────────────────────────────────────── */}
            <div className="relative">
              <button
                onMouseEnter={() => setCompanyDropdownOpen(true)}
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm font-medium py-2"
              >
                Company
                <ChevronDown className={`w-4 h-4 transition-transform ${companyDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {companyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onMouseLeave={() => setCompanyDropdownOpen(false)}
                    className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <div className="p-2">
                      {companyLinks.map((item) => (
                        <Link
                          key={item.title}
                          to={item.to}
                          onClick={() => setCompanyDropdownOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                            <item.icon className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Services Dropdown (logged in only) ────────────────────── */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onMouseEnter={() => setServicesDropdownOpen(true)}
                  onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                  className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm font-medium py-2"
                >
                  Services
                  <ChevronDown className={`w-4 h-4 transition-transform ${servicesDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {servicesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onMouseLeave={() => setServicesDropdownOpen(false)}
                      className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                    >
                      <div className="p-2">
                        {servicesLinks.map((item) => (
                          <Link
                            key={item.title}
                            to={item.to}
                            onClick={() => setServicesDropdownOpen(false)}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-colors">
                              <item.icon className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Pricing Dropdown ──────────────────────────────────────── */}
            <div className="relative">
              <button
                onMouseEnter={() => setPricingDropdownOpen(true)}
                onClick={() => setPricingDropdownOpen(!pricingDropdownOpen)}
                className={`flex items-center gap-1 transition-colors text-sm font-medium py-2 ${
                  location.pathname === "/pricing" ? "text-cyan-400" : "text-gray-300 hover:text-white"
                }`}
              >
               
                Pricing
                <ChevronDown className={`w-4 h-4 transition-transform ${pricingDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {pricingDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onMouseLeave={() => setPricingDropdownOpen(false)}
                    className="absolute top-full -left-32 mt-2 w-[480px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            Simple, Transparent Pricing
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Start free. Upgrade when you need more.
                          </p>
                        </div>
                        <Link
                          to="/pricing"
                          onClick={() => setPricingDropdownOpen(false)}
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                          Full details
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Plan Cards */}
                    <div className="p-3 grid grid-cols-3 gap-2">
                      {pricingPlans.map((plan) => (
                        <div
                          key={plan.name}
                          className={`relative p-3 rounded-xl border ${plan.border} ${plan.bgColor}`}
                        >
                          {plan.popular && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                Popular
                              </span>
                            </div>
                          )}
                          <div className={`text-sm font-bold ${plan.color} mb-0.5`}>
                            {plan.name}
                          </div>
                          <div className="text-white font-semibold text-sm mb-2">
                            {plan.price}
                          </div>
                          <ul className="space-y-1">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="p-3 pt-0 flex gap-2">
                      <button
                        onClick={() => {
                          setPricingDropdownOpen(false)
                          navigate("/pricing")
                        }}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-semibold transition-all"
                      >
                        View All Plans
                      </button>

                      {/* Use getToken() instead of localStorage */}
                      <button
                        onClick={() => {
                          setPricingDropdownOpen(false)
                          navigate(getToken() ? "/dashboard" : "/register")
                        }}
                        className="flex-1 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-medium transition-colors"
                      >
                        Get Started Free
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Auth Buttons ──────────────────────────────────────────── */}
            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === "/dashboard" ? "text-cyan-400" : "text-gray-300 hover:text-white"
                  }`}
                >
                  Dashboard
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                >
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Sign In
                </Link>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* ── Mobile Menu Button ────────────────────────────────────────── */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* ── Mobile Menu ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
            >
              <div className="py-4 space-y-3">

                {/* Home */}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  Home
                </Link>

                {/* Company */}
                <div className="px-4 py-2">
                  <div className="text-sm font-semibold text-gray-500 mb-2">Company</div>
                  <div className="space-y-1 pl-2">
                    {companyLinks.map((item) => (
                      <Link
                        key={item.title}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 py-2 text-gray-300 hover:text-cyan-400 transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Services (logged in only) */}
                {isLoggedIn && (
                  <div className="px-4 py-2">
                    <div className="text-sm font-semibold text-gray-500 mb-2">Services</div>
                    <div className="space-y-1 pl-2">
                      {servicesLinks.map((item) => (
                        <Link
                          key={item.title}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 py-2 text-gray-300 hover:text-cyan-400 transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="px-4 py-2">
                  <div className="text-sm font-semibold text-gray-500 mb-3">Pricing Plans</div>
                  <div className="space-y-2 mb-3">
                    {pricingPlans.map((plan) => (
                      <div
                        key={plan.name}
                        className={`flex items-center justify-between p-3 rounded-xl border ${plan.border} ${plan.bgColor}`}
                      >
                        <div>
                          <div className={`text-sm font-semibold ${plan.color} flex items-center gap-1`}>
                            {plan.name}
                            {plan.popular && (
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {plan.features[0]} • {plan.features[1]}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-white">{plan.price}</div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold"
                  >
                    <Crown className="w-4 h-4" />
                    View Full Pricing
                  </Link>
                </div>

                {/* Auth */}
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                    >
                      Dashboard
                    </Link>

                    {/* Use handleLogout which calls removeToken() */}
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/5 rounded-lg"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="px-4 pt-2 space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2 text-center text-gray-300 border border-white/10 rounded-lg"
                    >
                      Sign In
                    </Link>
                    <Button
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      onClick={() => {
                        navigate("/register")
                        setMobileMenuOpen(false)
                      }}
                    >
                      Get Started
                    </Button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}