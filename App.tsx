import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, TrendingUp, Calendar as CalendarIcon, Zap, Wallet, ArrowUpRight, ArrowDownRight, Target, Sun, Trophy, X } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { CumulativeChart, DailyBarChart, PayoutsChart } from './components/Charts';
import { EntryForm } from './components/EntryForm';
import { JournalEntry, TradingStats, AIAnalysisResult } from './types';
import { INITIAL_BALANCE, PROFIT_GOAL, MOCK_ANALYSIS_FALLBACK } from './constants';
import { generateCoachAnalysis } from './services/geminiService';

const Confetti: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
  
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      const particles: any[] = [];
      const particleCount = 150;
  
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 5 + 2,
          speedY: Math.random() * 3 + 2,
          speedX: Math.random() * 2 - 1,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
      }
  
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        particles.forEach((p) => {
          p.y += p.speedY;
          p.x += p.speedX;
  
          if (p.y > canvas.height) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
          }
  
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });
  
        requestAnimationFrame(animate);
      };
  
      animate();
  
      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    return <canvas ref={canvasRef} className="fixed inset-0 z-[200] pointer-events-none" />;
};

export default function App() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('trade_journal_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(() => {
    const saved = localStorage.getItem('trade_journal_analysis');
    return saved ? JSON.parse(saved) : null;
  });

  const [loadingAI, setLoadingAI] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    localStorage.setItem('trade_journal_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    if (analysis) {
        localStorage.setItem('trade_journal_analysis', JSON.stringify(analysis));
    }
  }, [analysis]);

  // Derived Statistics
  const stats: TradingStats = useMemo(() => {
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let cumulativePnL = 0;
    let totalPayouts = 0;
    let wins = 0;
    let loss = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let worstStreak = 0;

    const tradingDays = sortedEntries.filter(e => !e.isPayout);

    tradingDays.forEach(e => {
        cumulativePnL += e.pnl;
        
        if (e.pnl > 0) {
            wins++;
            if (currentStreak >= 0) currentStreak++;
            else currentStreak = 1;
            bestStreak = Math.max(bestStreak, currentStreak);
        } else if (e.pnl < 0) {
            loss++;
            if (currentStreak <= 0) currentStreak--;
            else currentStreak = -1;
            worstStreak = Math.min(worstStreak, currentStreak);
        }
    });

    entries.filter(e => e.isPayout).forEach(e => {
        totalPayouts += (e.payoutAmount || 0);
    });

    const currentBalance = INITIAL_BALANCE + cumulativePnL - totalPayouts;
    const winRate = tradingDays.length > 0 ? (wins / tradingDays.length) * 100 : 0;
    const dailyAverage = tradingDays.length > 0 ? cumulativePnL / tradingDays.length : 0;
    
    const remainingToGoal = PROFIT_GOAL - totalPayouts;
    const projectedDaysToGoal = dailyAverage > 0 ? Math.ceil(remainingToGoal / dailyAverage) : null;
    const profitGoalProgress = Math.min(100, Math.max(0, (totalPayouts / PROFIT_GOAL) * 100));

    return {
      currentBalance,
      cumulativePnL,
      winRate,
      dailyAverage,
      projectedDaysToGoal,
      bestStreak,
      worstStreak,
      totalPayouts,
      profitGoalProgress
    };
  }, [entries]);

  // Trigger celebration only once when goal is hit
  useEffect(() => {
    if (stats.totalPayouts >= PROFIT_GOAL && !showCelebration && localStorage.getItem('celebrated') !== 'true') {
        setShowCelebration(true);
        localStorage.setItem('celebrated', 'true');
    }
  }, [stats.totalPayouts, showCelebration]);

  const handleAddEntry = async (entry: JournalEntry) => {
    const newEntries = [...entries, entry];
    setEntries(newEntries);
    
    // Reset celebration state if user manually deletes entries or logs corrections (optional, simplified here)
    if (stats.totalPayouts < PROFIT_GOAL) {
        localStorage.removeItem('celebrated');
    }

    if (process.env.API_KEY && newEntries.length > 0) {
        setLoadingAI(true);
        try {
            const result = await generateCoachAnalysis(newEntries, {
                ...stats,
                cumulativePnL: stats.cumulativePnL + (entry.isPayout ? 0 : entry.pnl),
                currentBalance: stats.currentBalance + (entry.isPayout ? 0 : entry.pnl) - (entry.isPayout ? (entry.payoutAmount||0) : 0)
            });
            setAnalysis(result);
        } catch (e) {
            console.error("AI Analysis Failed", e);
        } finally {
            setLoadingAI(false);
        }
    } else if (newEntries.length === 1 && !analysis) {
        setAnalysis(MOCK_ANALYSIS_FALLBACK);
    }
  };

  const daysToSummer = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const summerStart = new Date(currentYear, 5, 21); // June 21st
    
    // If we passed June 21st, count to next year
    if (now > summerStart) {
        summerStart.setFullYear(currentYear + 1);
    }
    
    const diff = summerStart.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, []);

  const isGoalReached = stats.totalPayouts >= PROFIT_GOAL;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 selection:bg-emerald-500/30 font-sans">
      
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 text-center animate-in fade-in duration-500">
            <Confetti />
            <div className="relative z-[210] max-w-2xl">
                <div className="mb-6 inline-block p-6 rounded-full bg-emerald-500/10 border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-bounce">
                    <Trophy size={64} className="text-emerald-500" />
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6 tracking-tighter uppercase">
                    Mission Complete
                </h1>
                <p className="text-2xl text-zinc-300 font-medium mb-10 max-w-lg mx-auto">
                    You've officially withdrawn <span className="text-emerald-400 font-bold font-mono">${stats.totalPayouts.toLocaleString()}</span>. 
                    <br/>The garage is open. The car is yours.
                </p>
                <button 
                    onClick={() => setShowCelebration(false)}
                    className="bg-white text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    Back to Command Center
                </button>
            </div>
        </div>
      )}

      {/* Modern Glass Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-white to-zinc-400 text-zinc-950 p-2 rounded-lg shadow-lg shadow-white/10">
                <LayoutDashboard size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white leading-none">TradeCommand</h1>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">AI Journal</span>
            </div>
          </div>

          {/* Center: Summer Countdown */}
          <div className="hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2 group cursor-default">
             <div className="flex items-center gap-2 text-zinc-500 group-hover:text-amber-400 transition-colors duration-300">
                <Sun size={14} className="animate-[spin_10s_linear_infinite]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Summer Countdown</span>
             </div>
             <div className="text-2xl font-black text-white tracking-tighter tabular-nums flex items-baseline gap-1">
                {daysToSummer} <span className="text-sm font-bold text-zinc-600 font-sans">DAYS</span>
             </div>
          </div>

          {/* Right: Actions & Mini Progress */}
          <div className="flex items-center gap-6">
             <div className="hidden lg:flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1.5">
                    {/* UPDATED: Shows Total Payouts instead of Cumulative PnL */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                        ${stats.totalPayouts.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-bold">/</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        ${PROFIT_GOAL.toLocaleString()}
                    </span>
                </div>
                <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000"
                        style={{ width: `${stats.profitGoalProgress}%`}}
                    />
                </div>
             </div>
            <EntryForm onAdd={handleAddEntry} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Mobile Countdown (Visible only on small screens) */}
        <div className="md:hidden flex items-center justify-center gap-3 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
             <Sun size={18} className="text-amber-500" />
             <div className="text-sm font-bold text-zinc-300">
                <span className="text-white text-lg font-mono mr-1">{daysToSummer}</span> Days until Summer
             </div>
        </div>
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
                label="Account Balance" 
                value={`$${stats.currentBalance.toLocaleString()}`} 
                highlight 
            />
            <StatsCard 
                label="Cumulative P/L" 
                value={`$${stats.cumulativePnL.toLocaleString()}`}
                trend={stats.cumulativePnL >= 0 ? 'up' : 'down'}
                subValue={stats.cumulativePnL >= 0 ? 'In Profit' : 'Drawdown'}
            />
             <StatsCard 
                label="Daily Average" 
                value={`$${stats.dailyAverage.toFixed(2)}`}
                trend={stats.dailyAverage > 0 ? 'up' : 'down'}
                subValue="Per trading day"
            />
             <StatsCard 
                label="Win Rate" 
                value={`${stats.winRate.toFixed(1)}%`}
                subValue={`Best Streak: ${stats.bestStreak}`}
            />
        </div>

        {/* Charts & Coach Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Charts */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Mission Card */}
                <div className={`rounded-2xl p-6 text-white relative overflow-hidden border shadow-2xl transition-all duration-500 ${isGoalReached ? 'bg-emerald-950 border-emerald-500' : 'bg-gradient-to-br from-zinc-900 to-black border-zinc-800'}`}>
                    <div className={`absolute top-0 right-0 p-32 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 ${isGoalReached ? 'bg-emerald-400/20' : 'bg-emerald-500/10'}`}></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Target size={14} className={isGoalReached ? "text-white" : "text-emerald-500"} /> 
                                {isGoalReached ? "MISSION STATUS" : "Mission to $20k"}
                            </div>
                            <div className="text-emerald-500 text-xs font-mono font-bold">{stats.profitGoalProgress.toFixed(1)}%</div>
                        </div>
                        
                        {isGoalReached ? (
                            <div className="text-4xl font-black mb-1 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-white animate-pulse">
                                GOAL REACHED
                            </div>
                        ) : (
                            <div className="text-4xl font-bold mb-1 font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                                ${Math.max(0, PROFIT_GOAL - stats.totalPayouts).toLocaleString()}
                            </div>
                        )}
                        
                        <div className="text-zinc-500 text-xs mb-6 font-medium">
                            {isGoalReached ? "Congratulations, you made it." : "Remaining payouts needed"}
                        </div>
                        
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-3 border border-white/5">
                            <div className={`h-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.6)] ${isGoalReached ? 'bg-white' : 'bg-emerald-500'}`} style={{ width: `${stats.profitGoalProgress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                            <span>Start</span>
                            <span>Goal</span>
                        </div>
                    </div>
                </div>

                {/* Equity Curve (Performance Only) */}
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="font-bold text-white text-lg flex items-center gap-2">
                                <TrendingUp size={18} className="text-emerald-500" />
                                Performance Curve
                            </h2>
                            <p className="text-xs text-zinc-500 mt-1">Cumulative Profit/Loss (Excluding Payouts)</p>
                        </div>
                        {stats.projectedDaysToGoal && !isGoalReached && (
                            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                                <Target size={14} className="text-emerald-500" />
                                <span className="text-xs text-zinc-300 font-mono">
                                    ~{stats.projectedDaysToGoal} days to $20k
                                </span>
                            </div>
                        )}
                    </div>
                    {entries.length > 0 ? (
                        <CumulativeChart data={entries} />
                    ) : (
                         <div className="h-72 flex flex-col items-center justify-center text-zinc-600 gap-3 border-2 border-dashed border-zinc-800 rounded-xl">
                            <TrendingUp size={32} className="opacity-20" />
                            <span className="text-sm font-medium">Log your first trade to activate charts</span>
                         </div>
                    )}
                </div>

                {/* Payout Curve */}
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="font-bold text-white text-lg flex items-center gap-2">
                                <Wallet size={18} className="text-amber-500" />
                                Payout History
                            </h2>
                            <p className="text-xs text-zinc-500 mt-1">Total withdrawals over time</p>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-bold text-amber-500 font-mono">${stats.totalPayouts.toLocaleString()}</div>
                             <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Withdrawn</div>
                        </div>
                    </div>
                    {entries.some(e => e.isPayout) ? (
                        <PayoutsChart data={entries} />
                    ) : (
                         <div className="h-72 flex flex-col items-center justify-center text-zinc-600 gap-3 border-2 border-dashed border-zinc-800 rounded-xl">
                            <Wallet size={32} className="opacity-20" />
                            <span className="text-sm font-medium">No payouts recorded yet</span>
                         </div>
                    )}
                </div>

                {/* Recent Daily Performance */}
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
                    <div className="mb-8">
                        <h2 className="font-bold text-white text-lg flex items-center gap-2">
                            <CalendarIcon size={18} className="text-purple-500" />
                            Daily P/L
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">Last 14 active trading days</p>
                    </div>
                     {entries.length > 0 ? (
                        <DailyBarChart data={entries} />
                    ) : (
                        <div className="h-48 flex items-center justify-center text-zinc-600 text-sm border-2 border-dashed border-zinc-800 rounded-xl">
                            Waiting for data...
                        </div>
                    )}
                </div>

                 {/* Recent Ledger */}
                 <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                    <div className="p-5 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white text-sm">Recent Ledger</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-zinc-500 font-medium border-b border-white/5 text-xs uppercase tracking-wider bg-zinc-900/50">
                                <tr>
                                    <th className="px-5 py-4">Date</th>
                                    <th className="px-5 py-4">Type</th>
                                    <th className="px-5 py-4">Notes</th>
                                    <th className="px-5 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...entries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(entry => (
                                    <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-5 py-4 text-zinc-400 font-mono text-xs">{entry.date}</td>
                                        <td className="px-5 py-4">
                                            {entry.isPayout ? (
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                                                    <Wallet size={10} /> PAYOUT
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${entry.pnl >= 0 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'}`}>
                                                    {entry.pnl >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                                    TRADE
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-zinc-500 truncate max-w-[200px] group-hover:text-zinc-300 transition-colors">{entry.notes || '-'}</td>
                                        <td className={`px-5 py-4 text-right font-bold font-mono ${entry.isPayout ? 'text-amber-400' : (entry.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}`}>
                                            {entry.isPayout ? `-$${entry.payoutAmount}` : (entry.pnl >= 0 ? `+$${entry.pnl}` : `-$${Math.abs(entry.pnl)}`)}
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-12 text-center text-zinc-600 italic">No entries logged yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Right Column: Vibe & Coach */}
            <div className="space-y-6">
                
                {/* Countdown Card REMOVED FROM HERE */}

                {/* AI Vibe Report */}
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 shadow-lg overflow-hidden flex flex-col h-auto backdrop-blur-sm">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/80">
                         <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Zap size={16} className="text-amber-400 fill-amber-400" />
                            Hesh Vibe Report
                         </h3>
                         {loadingAI && <span className="text-xs text-emerald-400 animate-pulse font-mono">SCANNING...</span>}
                    </div>
                    
                    {analysis ? (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wider">Stoke Meter</div>
                                    <div className="text-sm font-bold text-white">{analysis.vibeReport.stokeMeter}</div>
                                </div>
                                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wider">Momentum</div>
                                    <div className="text-sm font-bold text-white font-mono">
                                        {analysis.vibeReport.momentumRating}<span className="text-zinc-600">/10</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wider">Mustang Progress 🏎️</div>
                                <p className="text-sm text-zinc-300 italic font-medium">{analysis.vibeReport.mustangProgress}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl">
                                    <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1 tracking-wider">Hype Line</div>
                                    <div className="text-sm text-emerald-100 font-bold">"{analysis.vibeReport.hypeLine}"</div>
                                </div>
                                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">Reality Check</div>
                                    <div className="text-sm text-zinc-300">"{analysis.vibeReport.realityCheck}"</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 text-center text-zinc-600 text-xs uppercase tracking-widest font-bold">
                            Log data to generate vibe
                        </div>
                    )}
                </div>

                {/* AI Coach Insights */}
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 shadow-lg overflow-hidden backdrop-blur-sm">
                    <div className="p-5 border-b border-white/5 bg-zinc-900/80">
                        <h3 className="font-bold text-white text-sm">Coach Insight</h3>
                    </div>
                    <div className="p-6">
                        {analysis ? (
                            <>
                                <p className="text-sm text-zinc-400 leading-relaxed mb-6 font-medium">
                                    {analysis.coachInsights}
                                </p>
                                <div className="border-t border-white/5 pt-5">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wider">Next Day Focus</div>
                                    <div className="font-bold text-white text-sm bg-zinc-800 inline-block px-3 py-1.5 rounded-lg border border-zinc-700">
                                        {analysis.nextFocus}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-zinc-600 text-xs italic text-center py-4">
                                Waiting for data...
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>

      </main>
    </div>
  );
}