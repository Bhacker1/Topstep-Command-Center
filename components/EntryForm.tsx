import React, { useState } from 'react';
import { PlusCircle, X, ArrowUpRight, Wallet } from 'lucide-react';
import { JournalEntry } from '../types';

interface EntryFormProps {
  onAdd: (entry: JournalEntry) => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'trade' | 'payout'>('trade');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const val = parseFloat(amount);
    const isPayout = activeTab === 'payout';

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      date,
      pnl: isPayout ? 0 : val,
      payoutAmount: isPayout ? Math.abs(val) : undefined,
      isPayout,
      notes
    };

    onAdd(newEntry);
    setIsOpen(false);
    setAmount('');
    setNotes('');
    setActiveTab('trade');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-white text-zinc-950 px-5 py-2.5 rounded-full hover:bg-zinc-200 transition-all font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
      >
        <PlusCircle size={16} />
        <span className="hidden sm:inline">Log Activity</span>
        <span className="sm:hidden">Log</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" 
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85dvh] my-auto ring-1 ring-white/10">
         
         {/* Header */}
         <div className="flex-none flex items-center justify-between p-6 pb-2 bg-zinc-900 z-10">
            <h2 className="text-xl font-bold text-white tracking-tight">Log Activity</h2>
            <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
         </div>

         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Tabs */}
            <div className="px-6 pt-4 pb-6 sticky top-0 bg-zinc-900 z-10">
                <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('trade')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'trade' 
                            ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' 
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                    >
                        <ArrowUpRight size={16} className={activeTab === 'trade' ? 'text-emerald-500' : ''} />
                        Trade P/L
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('payout')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'payout' 
                            ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' 
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                    >
                        <Wallet size={16} className={activeTab === 'payout' ? 'text-amber-500' : ''} />
                        Payout
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-6">
                
                {/* Amount Input */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        {activeTab === 'trade' ? 'Daily Net P/L' : 'Withdrawal Amount'}
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <span className={`text-2xl font-mono ${
                                amount && activeTab === 'trade' 
                                    ? (parseFloat(amount) >= 0 ? 'text-emerald-500' : 'text-rose-500')
                                    : 'text-zinc-600'
                            }`}>$</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            autoFocus
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-10 pr-4 text-3xl font-mono font-bold text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Date Input */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        Date
                    </label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
                    />
                </div>

                {/* Notes Input */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                        {activeTab === 'trade' ? 'Session Notes' : 'Payout Notes'}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={activeTab === 'trade' ? "Setups taken? Emotions? Mistakes?" : "What are you doing with the money?"}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all placeholder:text-zinc-700"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className={`w-full py-4 rounded-xl font-bold text-black text-sm uppercase tracking-wide transition-all transform active:scale-[0.98] shadow-lg ${
                        activeTab === 'trade'
                        ? 'bg-white hover:bg-zinc-200 shadow-white/10'
                        : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                    }`}
                >
                    {activeTab === 'trade' ? 'Log Trading Day' : 'Record Payout'}
                </button>

            </form>
         </div>

      </div>
    </div>
  );
};