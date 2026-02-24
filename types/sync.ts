export interface SyncStatus {
  status: 'idle' | 'in_progress' | 'completed' | 'failed' | 'never_synced';
  lastCompletedAt: string | null;   // ISO8601
  nextDueAt: string | null;         // ISO8601
  daysUntilNextSync: number | null; // negative = overdue
  wordsTotal: number;
  wordsCompleted: number;
  percentage: number;
  errorMessage: string | null;
}
