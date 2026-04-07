// src/pages/Blog.jsx
import { motion } from "framer-motion";
import MainLayout from "@/layout/MainLayout";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";

const featuredPost = {
  title: "The Future of AI in Construction Estimation",
  excerpt: "Discover how artificial intelligence is revolutionizing the way we estimate construction costs, from manual calculations to instant AI-powered analysis.",
  image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
  date: "Jan 15, 2024",
  readTime: "5 min read",
  category: "Technology",
  slug: "future-of-ai-construction"
};

const posts = [
  {
    title: "Understanding Concrete Grades: M20 vs M25",
    excerpt: "A comprehensive guide to choosing the right concrete mix for your construction project.",
    date: "Jan 12, 2024",
    readTime: "4 min read",
    category: "Guide",
    slug: "concrete-grades-guide"
  },
  {
    title: "How to Reduce Material Wastage by 30%",
    excerpt: "Practical tips for optimizing material usage and reducing costs on construction sites.",
    date: "Jan 10, 2024",
    readTime: "6 min read",
    category: "Tips",
    slug: "reduce-material-wastage"
  },
  {
    title: "The Rise of Smart Construction in India",
    excerpt: "Exploring the adoption of technology in the Indian construction industry.",
    date: "Jan 8, 2024",
    readTime: "5 min read",
    category: "Industry",
    slug: "smart-construction-india"
  },
  {
    title: "5 Common Estimation Mistakes to Avoid",
    excerpt: "Learn from the most frequent errors that cost contractors time and money.",
    date: "Jan 5, 2024",
    readTime: "4 min read",
    category: "Tips",
    slug: "estimation-mistakes"
  },
  {
    title: "Sustainable Construction: Cost vs Benefit",
    excerpt: "Analyzing the ROI of green building practices in modern construction.",
    date: "Jan 3, 2024",
    readTime: "7 min read",
    category: "Sustainability",
    slug: "sustainable-construction-costs"
  },
  {
    title: "Navigating Construction Regulations in 2024",
    excerpt: "A quick overview of recent changes in construction compliance and standards.",
    date: "Dec 28, 2023",
    readTime: "5 min read",
    category: "Regulations",
    slug: "construction-regulations-2024"
  }
];

const categories = ["All", "Technology", "Guide", "Tips", "Industry", "Sustainability", "Regulations"];

export default function Blog() {
  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white min-h-screen pt-20">
        
        {/* Header */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Blog & Insights
                </span>
              </h1>
              <p className="text-lg text-gray-400">
                Stay updated with the latest in construction technology and estimation
              </p>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 px-4 sm:px-6 lg:px-8 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-2">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  index === 0
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer"
            >
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center bg-slate-900/50 backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20">
                      {featuredPost.category}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-400 mb-6 line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <button className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-medium">
                    Read Article <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-white">Latest Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <motion.article
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-cyan-400/50 transition-all cursor-pointer"
                >
                  <div className="aspect-video bg-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Tag className="w-12 h-12 text-white/20" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{post.date}</span>
                      <ArrowRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-400 mb-8">
              Get the latest insights and tips delivered straight to your inbox
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-400 text-white"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium text-white transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}