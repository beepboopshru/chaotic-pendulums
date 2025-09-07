import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Settings, Save, Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface PendulumState {
  angle1: number;
  angle2: number;
  velocity1: number;
  velocity2: number;
}

interface PendulumConfig {
  length1: number;
  length2: number;
  mass1: number;
  mass2: number;
  gravity: number;
}

interface Trail {
  x: number;
  y: number;
  timestamp: number;
}

export default function DoublePendulum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showEnergy, setShowEnergy] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  const [state, setState] = useState<PendulumState>({
    angle1: Math.PI / 2,
    angle2: Math.PI / 2,
    velocity1: 0,
    velocity2: 0,
  });
  
  const [config, setConfig] = useState<PendulumConfig>({
    length1: 150,
    length2: 150,
    mass1: 10,
    mass2: 10,
    gravity: 9.81,
  });
  
  const [trails, setTrails] = useState<Trail[]>([]);
  const [energyHistory, setEnergyHistory] = useState<number[]>([]);
  
  const centerX = 400;
  const centerY = 100;
  const scale = 1;
  
  // Calculate pendulum positions
  const getPositions = useCallback((currentState: PendulumState) => {
    const { angle1, angle2 } = currentState;
    const { length1, length2 } = config;
    
    const x1 = centerX + length1 * Math.sin(angle1) * scale;
    const y1 = centerY + length1 * Math.cos(angle1) * scale;
    
    const x2 = x1 + length2 * Math.sin(angle2) * scale;
    const y2 = y1 + length2 * Math.cos(angle2) * scale;
    
    return { x1, y1, x2, y2 };
  }, [config, centerX, centerY, scale]);
  
  // Calculate energy
  const calculateEnergy = useCallback((currentState: PendulumState) => {
    const { angle1, angle2, velocity1, velocity2 } = currentState;
    const { length1, length2, mass1, mass2, gravity } = config;
    
    // Kinetic energy
    const ke1 = 0.5 * mass1 * Math.pow(length1 * velocity1, 2);
    const ke2 = 0.5 * mass2 * (
      Math.pow(length1 * velocity1, 2) + 
      Math.pow(length2 * velocity2, 2) + 
      2 * length1 * length2 * velocity1 * velocity2 * Math.cos(angle1 - angle2)
    );
    
    // Potential energy (taking center as reference)
    const pe1 = -mass1 * gravity * length1 * Math.cos(angle1);
    const pe2 = -mass2 * gravity * (length1 * Math.cos(angle1) + length2 * Math.cos(angle2));
    
    return ke1 + ke2 + pe1 + pe2;
  }, [config]);
  
  // Lagrangian mechanics equations of motion
  const updateState = useCallback((currentState: PendulumState, dt: number) => {
    const { angle1, angle2, velocity1, velocity2 } = currentState;
    const { length1, length2, mass1, mass2, gravity } = config;
    
    const deltaAngle = angle1 - angle2;
    const den1 = (mass1 + mass2) * length1 - mass2 * length1 * Math.cos(deltaAngle) * Math.cos(deltaAngle);
    const den2 = (length2 / length1) * den1;
    
    // First pendulum acceleration
    const num1 = (
      -mass2 * length1 * velocity1 * velocity1 * Math.sin(deltaAngle) * Math.cos(deltaAngle) +
      mass2 * gravity * Math.sin(angle2) * Math.cos(deltaAngle) +
      mass2 * length2 * velocity2 * velocity2 * Math.sin(deltaAngle) -
      (mass1 + mass2) * gravity * Math.sin(angle1)
    );
    
    // Second pendulum acceleration
    const num2 = (
      -mass2 * length2 * velocity2 * velocity2 * Math.sin(deltaAngle) * Math.cos(deltaAngle) +
      (mass1 + mass2) * gravity * Math.sin(angle1) * Math.cos(deltaAngle) -
      (mass1 + mass2) * length1 * velocity1 * velocity1 * Math.sin(deltaAngle) -
      (mass1 + mass2) * gravity * Math.sin(angle2)
    );
    
    const acceleration1 = num1 / den1;
    const acceleration2 = num2 / den2;
    
    return {
      angle1: angle1 + velocity1 * dt,
      angle2: angle2 + velocity2 * dt,
      velocity1: velocity1 + acceleration1 * dt,
      velocity2: velocity2 + acceleration2 * dt,
    };
  }, [config]);
  
  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (!isPlaying) return;
    
    const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.016); // Cap at 60 FPS
    lastTimeRef.current = currentTime;
    
    if (dt > 0) {
      setState(prevState => {
        const newState = updateState(prevState, dt);
        
        // Add trail point
        const { x2, y2 } = getPositions(newState);
        setTrails(prevTrails => {
          const newTrails = [...prevTrails, { x: x2, y: y2, timestamp: currentTime }];
          // Keep only recent trails (last 3 seconds)
          return newTrails.filter(trail => currentTime - trail.timestamp < 3000);
        });
        
        // Update energy history
        const energy = calculateEnergy(newState);
        setEnergyHistory(prevHistory => {
          const newHistory = [...prevHistory, energy];
          return newHistory.slice(-200); // Keep last 200 points
        });
        
        return newState;
      });
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, updateState, getPositions, calculateEnergy]);
  
  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const { x1, y1, x2, y2 } = getPositions(state);
    
    // Draw trails
    if (showTrails && trails.length > 1) {
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 1; i < trails.length; i++) {
        const alpha = Math.max(0, (trails[i].timestamp - (Date.now() - 3000)) / 3000);
        ctx.globalAlpha = alpha * 0.8;
        
        if (i === 1) {
          ctx.moveTo(trails[i-1].x, trails[i-1].y);
        }
        ctx.lineTo(trails[i].x, trails[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    
    // Draw pendulum rods
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw pivot point
    ctx.fillStyle = '#ff0080';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw masses
    const radius1 = Math.max(8, config.mass1);
    const radius2 = Math.max(8, config.mass2);
    
    // Mass 1
    ctx.fillStyle = '#0088ff';
    ctx.beginPath();
    ctx.arc(x1, y1, radius1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Mass 2
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(x2, y2, radius2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
  }, [state, config, trails, showTrails, getPositions]);
  
  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);
  
  const handlePlay = () => setIsPlaying(!isPlaying);
  
  const handleReset = () => {
    setIsPlaying(false);
    setState({
      angle1: Math.PI / 2,
      angle2: Math.PI / 2,
      velocity1: 0,
      velocity2: 0,
    });
    setTrails([]);
    setEnergyHistory([]);
  };
  
  const handleRandomize = () => {
    const randomOffset = () => (Math.random() - 0.5) * 0.1; // Small random offset
    setState(prevState => ({
      ...prevState,
      angle1: prevState.angle1 + randomOffset(),
      angle2: prevState.angle2 + randomOffset(),
    }));
  };
  
  const currentEnergy = calculateEnergy(state);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#111111] text-white p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-[#00ff88] to-[#0088ff] bg-clip-text text-transparent">
            Double Pendulum Chaos
          </h1>
          <p className="text-gray-400 text-lg">
            Explore the beautiful complexity of chaotic motion
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <Card className="bg-[#111111] border-gray-800">
              <CardContent className="p-6">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-auto border border-gray-700 rounded-lg bg-[#0a0a0a]"
                  />
                  
                  {/* Control Overlay */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Button
                      onClick={handlePlay}
                      size="sm"
                      className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={handleReset}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 hover:bg-gray-800"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleRandomize}
                      size="sm"
                      variant="outline"
                      className="border-[#ff0080] text-[#ff0080] hover:bg-[#ff0080]/10"
                    >
                      Chaos
                    </Button>
                  </div>
                  
                  {/* Energy Display */}
                  {showEnergy && (
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
                      <div className="text-sm">
                        <div className="text-[#00ff88]">Energy: {currentEnergy.toFixed(2)} J</div>
                        <div className="text-gray-400 text-xs mt-1">
                          Conservation: {energyHistory.length > 10 ? 
                            ((1 - Math.abs(currentEnergy - energyHistory[0]) / Math.abs(energyHistory[0])) * 100).toFixed(1) + '%' : 
                            'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Controls Panel */}
          <div className="space-y-6">
            <Card className="bg-[#111111] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#00ff88]">
                  <Settings className="w-5 h-5" />
                  Physics Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-300">Length 1: {config.length1}px</Label>
                  <Slider
                    value={[config.length1]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, length1: value }))}
                    min={50}
                    max={250}
                    step={10}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-300">Length 2: {config.length2}px</Label>
                  <Slider
                    value={[config.length2]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, length2: value }))}
                    min={50}
                    max={250}
                    step={10}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-300">Mass 1: {config.mass1}kg</Label>
                  <Slider
                    value={[config.mass1]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, mass1: value }))}
                    min={1}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-300">Mass 2: {config.mass2}kg</Label>
                  <Slider
                    value={[config.mass2]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, mass2: value }))}
                    min={1}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-300">Gravity: {config.gravity.toFixed(1)} m/s²</Label>
                  <Slider
                    value={[config.gravity]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, gravity: value }))}
                    min={1}
                    max={20}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#111111] border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#0088ff]">Visualization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-300">Show Trails</Label>
                  <Switch
                    checked={showTrails}
                    onCheckedChange={setShowTrails}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-300">Show Energy</Label>
                  <Switch
                    checked={showEnergy}
                    onCheckedChange={setShowEnergy}
                  />
                </div>
                
                <Separator className="bg-gray-700" />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0088ff]"></div>
                    <span className="text-xs text-gray-400">Mass 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#00ff88]"></div>
                    <span className="text-xs text-gray-400">Mass 2 & Trail</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff0080]"></div>
                    <span className="text-xs text-gray-400">Pivot Point</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Energy Graph */}
            {showEnergy && energyHistory.length > 10 && (
              <Card className="bg-[#111111] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-[#ff0080]">Energy Conservation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 relative">
                    <svg className="w-full h-full">
                      <polyline
                        fill="none"
                        stroke="#00ff88"
                        strokeWidth="2"
                        points={energyHistory.map((energy, i) => {
                          const x = (i / (energyHistory.length - 1)) * 100;
                          const minE = Math.min(...energyHistory);
                          const maxE = Math.max(...energyHistory);
                          const y = 100 - ((energy - minE) / (maxE - minE || 1)) * 100;
                          return `${x},${y}`;
                        }).join(' ')}
                        vectorEffect="non-scaling-stroke"
                        preserveAspectRatio="none"
                        viewBox="0 0 100 100"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
