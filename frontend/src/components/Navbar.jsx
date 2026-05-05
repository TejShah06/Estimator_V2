import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Briefcase,
  Mail,
  ChevronDown,
  Menu,
  X,
  Zap,
  LayoutDashboard,
  Calculator,
  Home,
  Info,
  Box
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const companyLinks = [
    {
      title: "About Us",
      description: "Learn our story and mission",
      icon: Building2,
      to: "/about",
    },
    {
      title: "Blog",
      description: "Insights and industry news",
      icon: Info,
      to: "/blog",
    },
    {
      title: "Contact",
      description: "Get in touch with us",
      icon: Mail,
      to: "/contact",
    },
  ];

  const servicesLinks = [
    {
      title: "Manual Estimation",
      description: "Detailed manual construction estimation",
      icon: Calculator,
      to: "/calculator",
    },
    {
      title: "AI-Powered Estimation",
      description: "Leverage AI for accurate construction estimates",
      icon: Zap,
      to: "/ai-estimation",
    },
    {
      title: "3D Model Viewer",
      description: "Generate and view 3D models from floor plans",
      icon: Box,
      to: "/3d-service",
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI Estimator
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Home
            </Link>

            {/* Company Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setCompanyDropdownOpen(true)}
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm font-medium py-2"
              >
                Company
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    companyDropdownOpen ? "rotate-180" : ""
                  }`}
                />
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
                            <div className="text-xs text-gray-500">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Services Dropdown */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onMouseEnter={() => setServicesDropdownOpen(true)}
                  onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                  className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm font-medium py-2"
                >
                  Services
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      servicesDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
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
                              <div className="text-xs text-gray-500">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
            >
              <div className="py-4 space-y-3">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  Home
                </Link>

                {/* Mobile Company Links */}
                <div className="px-4 py-2">
                  <div className="text-sm font-semibold text-gray-500 mb-2">
                    Company
                  </div>
                  <div className="space-y-1 pl-2">
                    {companyLinks.map((item) => (
                      <Link
                        key={item.title}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 py-2 text-gray-300 hover:text-cyan-400"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Mobile Services Links */}
                {isLoggedIn && (
                  <div className="px-4 py-2">
                    <div className="text-sm font-semibold text-gray-500 mb-2">
                      Services
                    </div>
                    <div className="space-y-1 pl-2">
                      {servicesLinks.map((item) => (
                        <Link
                          key={item.title}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 py-2 text-gray-300 hover:text-cyan-400"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {isLoggedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
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
                        navigate("/register");
                        setMobileMenuOpen(false);
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