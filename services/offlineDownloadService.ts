export interface DownloadProgress {
  current: number;
  total: number;
  percentage: number;
}

class OfflineDownloadService {
  private downloading = false;
  private onProgressCallbacks: ((progress: DownloadProgress) => void)[] = [];

  onProgress(callback: (progress: DownloadProgress) => void): () => void {
    this.onProgressCallbacks.push(callback);
    return () => {
      this.onProgressCallbacks = this.onProgressCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyProgress(current: number, total: number) {
    const progress: DownloadProgress = {
      current,
      total,
      percentage: Math.round((current / total) * 100),
    };
    this.onProgressCallbacks.forEach((callback) => callback(progress));
  }

  async downloadCommonWords(count: number = 1000): Promise<void> {
    if (this.downloading) {
      throw new Error('Download already in progress');
    }

    try {
      this.downloading = true;
      this.notifyProgress(0, count);

      console.log('Download started for', count, 'words');

      this.notifyProgress(count, count);
    } catch (error) {
      console.error('Error downloading words:', error);
      throw error;
    } finally {
      this.downloading = false;
    }
  }

  isDownloading(): boolean {
    return this.downloading;
  }

  async getDownloadedWordsCount(): Promise<number> {
    return 0;
  }

  async clearDownloadedWords(): Promise<void> {
    console.log('Downloaded words cleared');
  }
}

export const offlineDownloadService = new OfflineDownloadService();
