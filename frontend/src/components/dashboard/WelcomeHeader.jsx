import { motion } from "framer-motion"
import { Sun, Moon, CloudSun } from "lucide-react"

const WelcomeHeader = () => {
  const hour = new Date().getHours()

  let greeting = "Good Morning"
  let Icon = Sun

  if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon"
    Icon = CloudSun
  } else if (hour >= 17) {
    greeting = "Good Evening"
    Icon = Moon
  }

  // Get username from localStorage or default
  const username = localStorage.getItem("username") || "Builder"

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between"
    >
      <div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Icon className="w-8 h-8 text-amber-500" />
          </motion.div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {greeting}, {username}! 👋
          </h1>
        </div>

        <p className="text-gray-500 mt-1 ml-10">
          Here&apos;s an overview of your construction estimates
        </p>
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="hidden md:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-blue-700 font-medium">
          AI Pipeline Ready
        </span>
      </motion.div>
    </motion.div>
  )
}

export default WelcomeHeader