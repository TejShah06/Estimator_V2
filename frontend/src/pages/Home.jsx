  import { useNavigate, Link, useLocation } from "react-router-dom";
  import { Button } from "../components/ui/button";
  import { Card, CardContent } from "../components/ui/card";
  import { motion, useScroll, useTransform } from "framer-motion";
  import { useRef, useState, useEffect } from "react";
  import MainLayout from "@/layout/MainLayout";

  export default function Home() {

    const navigate = useNavigate();
    const location = useLocation();
    const ref = useRef(null);

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // check login whenever page loads or route changes
    useEffect(() => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    }, [location]);

    const { scrollYProgress } = useScroll({
      target: ref,
      offset: ["start start", "end end"]
    });

    const yHero = useTransform(scrollYProgress, [0, 1], [0, 250]);
    const yImage = useTransform(scrollYProgress, [0, 1], [0, -250]);

    /* ---------------- BUTTON ACTIONS ---------------- */

    const handleGetStarted = () => {

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first to use the calculator");
        navigate("/login");
        return;
      }

      navigate("/dashboard");
    };

    const handleLearnMore = () => {

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first to view history");
        navigate("/login");
        return;
      }

      navigate("/learnmore");
    };

    const handleAuthButton = () => {

      const token = localStorage.getItem("token");

      if (token) {

        localStorage.removeItem("token");
        setIsLoggedIn(false);

        alert("Logged out successfully");

        navigate("/");

      } else {

        navigate("/login");

      }
    };

    return (
  <MainLayout>
  <motion.div
  ref={ref}
  className="bg-slate-950 text-white min-h-screen overflow-x-hidden relative"
  >

  {/* SCROLL BAR */}

  <motion.div
  className="fixed top-0 left-0 right-0 h-1 bg-cyan-400 origin-left z-50"
  style={{ scaleX: scrollYProgress }}
  />

  {/* HERO */}

  <section className="grid md:grid-cols-2 gap-10 px-10 py-28 items-center">

  <motion.div style={{ y: yHero }}>

  <h1 className="text-6xl font-bold leading-tight">

  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
  Smart Construction
  </span>

  <br/>

  Cost Estimator

  </h1>

  <p className="mt-6 text-gray-400 text-lg max-w-xl">

  AI-powered concrete estimation system for civil engineers
  and construction companies.

  Calculate M20, M25 and custom ratios instantly.

  </p>

  <div className="mt-8 flex gap-5">

  <Button
  className="bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/40"
  onClick={handleGetStarted}
  >
  Get Started
  </Button>

  <Button
  variant="outline"
  className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
  onClick={handleLearnMore}
  >
  Learn More
  </Button>

  </div>

  </motion.div>

  <motion.div style={{ y: yImage }}>

  <img
  src="https://images.unsplash.com/photo-1503387762-592deb58ef4e"
  className="rounded-2xl shadow-2xl"
  alt="construction"
  />

  </motion.div>

  </section>

  {/* FEATURES */}

  <section className="px-10 py-24">

  <h2 className="text-4xl font-bold text-center mb-16">
  Platform Features
  </h2>

  <div className="grid md:grid-cols-3 gap-10">

  {[
  {
  title:"Concrete Calculator",
  desc:"Calculate M20, M25 and custom concrete ratios instantly."
  },
  {
  title:"Estimate History",
  desc:"Save and review previous calculations easily."
  },
  {
  title:"Engineer Friendly",
  desc:"Built for civil engineers and construction companies."
  }
  ].map((f,i)=>(

  <motion.div
  key={i}
  whileHover={{scale:1.05,y:-10}}
  transition={{type:"spring",stiffness:200}}
  >

  <Card className="bg-white/5 backdrop-blur-lg border border-slate-800 hover:border-cyan-400 transition shadow-xl">

  <CardContent className="p-6">

  <h3 className="text-xl font-bold text-cyan-400">
  {f.title}
  </h3>

  <p className="text-gray-400 mt-3">
  {f.desc}
  </p>

  </CardContent>

  </Card>

  </motion.div>

  ))}

  </div>

  </section>

  {/* FOOTER */}

  <footer className="text-center py-12 border-t border-slate-800">

  <p className="text-gray-500">
  © 2026 AI Smart Estimator
  </p>

  </footer>

  </motion.div>
  </MainLayout>

    );
  }