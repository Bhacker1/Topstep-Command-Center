export interface JournalEntry {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  pnl: number;
  notes?: string;
  setup?: string;
  isPayout?: boolean;
  payoutAmount?: number;
}

export interface TradingStats {
  currentBalance: number;
  cumulativePnL: number;
  winRate: number;
  dailyAverage: number;
  projectedDaysToGoal: number | null;
  bestStreak: number;
  worstStreak: number;
  totalPayouts: number;
  profitGoalProgress: number; // 0 to 100
}

export interface AIAnalysisResult {
  vibeReport: {
    stokeMeter: string;
    mustangProgress: string;
    momentumRating: string;
    hypeLine: string;
    realityCheck: string;
  };
  coachInsights: string;
  nextFocus: string;
}
