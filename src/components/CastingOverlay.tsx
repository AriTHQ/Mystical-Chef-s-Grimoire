import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Hands, HAND_CONNECTIONS, Results } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Target, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type RitualType = 'grinding' | 'pinch' | 'pulse';

interface CastingOverlayProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const CastingOverlay: React.FC<CastingOverlayProps> = ({ onComplete, onCancel }) => {
  const [ritualType, setRitualType] = useState<RitualType>('grinding');
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [comboCount, setComboCount] = useState(0);
  const [energyDensity, setEnergyDensity] = useState(0);
  const [status, setStatus] = useState<'casting' | 'synthesizing' | 'success'>('casting');
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  
  // Grinding state
  const lastAngleRef = useRef<number | null>(null);
  const totalRotationRef = useRef(0);
  
  // Pinch state
  const isPinchingRef = useRef(false);
  
  // Pulse state
  const pulseStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Randomly select a ritual type
    const types: RitualType[] = ['grinding', 'pinch', 'pulse'];
    setRitualType(types[Math.floor(Math.random() * types.length)]);
  }, []);

  const drawIrregularLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, color: string) => {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const segments = 8;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    const jitter = width * 0.5;

    ctx.moveTo(x1, y1);
    for (let i = 1; i < segments; i++) {
      const px = x1 + dx * i + (Math.random() - 0.5) * jitter;
      const py = y1 + dy * i + (Math.random() - 0.5) * jitter;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;
    
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Draw landmarks for feedback
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: 'rgba(34, 211, 238, 0.3)', lineWidth: 1 });
        drawLandmarks(canvasCtx, landmarks, { color: 'rgba(244, 114, 182, 0.5)', lineWidth: 1, radius: 2 });
      }
    }

    // Gesture Logic
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0 && status === 'casting') {
      const landmarks = results.multiHandLandmarks[0];
      
      if (ritualType === 'grinding') {
        // Index Finger Tip (8)
        const tip = landmarks[8];
        const centerX = 0.5;
        const centerY = 0.5;
        const angle = Math.atan2(tip.y - centerY, tip.x - centerX);
        
        if (lastAngleRef.current !== null) {
          let diff = angle - lastAngleRef.current;
          if (diff > Math.PI) diff -= 2 * Math.PI;
          if (diff < -Math.PI) diff += 2 * Math.PI;
          
          // Clockwise motion
          if (diff > 0) {
            totalRotationRef.current += diff;
            const rotations = totalRotationRef.current / (2 * Math.PI);
            const newProgress = Math.min(100, (rotations / 8) * 100);
            setProgress(newProgress);
            
            if (newProgress >= 100) {
              handleSynthesis();
            }
          }
        }
        lastAngleRef.current = angle;
      } 
      else if (ritualType === 'pinch') {
        const thumb = landmarks[4];
        const index = landmarks[8];
        const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
        
        const threshold = 0.04;
        if (dist < threshold && !isPinchingRef.current) {
          isPinchingRef.current = true;
          setComboCount(prev => {
            const next = prev + 1;
            if (next >= 10) handleSynthesis();
            return next;
          });
        } else if (dist > threshold * 2) {
          isPinchingRef.current = false;
        }
      } 
      else if (ritualType === 'pulse' && results.multiHandLandmarks.length >= 2) {
        const hand1 = results.multiHandLandmarks[0];
        const hand2 = results.multiHandLandmarks[1];
        
        const p1 = hand1[9];
        const p2 = hand2[9];
        
        const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        
        const baseWidth = 15;
        const lineWidth = Math.min(60, baseWidth * (1 / (dist + 0.05)));
        
        // Color transition: blue to white/purple
        const intensity = Math.min(1, 0.05 / (dist + 0.01));
        const color = intensity > 0.8 ? '#ffffff' : `hsla(${200 + intensity * 80}, 100%, ${70 + intensity * 30}%, 0.8)`;
        
        drawIrregularLine(
          canvasCtx, 
          p1.x * canvasRef.current.width, p1.y * canvasRef.current.height,
          p2.x * canvasRef.current.width, p2.y * canvasRef.current.height,
          lineWidth,
          color
        );

        const density = Math.min(100, (0.1 / (dist + 0.01)) * 100);
        setEnergyDensity(density);

        if (dist < 0.06) {
          if (!pulseStartTimeRef.current) pulseStartTimeRef.current = Date.now();
          const elapsed = Date.now() - pulseStartTimeRef.current;
          if (elapsed > 5000) {
            handleSynthesis();
          }
        } else {
          pulseStartTimeRef.current = null;
        }
      }
    }

    canvasCtx.restore();
  }, [ritualType, status]);

  const handleSynthesis = () => {
    setStatus('synthesizing');
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#22d3ee', '#f472b6', '#7c3aed', '#FFD700']
    });
    
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, 3000);
  };

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    let isRunning = true;
    const process = async () => {
      if (!webcamRef.current?.video || !isRunning) return;
      await hands.send({ image: webcamRef.current.video });
      if (isRunning) requestAnimationFrame(process);
    };

    const timer = setTimeout(() => {
      setIsInitialized(true);
      process();
    }, 1000);

    return () => {
      isRunning = false;
      hands.close();
      clearTimeout(timer);
    };
  }, [onResults]);

  const getInterpolatedColor = (p: number) => {
    // #808080 to #FFD700
    const r = Math.floor(128 + (255 - 128) * (p / 100));
    const g = Math.floor(128 + (215 - 128) * (p / 100));
    const b = Math.floor(128 + (0 - 128) * (p / 100));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-arcane-indigo flex overflow-hidden"
    >
      {/* Left Status Panel */}
      <div className="w-[25%] h-full glass-card border-r border-white/10 p-8 flex flex-col gap-8 relative z-10 bg-black/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-arcane-cyan" />
          <h2 className="text-lg font-serif italic neon-text-cyan">仪式状态</h2>
        </div>

        {ritualType === 'grinding' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-xs uppercase tracking-widest text-white/40">奥术纯度</span>
              <span className="text-2xl font-mono font-bold" style={{ color: getInterpolatedColor(progress) }}>
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-gray-500 to-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', bounce: 0 }}
              />
              {progress > 0 && (
                <motion.div 
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-white/20"
                />
              )}
            </div>
            {progress > 0 && (
              <motion.div 
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-center text-[10px] text-yellow-400/60 uppercase tracking-[0.2em]"
              >
                能量脉冲感应中...
              </motion.div>
            )}
          </div>
        )}

        {ritualType === 'pinch' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <span className="text-xs uppercase tracking-widest text-white/40">星尘连击</span>
              <span className="text-4xl font-mono font-bold text-arcane-pink neon-text-purple">
                {comboCount}
              </span>
            </div>
            
            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
              <motion.div 
                className="h-full bg-arcane-pink shadow-[0_0_15px_rgba(244,114,182,0.5)]"
                animate={{ width: `${(comboCount / 10) * 100}%` }}
              />
              {comboCount > 0 && (
                <motion.div 
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-white/20"
                />
              )}
            </div>

            <div className="space-y-4">
              <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", comboCount >= 3 ? "bg-arcane-cyan/10 border-arcane-cyan text-arcane-cyan" : "bg-white/5 border-white/5 text-white/20")}>
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">视觉发光</span>
              </div>
              <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", comboCount >= 5 ? "bg-arcane-pink/10 border-arcane-pink text-arcane-pink animate-pulse" : "bg-white/5 border-white/5 text-white/20")}>
                <Zap className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Power +50%</span>
              </div>
              <div className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all", comboCount >= 10 ? "bg-yellow-400/10 border-yellow-400 text-yellow-400" : "bg-white/5 border-white/5 text-white/20")}>
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">CRIT: +10086</span>
              </div>
            </div>
          </div>
        )}

        {ritualType === 'pulse' && (
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-white/40">能量密度仪表</span>
              <div className="relative w-40 h-40 rounded-full border-4 border-white/5 flex items-center justify-center">
                <motion.div 
                  className={cn("absolute w-1 h-16 origin-bottom rounded-full", energyDensity > 90 ? "bg-red-500" : "bg-arcane-cyan")}
                  style={{ bottom: '50%' }}
                  animate={{ rotate: (energyDensity / 100) * 180 - 90 }}
                />
                <div className={cn("text-xl font-mono", energyDensity > 90 ? "text-red-500" : "text-arcane-cyan")}>
                  {energyDensity.toFixed(0)}
                </div>
                {energyDensity > 90 && (
                  <div className="absolute inset-0 rounded-full border-4 border-red-500/50 animate-ping" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                <span>压缩等级</span>
                <span className={energyDensity > 90 ? "text-red-400" : "text-arcane-cyan"}>
                  {energyDensity > 90 ? 'CRITICAL' : 'STABLE'}
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className={cn("h-full", energyDensity > 90 ? "bg-red-500" : "bg-arcane-cyan")}
                  animate={{ width: `${energyDensity}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto">
          <button 
            onClick={onCancel}
            className="w-full py-3 border border-white/10 rounded-lg text-xs uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            中断仪式
          </button>
        </div>
      </div>

      {/* Central Casting Zone */}
      <div className={cn("w-[50%] h-full relative bg-black transition-all duration-500", comboCount >= 3 && ritualType === 'pinch' ? "brightness-125 contrast-110 blur-[0.5px]" : "")}>
        {!isInitialized && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-arcane-indigo">
            <Loader2 className="w-10 h-10 text-arcane-cyan animate-spin" />
            <p className="text-xs uppercase tracking-[0.3em] text-arcane-cyan/60">正在同步奥术视野...</p>
          </div>
        )}

        <Webcam
          ref={webcamRef}
          mirrored
          className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
          videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          width={1280}
          height={720}
        />

        {/* Instructions Overlay */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 text-center space-y-2 w-full px-4">
          <h3 className="text-xl font-serif italic text-white neon-text-cyan">
            {ritualType === 'grinding' && '魔法研磨：顺时针旋转指尖'}
            {ritualType === 'pinch' && '奥术撒粉：捏合指尖释放星尘'}
            {ritualType === 'pulse' && '元素激发：双手合拢压缩能量'}
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            {ritualType === 'grinding' && '需完成 8 次圆周运动以达到纯净状态'}
            {ritualType === 'pinch' && '连续捏合 10 次以触发终极共鸣'}
            {ritualType === 'pulse' && '保持双手极近距离 5 秒以激发能量'}
          </p>
        </div>

        <AnimatePresence>
          {status === 'synthesizing' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-[60] bg-black/60 backdrop-blur-md"
            >
              <div className="text-center space-y-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-24 h-24 border-t-4 border-arcane-cyan rounded-full mx-auto"
                />
                <h2 className="text-3xl font-serif italic text-white neon-text-cyan animate-pulse">
                  炼金秘术合成中...
                </h2>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                      className="w-2 h-2 bg-arcane-cyan rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'success' && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-[70] bg-arcane-cyan/10 backdrop-blur-sm"
          >
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-20 h-20 text-arcane-cyan mx-auto animate-bounce" />
              <h2 className="text-4xl font-serif italic text-white neon-text-cyan">仪式完成</h2>
              <p className="text-xs uppercase tracking-[0.4em] text-arcane-cyan">正在注入魔法能量...</p>
            </div>
          </motion.div>
        )}

        {/* Milestone Effects for Pinch */}
        {ritualType === 'pinch' && comboCount === 10 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-6xl font-black text-yellow-400 italic drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]"
            >
              CRIT: +10086
            </motion.div>
          </div>
        )}
      </div>

      {/* Right Status Panel */}
      <div className="w-[25%] h-full glass-card border-l border-white/10 p-8 flex flex-col gap-8 relative z-10 bg-black/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-6 h-6 text-arcane-pink" />
          <h2 className="text-lg font-serif italic neon-text-purple">环境监测</h2>
        </div>
        
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">以太浓度</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-arcane-pink"
                  animate={{ width: ['20%', '40%', '30%', '50%'] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                />
              </div>
              <span className="text-xs font-mono text-arcane-pink">HIGH</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">时空稳定性</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-arcane-cyan"
                  animate={{ width: ['90%', '85%', '95%', '88%'] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                />
              </div>
              <span className="text-xs font-mono text-arcane-cyan">92%</span>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 rounded-xl border border-arcane-cyan/20 bg-arcane-cyan/5 text-center">
          <p className="text-[10px] text-arcane-cyan/60 uppercase tracking-widest leading-relaxed">
            警告：施法过程中请勿离开奥术视野，否则可能导致炼金产物坍缩。
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CastingOverlay;
