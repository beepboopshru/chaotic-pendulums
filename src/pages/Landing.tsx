import { motion } from "framer-motion";
import { ArrowRight, Zap, Eye, BarChart3, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Realistic Physics",
      description: "Lagrangian mechanics with adjustable parameters for authentic chaotic motion",
      color: "#00ff88"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Visual Trails",
      description: "Fading path visualization to reveal the beautiful patterns of chaos",
      color: "#0088ff"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Energy Conservation",
      description: "Real-time energy monitoring to demonstrate conservation principles",
      color: "#ff0080"
    },
    {
      icon: <Shuffle className="w-8 h-8" />,
      title: "Chaos Exploration",
      description: "Randomize initial conditions to explore sensitivity and butterfly effects",
      color: "#00ff88"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#0088ff] flex items-center justify-center">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">ChaosPendulum</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              onClick={() => navigate(isAuthenticated ? "/simulation" : "/auth")}
              className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black font-semibold px-6"
            >
              {isAuthenticated ? "Launch Simulation" : "Get Started"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#00ff88]/10 to-transparent blur-3xl"
          />
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#0088ff]/10 to-transparent blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-[#00ff88] via-[#0088ff] to-[#ff0080] bg-clip-text text-transparent">
                  Chaos
                </span>
                <br />
                <span className="text-white">in Motion</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Explore the mesmerizing world of double pendulum dynamics. 
              Witness how tiny changes create dramatically different outcomes in this 
              <span className="text-[#00ff88] font-semibold"> interactive physics simulation</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Button
                onClick={() => navigate("/simulation")}
                size="lg"
                className="bg-gradient-to-r from-[#00ff88] to-[#0088ff] hover:from-[#00ff88]/80 hover:to-[#0088ff]/80 text-black font-bold px-8 py-4 text-lg shadow-lg shadow-[#00ff88]/25"
              >
                Start Simulation
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                size="lg"
                className="border-[#ff0080] text-[#ff0080] hover:bg-[#ff0080]/10 px-8 py-4 text-lg"
              >
                Learn More
              </Button>
            </motion.div>

            {/* Demo Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative mx-auto w-80 h-80 mb-20"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00ff88]/20 to-[#0088ff]/20 blur-xl" />
              <svg className="w-full h-full" viewBox="0 0 320 320">
                {/* Animated pendulum visualization */}
                <motion.g
                  animate={{ rotate: [0, 30, -30, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: "160px 80px" }}
                >
                  <line x1="160" y1="80" x2="160" y2="180" stroke="#ffffff" strokeWidth="3" />
                  <motion.g
                    animate={{ rotate: [0, -45, 45, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    style={{ transformOrigin: "160px 180px" }}
                  >
                    <line x1="160" y1="180" x2="160" y2="260" stroke="#ffffff" strokeWidth="3" />
                    <circle cx="160" cy="260" r="12" fill="#00ff88" stroke="#ffffff" strokeWidth="2" />
                  </motion.g>
                  <circle cx="160" cy="180" r="10" fill="#0088ff" stroke="#ffffff" strokeWidth="2" />
                </motion.g>
                <circle cx="160" cy="80" r="6" fill="#ff0080" />
                
                {/* Trail effect */}
                <motion.path
                  d="M 160 260 Q 200 240 180 200 Q 140 220 160 260"
                  fill="none"
                  stroke="#00ff88"
                  strokeWidth="2"
                  opacity="0.6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[#0088ff] to-[#ff0080] bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to explore and understand chaotic dynamics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#111111]/50 border-gray-800 hover:border-gray-600 transition-all duration-300 h-full backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ 
                      backgroundColor: `${feature.color}20`,
                      boxShadow: `0 0 20px ${feature.color}40`
                    }}
                  >
                    <div style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#111111] to-[#1a1a1a] rounded-2xl p-12 border border-gray-800"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to explore <span className="text-[#00ff88]">chaos</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Dive into the fascinating world of nonlinear dynamics and discover the beauty hidden in chaos.
          </p>
          <Button
            onClick={() => navigate("/simulation")}
            size="lg"
            className="bg-gradient-to-r from-[#00ff88] to-[#0088ff] hover:from-[#00ff88]/80 hover:to-[#0088ff]/80 text-black font-bold px-8 py-4 text-lg shadow-lg shadow-[#00ff88]/25"
          >
            Launch Simulation Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500">
            Built with physics, powered by{" "}
            <a
              href="https://vly.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff88] hover:text-[#00ff88]/80 transition-colors"
            >
              vly.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}