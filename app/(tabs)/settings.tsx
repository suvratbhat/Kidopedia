import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';
import { KidButton } from '../../components/KidButton';
import ProfileCard from '../../components/ProfileCard';
import { offlineStorageService } from '../../services/offlineStorageService';
import { offlineDownloadService, DownloadProgress } from '../../services/offlineDownloadService';
import { syncService } from '../../services/syncService';
import { pronunciationService } from '../../services/pronunciationService';
import { connectionTestService } from '../../services/connectionTestService';
import { avatarService } from '../../services/avatarService';
import { notificationService } from '../../services/notificationService';
import { useProfile } from '../../contexts/ProfileContext';
import { KidProfile } from '../../types/profile';
import { SyncStatus } from '../../types/sync';
import {
  Volume2, Calendar, Info, BookOpen, Download, Trash2,
  Activity, RefreshCw, XCircle, Users, Plus, User, Shuffle, Check, Bell
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { profiles, activeProfile, createProfile, updateProfile, deleteProfile, setActiveProfile } = useProfile();
  
  // Profile Form State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<KidProfile | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl' | 'other'>('boy');
  const [selectedColor, setSelectedColor] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  const [wordCount, setWordCount] = useState(0);
  const [pronunciationSpeed, setPronunciationSpeed] = useState(0.75);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState({
    isDownloaded: false,
    totalWords: 10000,
    downloadedWords: 0,
    version: '1.0',
    lastDownloadDate: undefined as string | undefined,
  });
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [storageSize, setStorageSize] = useState('0 B');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    loadSettings();
    offlineDownloadService.setProgressCallback(handleProgressUpdate);
  }, []);

  useEffect(() => {
    if (showProfileModal) {
      updateAvatarForGender(gender);
    }
  }, [gender, showProfileModal]);

  const updateAvatarForGender = (newGender: 'boy' | 'girl' | 'other') => {
    const colors = avatarService.getColorPalette(newGender);
    setAvailableColors(colors);
    if (!selectedColor || !colors.includes(selectedColor)) {
      setSelectedColor(avatarService.getRandomColor(newGender));
    }
    if (!avatarUrl) {
      setAvatarUrl(avatarService.getRandomAvatarUrl(newGender));
    }
  };

  const generateNewAvatar = () => {
    setAvatarUrl(avatarService.getRandomAvatarUrl(gender));
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!age || parseInt(age) < 2 || parseInt(age) > 18) {
      Alert.alert('Error', 'Please enter a valid age (2-18)');
      return;
    }

    try {
      if (editingProfile) {
        await updateProfile(editingProfile.id, {
          name: name.trim(),
          age: parseInt(age),
          gender,
          avatar_color: selectedColor,
          avatar_url: avatarUrl,
        });
      } else {
        if (profiles.length >= 4) {
          Alert.alert('Limit Reached', 'You can have up to 4 profiles per account.');
          return;
        }
        await createProfile({
          name: name.trim(),
          age: parseInt(age),
          gender,
          avatar_color: selectedColor,
          avatar_url: avatarUrl,
        });
      }
      setShowProfileModal(false);
      resetProfileForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
      console.error(error);
    }
  };

  const resetProfileForm = () => {
    setName('');
    setAge('');
    setGender('boy');
    setSelectedColor('');
    setAvatarUrl('');
    setEditingProfile(null);
  };

  const openAddProfile = () => {
    resetProfileForm();
    setShowProfileModal(true);
  };

  const openEditProfile = (profile: KidProfile) => {
    setEditingProfile(profile);
    setName(profile.name);
    setAge(profile.age.toString());
    setGender(profile.gender);
    setSelectedColor(profile.avatar_color);
    setAvatarUrl(profile.avatar_url || '');
    setAvailableColors(avatarService.getColorPalette(profile.gender));
    setShowProfileModal(true);
  };

  const handleDeleteProfile = (profile: KidProfile) => {
    if (profiles.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one profile.');
      return;
    }

    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${profile.name}'s profile? All progress will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(profile.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

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

      const speed = pronunciationService.getRate();
      setPronunciationSpeed(speed);

      const status = await offlineDownloadService.getDownloadStatus();
      setDownloadStatus({
        ...status,
        lastDownloadDate: status.lastDownloadDate || undefined,
      });

      const size = await offlineDownloadService.getStorageSize();
      setStorageSize(offlineDownloadService.formatStorageSize(size));

      const sync = await syncService.getSyncStatus();
      setSyncStatus(sync);

      const notifyEnabled = await notificationService.isNotificationsEnabled();
      setNotificationsEnabled(notifyEnabled);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleToggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    await notificationService.setNotificationsEnabled(newValue);
    setNotificationsEnabled(newValue);
    if (newValue) {
      Alert.alert('Notifications Enabled', 'You will receive a fresh word every morning at 8:00 AM!');
    }
  };

  // ── Sync handlers ────────────────────────────────────────────────────────────

  const handleSyncNow = () => {
    syncService.forceSync((status) => {
      setSyncStatus(status);
    }).then(() => loadSettings()).catch((err) => {
      console.error('[Settings] Sync failed:', err);
      syncService.getSyncStatus().then(setSyncStatus).catch(() => {});
    });
  };

  const handleCancelSync = () => {
    syncService.cancelSync();
  };

  // ── Download handlers ────────────────────────────────────────────────────────

  const handleSpeedChange = (speed: number) => {
    pronunciationService.setRate(speed);
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
      'This will download common words with translations for offline use. This may take a few minutes.',
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

  // ── Sync status helpers ──────────────────────────────────────────────────────

  const isSyncing = syncStatus?.status === 'in_progress';

  const getSyncBadgeStyle = () => {
    if (!syncStatus) return styles.badgeNeutral;
    switch (syncStatus.status) {
      case 'completed': return styles.badgeGreen;
      case 'in_progress': return styles.badgeBlue;
      case 'failed': return styles.badgeRed;
      default: return styles.badgeNeutral;
    }
  };

  const getSyncBadgeText = () => {
    if (!syncStatus) return 'Unknown';
    if (syncStatus.status === 'in_progress') return 'Syncing…';
    if (syncStatus.status === 'completed') {
      if (syncStatus.daysUntilNextSync !== null && syncStatus.daysUntilNextSync < 0) return 'Overdue';
      return 'Up to date';
    }
    if (syncStatus.status === 'failed') return 'Failed';
    return 'Never synced';
  };

  const getSyncScheduleText = () => {
    if (!syncStatus?.daysUntilNextSync) return null;
    const days = syncStatus.daysUntilNextSync;
    if (days < 0) return { text: `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`, overdue: true };
    if (days === 0) return { text: 'Sync due today', overdue: true };
    return { text: `Next sync in ${days} day${days !== 1 ? 's' : ''}`, overdue: false };
  };

  const scheduleInfo = getSyncScheduleText();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your dictionary</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Kid Profiles ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Kid Profiles</Text>
            {profiles.length < 4 && (
              <TouchableOpacity style={styles.addSmallButton} onPress={openAddProfile}>
                <Plus size={20} color="#6366F1" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.profileList}>
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isActive={activeProfile?.id === profile.id}
                onSelect={setActiveProfile}
                onEdit={openEditProfile}
                onDelete={handleDeleteProfile}
              />
            ))}
          </View>

          {profiles.length < 4 && (
            <KidButton
              title="Add Profile"
              onPress={openAddProfile}
              variant="secondary"
              size="medium"
              icon={<Plus size={20} color="#6366F1" />}
            />
          )}
          <Text style={styles.limitHint}>Manage up to 4 profiles per account</Text>
        </View>

        {/* ── Dictionary Sync ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RefreshCw size={24} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Dictionary Sync</Text>
          </View>

          <View style={styles.syncRow}>
            <View style={[styles.badge, getSyncBadgeStyle()]}>
              <Text style={styles.badgeText}>{getSyncBadgeText()}</Text>
            </View>
            {syncStatus?.lastCompletedAt && (
              <Text style={styles.syncMeta}>
                Last synced: {new Date(syncStatus.lastCompletedAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          {scheduleInfo && (
            <Text style={[styles.syncSchedule, scheduleInfo.overdue && styles.syncScheduleOverdue]}>
              {scheduleInfo.text}
            </Text>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Words downloaded</Text>
            <Text style={styles.infoValue}>
              {(syncStatus?.wordsTotal > 0 ? syncStatus.wordsTotal : wordCount).toLocaleString()}
            </Text>
          </View>

          {isSyncing && (
            <View style={styles.syncProgressContainer}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>Syncing words…</Text>
                <Text style={styles.progressPercentage}>{syncStatus?.percentage ?? 0}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${syncStatus?.percentage ?? 0}%` }]}
                />
              </View>
              <Text style={styles.progressDetail}>
                {syncStatus?.wordsCompleted.toLocaleString()} / {syncStatus?.wordsTotal.toLocaleString()} words
              </Text>
            </View>
          )}

          <View style={styles.syncActions}>
            {!isSyncing ? (
              <KidButton
                title="Sync Now"
                onPress={handleSyncNow}
                variant="primary"
                size="medium"
                icon={<RefreshCw size={20} color="#fff" />}
              />
            ) : (
              <KidButton
                title="Cancel Sync"
                onPress={handleCancelSync}
                variant="secondary"
                size="medium"
                icon={<XCircle size={20} color="#fff" />}
              />
            )}
          </View>
        </View>

        {/* ── Offline Dictionary ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Offline Dictionary</Text>
          </View>

          <View style={styles.downloadCard}>
            <View style={styles.downloadInfo}>
              <Text style={styles.downloadTitle}>Download for Offline Use</Text>
              <Text style={styles.downloadDescription}>
                Download common words with definitions, translations, and pronunciation for full offline access.
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
                  variant="secondary"
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

        {/* ── Cache Storage ────────────────────────────────────────────────── */}
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
            variant="secondary"
            size="medium"
          />
        </View>

        {/* ── Pronunciation Speed ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Volume2 size={24} color="#4ECDC4" />
            <Text style={styles.sectionTitle}>Pronunciation Speed</Text>
          </View>

          <View style={styles.speedOptions}>
            <TouchableOpacity
              style={[styles.speedButton, pronunciationSpeed === 0.5 && styles.speedButtonActive]}
              onPress={() => handleSpeedChange(0.5)}
            >
              <Text style={[styles.speedButtonText, pronunciationSpeed === 0.5 && styles.speedButtonTextActive]}>
                Slow
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.speedButton, pronunciationSpeed === 0.75 && styles.speedButtonActive]}
              onPress={() => handleSpeedChange(0.75)}
            >
              <Text style={[styles.speedButtonText, pronunciationSpeed === 0.75 && styles.speedButtonTextActive]}>
                Normal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.speedButton, pronunciationSpeed === 1.0 && styles.speedButtonActive]}
              onPress={() => handleSpeedChange(1.0)}
            >
              <Text style={[styles.speedButtonText, pronunciationSpeed === 1.0 && styles.speedButtonTextActive]}>
                Fast
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Word of the Day</Text>
              <Text style={styles.downloadDescription}>
                Get a fresh, fun word every morning at 8:00 AM.
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.genderButton,
                { flex: 0, paddingHorizontal: 20 },
                notificationsEnabled && styles.genderButtonActive,
              ]}
              onPress={handleToggleNotifications}
            >
              <Text style={[
                styles.genderButtonText,
                notificationsEnabled && styles.genderButtonTextActive,
              ]}>
                {notificationsEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {notificationsEnabled && (
            <KidButton
              title="Send Test Notification"
              onPress={() => notificationService.sendTestNotification()}
              variant="secondary"
              size="small"
              style={{ marginTop: 12 }}
            />
          )}
        </View>

        {/* ── Privacy ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color="#FFD93D" />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <KidButton
            title="Clear Search History"
            onPress={handleClearHistory}
            variant="secondary"
            size="medium"
          />
        </View>

        {/* ── Diagnostics ──────────────────────────────────────────────────── */}
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

        {/* ── About ────────────────────────────────────────────────────────── */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>Kidopedia</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDescription}>
            A fun offline-first learning app. Search for any word and get comprehensive definitions, examples, and translations to Kannada and Hindi — even without internet!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Profile Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProfile ? 'Edit Profile' : 'Create Profile'}
            </Text>

            <View style={styles.avatarPreviewContainer}>
              <View style={[styles.avatarPreview, { backgroundColor: selectedColor || '#E2E8F0' }]}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <User size={48} color="#FFFFFF" />
                )}
              </View>
              <TouchableOpacity style={styles.shuffleButton} onPress={generateNewAvatar}>
                <Shuffle size={20} color="#3B82F6" />
                <Text style={styles.shuffleText}>Change Avatar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter age (2-18)"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderButtons}>
                {(['boy', 'girl', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      gender === g && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === g && styles.genderButtonTextActive,
                      ]}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Avatar Background Color</Text>
              <View style={styles.colorPicker}>
                {availableColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Check size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>
                  {editingProfile ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addSmallButton: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  profileList: {
    marginBottom: 16,
  },
  limitHint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeBlue: { backgroundColor: '#DBEAFE' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeNeutral: { backgroundColor: '#F3F4F6' },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  syncMeta: {
    fontSize: 13,
    color: '#888',
  },
  syncSchedule: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  syncScheduleOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  syncProgressContainer: {
    gap: 8,
    marginBottom: 16,
  },
  syncActions: {
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  shuffleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1E293B',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
