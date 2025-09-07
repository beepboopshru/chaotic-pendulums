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

  // Add: coordinate system and physics unit conversion constants
  const centerX = 400; // pivot X (canvas width is 800)
  const centerY = 120; // pivot Y (near top for visibility)
  const scale = 1; // pixel scaling for drawing
  const metersPerPixel = 0.01; // 1 px = 0.01 m for physics calculations

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

  // Add: energy loss (damping) controls
  const [enableDamping, setEnableDamping] = useState(false);
  const [damping, setDamping] = useState(0.05); // per-second damping factor
  
  const [trails, setTrails] = useState<Trail[]>([]);
  const [energyHistory, setEnergyHistory] = useState<number[]>([]);
  const [trails1, setTrails1] = useState<Trail[]>([]);

  // Add: drag state and play state memory
  const [dragging, setDragging] = useState<null | "mass1" | "mass2">(null);
  const wasPlayingRef = useRef(false);

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

    // Convert lengths to meters for physics
    const L1 = length1 * metersPerPixel;
    const L2 = length2 * metersPerPixel;

    // Kinetic energy
    const ke1 = 0.5 * mass1 * Math.pow(L1 * velocity1, 2);
    const ke2 =
      0.5 *
      mass2 *
      (Math.pow(L1 * velocity1, 2) +
        Math.pow(L2 * velocity2, 2) +
        2 * L1 * L2 * velocity1 * velocity2 * Math.cos(angle1 - angle2));

    // Potential energy (taking pivot as reference)
    const pe1 = -mass1 * gravity * L1 * Math.cos(angle1);
    const pe2 = -mass2 * gravity * (L1 * Math.cos(angle1) + L2 * Math.cos(angle2));

    return ke1 + ke2 + pe1 + pe2;
  }, [config, metersPerPixel]);
  
  // Lagrangian mechanics equations of motion (standard form with meter conversion)
  const updateState = useCallback((currentState: PendulumState, dt: number) => {
    const { angle1, angle2, velocity1, velocity2 } = currentState;
    const { length1, length2, mass1, mass2, gravity } = config;

    // Convert lengths to meters for physics
    const L1 = length1 * metersPerPixel;
    const L2 = length2 * metersPerPixel;

    const m1 = mass1;
    const m2 = mass2;
    const a1 = angle1;
    const a2 = angle2;
    const w1 = velocity1;
    const w2 = velocity2;

    const delta = a1 - a2;
    const den = 2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2);

    // Angular accelerations (rad/s^2), standard double pendulum equations
    const a1acc =
      (-gravity * (2 * m1 + m2) * Math.sin(a1) -
        m2 * gravity * Math.sin(a1 - 2 * a2) -
        2 * Math.sin(delta) *
          m2 *
          (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(delta))) /
      (L1 * den);

    const a2acc =
      (2 *
        Math.sin(delta) *
        (w1 * w1 * L1 * (m1 + m2) +
          gravity * (m1 + m2) * Math.cos(a1) +
          w2 * w2 * L2 * m2 * Math.cos(delta))) /
      (L2 * den);

    // Integrate angles and velocities
    let newV1 = w1 + a1acc * dt;
    let newV2 = w2 + a2acc * dt;

    // Apply exponential damping to model energy loss (e.g., air resistance)
    if (enableDamping && damping > 0) {
      const decay = Math.exp(-damping * dt);
      newV1 *= decay;
      newV2 *= decay;
    }

    return {
      angle1: a1 + newV1 * dt,
      angle2: a2 + newV2 * dt,
      velocity1: newV1,
      velocity2: newV2,
    };
  }, [config, metersPerPixel, enableDamping, damping]);
  
  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (!isPlaying) return;
    
    const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.016); // Cap at 60 FPS
    lastTimeRef.current = currentTime;
    
    if (dt > 0) {
      setState(prevState => {
        const newState = updateState(prevState, dt);
        
        // Add trail point
        const { x1, y1, x2, y2 } = getPositions(newState);
        setTrails1(prevTrails => {
          const newTrails = [...prevTrails, { x: x1, y: y1, timestamp: currentTime }];
          // Keep only recent trails (last 3 seconds)
          return newTrails.filter(trail => currentTime - trail.timestamp < 3000);
        });
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
      // Use performance.now() to match RAF timestamps
      const now = performance.now();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 1; i < trails.length; i++) {
        const age = now - trails[i].timestamp;
        const alpha = Math.max(0, 1 - age / 3000); // fade out over 3s
        ctx.globalAlpha = alpha * 0.8;
        
        if (i === 1) {
          ctx.moveTo(trails[i-1].x, trails[i-1].y);
        }
        ctx.lineTo(trails[i].x, trails[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (showTrails && trails1.length > 1) {
      const now = performance.now();
      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 1; i < trails1.length; i++) {
        const age = now - trails1[i].timestamp;
        const alpha = Math.max(0, 1 - age / 3000); // fade out over 3s
        ctx.globalAlpha = alpha * 0.8;
        
        if (i === 1) {
          ctx.moveTo(trails1[i-1].x, trails1[i-1].y);
        }
        ctx.lineTo(trails1[i].x, trails1[i].y);
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
    
  }, [state, config, trails, trails1, showTrails, getPositions]);
  
  // Add: helper to get canvas-relative coordinates accounting for CSS scaling
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
    return { x, y };
  };

  // Add: pointer handlers for drag & release
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoords(e);
    const { x1, y1, x2, y2 } = getPositions(state);

    const radius1 = Math.max(8, config.mass1);
    const radius2 = Math.max(8, config.mass2);
    const threshold1 = radius1 + 8;
    const threshold2 = radius2 + 8;

    const d1 = Math.hypot(x - x1, y - y1);
    const d2 = Math.hypot(x - x2, y - y2);

    if (d1 <= threshold1 || d2 <= threshold2) {
      wasPlayingRef.current = isPlaying;
      setIsPlaying(false);
      setTrails([]); // clear trails to avoid artifacts while dragging
      setTrails1([]);
      if (d2 <= d1 && d2 <= threshold2) {
        setDragging("mass2");
      } else if (d1 <= threshold1) {
        setDragging("mass1");
      }
      canvas.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const { x, y } = getCanvasCoords(e);

    if (dragging === "mass1") {
      // Set angle1 from pivot (centerX, centerY) towards mouse
      const newAngle1 = Math.atan2(x - centerX, y - centerY);
      setState(prev => ({
        ...prev,
        angle1: newAngle1,
        velocity1: 0,
        velocity2: 0,
      }));
      setTrails([]);
      return;
    }

    if (dragging === "mass2") {
      // Set angle2 from mass1 position towards mouse
      const { x1, y1 } = getPositions(state);
      const newAngle2 = Math.atan2(x - x1, y - y1);
      setState(prev => ({
        ...prev,
        angle2: newAngle2,
        velocity1: 0,
        velocity2: 0,
      }));
      setTrails([]);
      return;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    setDragging(null);
    const canvas = canvasRef.current;
    canvas?.releasePointerCapture?.(e.pointerId);
    if (wasPlayingRef.current) {
      setIsPlaying(true);
    }
  };

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
    setTrails1([]);
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
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
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
                          {enableDamping
                            ? "Dissipative (energy loss enabled)"
                            : energyHistory.length > 10
                              ? ((1 - Math.abs(currentEnergy - energyHistory[0]) / Math.abs(energyHistory[0])) * 100).toFixed(1) + "%"
                              : "N/A"}
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

                {/* Add: Energy Loss (Damping) */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-300">Energy Loss (Damping)</Label>
                  <Switch
                    checked={enableDamping}
                    onCheckedChange={setEnableDamping}
                  />
                </div>

                {enableDamping && (
                  <div>
                    <Label className="text-sm text-gray-300">
                      Damping: {damping.toFixed(2)} s⁻¹
                    </Label>
                    <Slider
                      value={[damping]}
                      onValueChange={([value]) => setDamping(value)}
                      min={0.01}
                      max={1}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                )}
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
                    <span className="text-xs text-gray-400">Mass 1 & Trail</span>
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
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <g opacity="0.15" stroke="#ffffff">
                        {[0, 25, 50, 75, 100].map((v) => (
                          <line key={`h-${v}`} x1="0" y1={v} x2="100" y2={v} strokeWidth="0.5" />
                        ))}
                        {[0, 25, 50, 75, 100].map((v) => (
                          <line key={`v-${v}`} x1={v} y1="0" x2={v} y2="100" strokeWidth="0.5" />
                        ))}
                      </g>

                      {/* Axes */}
                      <g stroke="#9ca3af">
                        {/* X-axis */}
                        <line x1="0" y1="100" x2="100" y2="100" strokeWidth="0.75" />
                        {/* Y-axis */}
                        <line x1="0" y1="0" x2="0" y2="100" strokeWidth="0.75" />
                      </g>

                      {/* Ticks */}
                      <g stroke="#9ca3af">
                        {[0, 25, 50, 75, 100].map((v) => (
                          <line key={`xt-${v}`} x1={v} y1="100" x2={v} y2="98" strokeWidth="0.75" />
                        ))}
                        {[0, 25, 50, 75, 100].map((v) => (
                          <line key={`yt-${v}`} x1="0" y1={v} x2="2" y2={v} strokeWidth="0.75" />
                        ))}
                      </g>

                      {/* Labels */}
                      <g fill="#9ca3af" fontSize="4" fontFamily="ui-sans-serif, system-ui">
                        <text x="50" y="98" textAnchor="middle">time</text>
                        <text x="2" y="6" textAnchor="start">energy</text>
                        {/* Optional numeric labels */}
                        <text x="0" y="104" textAnchor="start">0</text>
                        <text x="25" y="104" textAnchor="middle">25%</text>
                        <text x="50" y="104" textAnchor="middle">50%</text>
                        <text x="75" y="104" textAnchor="middle">75%</text>
                        <text x="100" y="104" textAnchor="end">100%</text>
                      </g>

                      {/* Energy polyline */}
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