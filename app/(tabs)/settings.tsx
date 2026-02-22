import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { KidButton } from '../../components/KidButton';
import { offlineStorageService } from '../../services/offlineStorageService';
import { offlineDownloadService, DownloadProgress } from '../../services/offlineDownloadService';
import { pronunciationService } from '../../services/pronunciationService';
import { connectionTestService } from '../../services/connectionTestService';
import { Volume2, Calendar, Info, BookOpen, Download, Trash2, HardDrive, Activity } from 'lucide-react-native';

export default function SettingsScreen() {
  const [wordCount, setWordCount] = useState(0);
  const [pronunciationSpeed, setPronunciationSpeed] = useState(0.75);
  const [downloadStatus, setDownloadStatus] = useState({
    isDownloaded: false,
    totalWords: 10000,
    downloadedWords: 0,
    version: '1.0',
    lastDownloadDate: undefined as string | undefined,
  });
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [storageSize, setStorageSize] = useState('0 B');

  useEffect(() => {
    loadSettings();
    offlineDownloadService.setProgressCallback(handleProgressUpdate);
  }, []);

  const handleProgressUpdate = (progress: DownloadProgress) => {
    setDownloadProgress(progress);
  };

  const loadSettings = async () => {
    try {
      const cachedWords = await offlineStorageService.getAllCachedWords();
      setWordCount(cachedWords.length);

      const speed = pronunciationService.getSpeed();
      setPronunciationSpeed(speed);

      const status = await offlineDownloadService.getDownloadStatus();
      setDownloadStatus({
        ...status,
        lastDownloadDate: status.lastDownloadDate || undefined,
      });

      const size = await offlineDownloadService.getStorageSize();
      setStorageSize(offlineDownloadService.formatStorageSize(size));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSpeedChange = (speed: number) => {
    pronunciationService.setSpeed(speed);
    setPronunciationSpeed(speed);
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear all search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineStorageService.clearSearchHistory();
              Alert.alert('Success', 'Search history cleared!');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  const handleStartDownload = async () => {
    Alert.alert(
      'Download Dictionary',
      'This will download 10,000 common words with translations for offline use. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            const success = await offlineDownloadService.startDownload();
            if (success) {
              await loadSettings();
              Alert.alert('Success', 'Dictionary downloaded successfully!');
            } else {
              Alert.alert('Error', 'Failed to download dictionary. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteOfflineData = async () => {
    Alert.alert(
      'Delete Offline Data',
      'This will remove all downloaded dictionary data. You can re-download it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineDownloadService.deleteOfflineData();
              await loadSettings();
              Alert.alert('Success', 'Offline data deleted!');
            } catch (error) {
              console.error('Error deleting data:', error);
              Alert.alert('Error', 'Failed to delete offline data');
            }
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Offline Cache',
      'This will remove all offline words. They will be re-downloaded when you search for them again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineStorageService.clearAllData();
              await loadSettings();
              Alert.alert('Success', 'Offline cache cleared!');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleRunDiagnostics = async () => {
    Alert.alert(
      'Running Diagnostics',
      'Testing database connection...',
      [],
      { cancelable: false }
    );

    const result = await connectionTestService.runFullDiagnostics();

    const status = result.environmentCheck && result.connectionCheck && result.insertCheck
      ? 'All tests passed!'
      : 'Some tests failed';

    const message = result.messages.join('\n');

    Alert.alert(
      'Diagnostic Results',
      `${status}\n\n${message}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your dictionary</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Offline Dictionary</Text>
          </View>

          <View style={styles.downloadCard}>
            <View style={styles.downloadInfo}>
              <Text style={styles.downloadTitle}>Download for Offline Use</Text>
              <Text style={styles.downloadDescription}>
                Download 10,000 common words with definitions, translations, and pronunciation for full offline access.
              </Text>
            </View>

            {downloadStatus.isDownloaded ? (
              <View style={styles.downloadedContainer}>
                <View style={styles.downloadStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{downloadStatus.downloadedWords.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Words</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{storageSize}</Text>
                    <Text style={styles.statLabel}>Storage</Text>
                  </View>
                  {downloadStatus.lastDownloadDate && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {new Date(downloadStatus.lastDownloadDate).toLocaleDateString()}
                      </Text>
                      <Text style={styles.statLabel}>Downloaded</Text>
                    </View>
                  )}
                </View>
                <KidButton
                  title="Delete Offline Data"
                  onPress={handleDeleteOfflineData}
                  variant="warning"
                  size="small"
                  icon={<Trash2 size={18} color="#fff" />}
                />
              </View>
            ) : (
              <View>
                {downloadProgress?.isDownloading ? (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressText}>Downloading...</Text>
                      <Text style={styles.progressPercentage}>{downloadProgress.percentage}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${downloadProgress.percentage}%` }]}
                      />
                    </View>
                    <Text style={styles.progressDetail}>
                      {downloadProgress.current.toLocaleString()} / {downloadProgress.total.toLocaleString()} words
                    </Text>
                    {downloadProgress.currentWord && (
                      <Text style={styles.currentWord}>Current: {downloadProgress.currentWord}</Text>
                    )}
                  </View>
                ) : (
                  <KidButton
                    title="Start Download"
                    onPress={handleStartDownload}
                    variant="primary"
                    size="medium"
                    icon={<Download size={20} color="#fff" />}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Cache Storage</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cached Words</Text>
            <Text style={styles.infoValue}>{wordCount.toLocaleString()}</Text>
          </View>

          <View style={styles.syncInfo}>
            <Info size={16} color="#666" />
            <Text style={styles.syncInfoText}>
              Words are automatically cached when you search for them. This allows you to access them even when offline!
            </Text>
          </View>

          <KidButton
            title="Clear Cache"
            onPress={handleClearCache}
            variant="warning"
            size="medium"
            style={styles.actionButton}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Volume2 size={24} color="#4ECDC4" />
            <Text style={styles.sectionTitle}>Pronunciation Speed</Text>
          </View>

          <View style={styles.speedOptions}>
            <TouchableOpacity
              style={[
                styles.speedButton,
                pronunciationSpeed === 0.5 && styles.speedButtonActive,
              ]}
              onPress={() => handleSpeedChange(0.5)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  pronunciationSpeed === 0.5 && styles.speedButtonTextActive,
                ]}
              >
                Slow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.speedButton,
                pronunciationSpeed === 0.75 && styles.speedButtonActive,
              ]}
              onPress={() => handleSpeedChange(0.75)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  pronunciationSpeed === 0.75 && styles.speedButtonTextActive,
                ]}
              >
                Normal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.speedButton,
                pronunciationSpeed === 1.0 && styles.speedButtonActive,
              ]}
              onPress={() => handleSpeedChange(1.0)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  pronunciationSpeed === 1.0 && styles.speedButtonTextActive,
                ]}
              >
                Fast
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color="#FFD93D" />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <KidButton
            title="Clear Search History"
            onPress={handleClearHistory}
            variant="warning"
            size="medium"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={24} color="#9C27B0" />
            <Text style={styles.sectionTitle}>Diagnostics</Text>
          </View>

          <View style={styles.syncInfo}>
            <Info size={16} color="#666" />
            <Text style={styles.syncInfoText}>
              Run diagnostics to check if the app can connect to the database and create profiles.
            </Text>
          </View>

          <KidButton
            title="Run Connection Test"
            onPress={handleRunDiagnostics}
            variant="primary"
            size="medium"
            icon={<Activity size={20} color="#fff" />}
          />
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>Kidopedia</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDescription}>
            A fun learning app powered by Google Dictionary API with offline support. Search for any word and get comprehensive definitions, examples, synonyms, and more!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    backgroundColor: '#66BB6A',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.95,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  syncInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 4,
  },
  speedOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  speedButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  speedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  speedButtonTextActive: {
    color: '#FFFFFF',
  },
  aboutSection: {
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  downloadCard: {
    gap: 16,
  },
  downloadInfo: {
    gap: 8,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  downloadDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  downloadedContainer: {
    gap: 16,
  },
  downloadStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    gap: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  currentWord: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
