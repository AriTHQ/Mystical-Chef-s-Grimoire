/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, UtensilsCrossed, Scroll, Flame, Clock, Wand2, ChefHat, Plus, Trash2, Dices } from 'lucide-react';
import { generateMagicalDish, MagicalDish } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CastingOverlay from './components/CastingOverlay';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 p-10 font-mono flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl mb-4">星辰陨落：奥术核心崩溃</h1>
          <p className="text-sm opacity-70 mb-8 max-w-2xl">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-red-500/30 rounded hover:bg-red-500/10 transition-all"
          >
            重试召唤
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COMMON_INGREDIENTS = [
  { name: '土豆', quantities: ['2个', '3个', '500克'] },
  { name: '洋葱', quantities: ['1个', '2个', '半个'] },
  { name: '牛肉', quantities: ['200克', '500克', '1斤'] },
  { name: '鸡蛋', quantities: ['2枚', '3枚', '5枚'] },
  { name: '胡萝卜', quantities: ['1根', '2根', '3根'] },
  { name: '西红柿', quantities: ['2个', '3个', '1个'] },
  { name: '大蒜', quantities: ['3瓣', '5瓣', '1头'] },
  { name: '生姜', quantities: ['1小块', '2片', '10克'] },
  { name: '辣椒', quantities: ['2根', '3根', '少许'] },
  { name: '蘑菇', quantities: ['100克', '200克', '1盒'] },
  { name: '蜂蜜', quantities: ['1勺', '2勺', '30克'] },
  { name: '柠檬', quantities: ['半个', '1个', '2片'] },
];

export default function App() {
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '' }]);
  const [loading, setLoading] = useState(false);
  const [dish, setDish] = useState<MagicalDish | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCasting, setShowCasting] = useState(false);

  const addIngredient = () => {
    if (ingredients.length < 4) {
      setIngredients([...ingredients, { name: '', quantity: '' }]);
    }
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngs = [...ingredients];
      newIngs.splice(index, 1);
      setIngredients(newIngs);
    }
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngs = [...ingredients];
    newIngs[index][field] = value;
    setIngredients(newIngs);
  };

  const randomizeIngredients = () => {
    const count = Math.floor(Math.random() * 4) + 1;
    const shuffled = [...COMMON_INGREDIENTS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count).map(ing => ({
      name: ing.name,
      quantity: ing.quantities[Math.floor(Math.random() * ing.quantities.length)]
    }));
    setIngredients(selected);
  };

  const handleMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
    if (validIngredients.length === 0) {
      setError('请至少完整输入一种食材及其数量。');
      return;
    }
    setShowCasting(true);
  };

  const startAlchemy = async () => {
    setShowCasting(false);
    const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
    setLoading(true);
    setError(null);
    try {
      const result = await generateMagicalDish(validIngredients);
      setDish(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '星辰紊乱，请再试一次。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="arcane-bg selection:bg-arcane-cyan/30 selection:text-arcane-cyan">
        <AnimatePresence>
          {showCasting && (
            <CastingOverlay 
              onComplete={startAlchemy} 
              onCancel={() => setShowCasting(false)} 
            />
          )}
        </AnimatePresence>
        {/* Background Decorations */}
        <div className="nebula" />
        <div className="sacred-geometry" />

        {/* Header */}
        <header className="relative z-10 pt-16 pb-12 text-center content-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-4 rounded-full glass-card mb-8"
          >
            <ChefHat className="w-10 h-10 neon-text-cyan" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl md:text-3xl neon-text-cyan mb-6 italic tracking-tighter"
          >
            Arcane Kitchen
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-purple-200/40 max-w-xl mx-auto font-light tracking-[0.3em] text-xs uppercase"
          >
            将平凡食材转化为星际奥术能量的深夜实验室
          </motion.p>
        </header>

        <main className="relative z-10 pb-32 content-container">
          {/* Input Section */}
          <section className="mb-16">
            <form onSubmit={handleMagic} className="relative">
              <div className="glass-card p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-arcane-cyan/60" />
                    <label className="block text-xs uppercase tracking-[0.3em] text-arcane-cyan/60 font-bold">
                      平凡食材注入 (最多4种)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={randomizeIngredients}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-arcane-cyan/40 hover:text-arcane-cyan transition-colors"
                  >
                    <Dices className="w-3 h-3" />
                    随机注入
                  </button>
                </div>

                <div className="space-y-4 mb-8">
                  {ingredients.map((ing, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4"
                    >
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                        placeholder="食材名称"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-serif italic text-purple-100 focus:border-arcane-cyan/50 focus:ring-0 transition-all"
                      />
                      <input
                        type="text"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                        placeholder="数量"
                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-serif italic text-purple-100 focus:border-arcane-cyan/50 focus:ring-0 transition-all"
                      />
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(idx)}
                          className="p-2 text-red-400/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  {ingredients.length < 4 ? (
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-arcane-cyan/60 hover:text-arcane-cyan transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      增加组分
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "group relative flex items-center gap-3 px-10 py-4 rounded-lg transition-all duration-700 font-bold tracking-[0.2em] uppercase text-xs overflow-hidden",
                      loading 
                        ? "bg-purple-900/20 text-purple-400/50 cursor-not-allowed border border-purple-500/10" 
                        : "bg-transparent text-arcane-cyan border border-arcane-cyan/30 hover:border-arcane-cyan hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] active:scale-95"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-arcane-cyan/0 via-arcane-cyan/5 to-arcane-cyan/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {loading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        正在提取奥术能量...
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4 group-hover:animate-bounce" />
                        启动炼金仪式
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-red-400/80 text-center mt-6 text-xs font-mono tracking-widest uppercase"
              >
                [ Error: {error} ]
              </motion.p>
            )}
          </section>

          {/* Result Section */}
          <AnimatePresence mode="wait">
            {dish && (
              <motion.div
                key={dish.dishName}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12"
              >
                {/* Dish Title */}
                <div className="text-center space-y-4">
                  <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-arcane-cyan/30 to-transparent mx-auto" />
                  <h2 className="font-serif text-xl md:text-2xl neon-text-cyan italic py-6 tracking-tighter">
                    {dish.dishName}
                  </h2>
                  <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-arcane-cyan/30 to-transparent mx-auto" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Ingredients List */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-8 rounded-[8px]"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-2 rounded-lg bg-arcane-cyan/10">
                        <UtensilsCrossed className="w-5 h-5 text-arcane-cyan neon-icon-gradient" />
                      </div>
                      <h3 className="text-xs uppercase tracking-[0.3em] font-black text-arcane-cyan/80">奥术组分</h3>
                    </div>
                    <ul className="space-y-6">
                      {dish.ingredients.map((ing, i) => (
                        <li key={i} className="flex flex-col border-b border-arcane-stroke pb-4 group">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{ing.visualIcon}</span>
                            <span className="font-serif text-base text-purple-100 italic group-hover:neon-text-purple transition-all duration-300">{ing.magicalName}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[9px] text-purple-100/30 font-mono uppercase tracking-widest">
                              {ing.originalName}
                            </span>
                            <span className="text-[9px] text-arcane-cyan/60 font-mono">
                              {ing.quantity}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Ritual Steps */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-8 rounded-[8px] lg:col-span-2 relative overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 opacity-[0.02] pointer-events-none">
                      <Scroll className="w-64 h-64 text-arcane-cyan" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-2 rounded-lg bg-arcane-pink/10">
                        <Flame className="w-5 h-5 text-arcane-pink neon-icon-gradient" />
                      </div>
                      <h3 className="text-xs uppercase tracking-[0.3em] font-black text-arcane-pink/80">炼金仪式</h3>
                    </div>

                    <div className="space-y-10 relative">
                      {dish.ritualSteps.map((step, i) => (
                        <div key={i} className="flex gap-8 group">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full border border-arcane-cyan/20 flex items-center justify-center text-arcane-cyan font-mono text-xs group-hover:border-arcane-cyan group-hover:bg-arcane-cyan/5 transition-all duration-500">
                            0{i + 1}
                          </div>
                          <p className="font-serif text-base text-purple-100/80 italic leading-relaxed pt-1">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Magical Effects - Full Width on Grid */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-10 rounded-[8px] md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center justify-between gap-12"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-2 rounded-lg bg-arcane-glow/10">
                          <Sparkles className="w-6 h-6 text-arcane-glow neon-icon-gradient" />
                        </div>
                        <h3 className="text-xs uppercase tracking-[0.3em] font-black text-arcane-glow/80">奥术共鸣效果</h3>
                      </div>
                      <p className="font-serif text-lg text-purple-100 italic leading-snug">
                        {dish.magicalEffect.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-center md:items-end gap-3 min-w-[200px]">
                      <div className="flex items-center gap-3 text-arcane-cyan/40">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-[0.4em] font-black">能量半衰期</span>
                      </div>
                      <span className="text-arcane-cyan font-mono text-xl tracking-tighter neon-text-cyan">{dish.magicalEffect.duration}</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!dish && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 opacity-10"
            >
              <Scroll className="w-16 h-16 mx-auto mb-6" />
              <p className="font-serif italic text-lg tracking-widest">奥术食谱静待平凡食材的注入...</p>
            </motion.div>
          )}
        </main>

        {/* Floating Energy Spheres */}
        <div className="fixed top-1/4 left-10 w-32 h-32 bg-arcane-glow/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="fixed bottom-1/4 right-10 w-48 h-48 bg-arcane-cyan/5 blur-[120px] rounded-full pointer-events-none" />
      </div>
    </ErrorBoundary>
  );
}
