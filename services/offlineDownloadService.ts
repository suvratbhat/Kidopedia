import { syncService } from './syncService';
import { sqliteService } from './sqliteService';
import { SyncStatus } from '@/types/sync';

export interface DownloadProgress {
  current: number;
  total: number;
  percentage: number;
  isDownloading: boolean;
  currentWord?: string;
}

export interface DownloadStatus {
  isDownloaded: boolean;
  totalWords: number;
  downloadedWords: number;
  version: string;
  lastDownloadDate: string | null;
}

class OfflineDownloadService {
  private progressCallback: ((progress: DownloadProgress) => void) | null = null;

  setProgressCallback(callback: (progress: DownloadProgress) => void): void {
    this.progressCallback = callback;
  }

  onProgress(callback: (progress: DownloadProgress) => void): () => void {
    this.progressCallback = callback;
    return () => { this.progressCallback = null; };
  }

  private toDownloadProgress(status: SyncStatus): DownloadProgress {
    return {
      current: status.wordsCompleted,
      total: status.wordsTotal,
      percentage: status.percentage,
      isDownloading: status.status === 'in_progress',
    };
  }

  async startDownload(): Promise<boolean> {
    try {
      await syncService.forceSync((status: SyncStatus) => {
        this.progressCallback?.(this.toDownloadProgress(status));
      });
      return true;
    } catch (error) {
      console.error('[OfflineDownloadService] startDownload failed:', error);
      return false;
    }
  }

  async getDownloadStatus(): Promise<DownloadStatus> {
    const syncStatus = await syncService.getSyncStatus();
    const wordCount = await sqliteService.getWordCount();
    return {
      isDownloaded: syncStatus.status === 'completed' && wordCount > 0,
      totalWords: syncStatus.wordsTotal > 0 ? syncStatus.wordsTotal : wordCount,
      downloadedWords: wordCount,
      version: '1.0',
      lastDownloadDate: syncStatus.lastCompletedAt,
    };
  }

  async getStorageSize(): Promise<number> {
    // Estimate ~500 bytes per word in SQLite
    const count = await sqliteService.getWordCount();
    return count * 500;
  }

  formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async deleteOfflineData(): Promise<void> {
    await sqliteService.clearAllWords();
    await sqliteService.setSyncMeta('sync_status', 'never_synced');
    await sqliteService.setSyncMeta('last_full_sync_completed_at', '');
    await sqliteService.setSyncMeta('next_sync_due_at', '');
    await sqliteService.setSyncMeta('sync_last_offset', '0');
    await sqliteService.setSyncMeta('sync_words_completed', '0');
    await sqliteService.setSyncMeta('sync_words_total', '0');
    await sqliteService.setSyncMeta('initial_setup_complete', '');
  }

  isDownloading(): boolean {
    return false;
  }

  async getDownloadedWordsCount(): Promise<number> {
    return sqliteService.getWordCount();
  }

  async clearDownloadedWords(): Promise<void> {
    await this.deleteOfflineData();
  }
}

export const offlineDownloadService = new OfflineDownloadService();
