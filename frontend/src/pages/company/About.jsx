// src/pages/About.jsx
import { motion } from "framer-motion";
import MainLayout from "@/layout/MainLayout";
import { Target, Users, Zap, Award, TrendingUp, Heart } from "lucide-react";

const stats = [
  { label: "Projects Analyzed", value: "2,453+" },
  { label: "Active Users", value: "500+" },
  { label: "Accuracy Rate", value: "95%" },
  { label: "Cost Saved", value: "₹200Cr+" },
];

const values = [
  {
    icon: Target,
    title: "Precision First",
    description: "We believe in accuracy over speed. Every estimation is validated for reliability."
  },
  {
    icon: Users,
    title: "User Centric",
    description: "Built by engineers, for engineers. We understand your workflow challenges."
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Cutting-edge AI technology that evolves with the construction industry."
  },
  {
    icon: Heart,
    title: "Trust",
    description: "Your data is secure. We maintain the highest standards of privacy and security."
  }
];

export default function About() {
  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white min-h-screen pt-20">
        
        {/* Hero */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Building the Future
                </span>
                <br />
                <span className="text-white">of Construction</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                We're on a mission to revolutionize construction estimation through 
                artificial intelligence, making accurate cost predictions accessible 
                to every professional.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 px-4 sm:px-6 border-y border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Founded in 2024, AI Estimator began with a simple observation: construction 
                  professionals were spending countless hours on manual estimations, often 
                  leading to costly errors and delays.
                </p>
                <p>
                  We assembled a team of civil engineers and AI specialists to build a 
                  solution that combines domain expertise with cutting-edge machine learning. 
                  The result is a platform that delivers accurate estimates in seconds, not days.
                </p>
                <p>
                  Today, we're proud to serve hundreds of construction companies across India, 
                  helping them save time, reduce costs, and win more projects with confidence.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Zap className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">Est. 2024</div>
                  <div className="text-gray-400">Revolutionizing Construction</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                Our Values
              </h2>
              <p className="text-gray-400">The principles that guide everything we do</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-400/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
              Join Our Team
            </h2>
            <p className="text-gray-400 mb-8">
              We're always looking for talented individuals who share our passion for 
              innovation in construction technology.
            </p>
            <a
              href="/careers"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-semibold text-white transition-all"
            >
              View Open Positions
            </a>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}