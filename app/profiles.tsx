import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '@/contexts/ProfileContext';
import { KidProfile } from '@/types/profile';
import { User, Plus, Edit2, Trash2, Check, Shuffle, Activity } from 'lucide-react-native';
import { avatarService } from '@/services/avatarService';
import { connectionTestService } from '@/services/connectionTestService';

export default function ProfilesScreen() {
  const router = useRouter();
  const { profiles, createProfile, setActiveProfile, deleteProfile, updateProfile } = useProfile();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<KidProfile | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl' | 'other'>('boy');
  const [selectedColor, setSelectedColor] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  useEffect(() => {
    updateAvatarForGender(gender);
  }, [gender]);

  const updateAvatarForGender = (newGender: 'boy' | 'girl' | 'other') => {
    const colors = avatarService.getColorPalette(newGender);
    setAvailableColors(colors);
    setSelectedColor(avatarService.getRandomColor(newGender));
    setAvatarUrl(avatarService.getRandomAvatarUrl(newGender));
  };

  const generateNewAvatar = () => {
    setAvatarUrl(avatarService.getRandomAvatarUrl(gender));
  };

  const handleCreateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!age || parseInt(age) < 2 || parseInt(age) > 18) {
      Alert.alert('Error', 'Please enter a valid age (2-18)');
      return;
    }

    try {
      console.log('Creating profile with data:', {
        name: name.trim(),
        age: parseInt(age),
        gender,
        avatar_color: selectedColor,
        avatar_url: avatarUrl,
      });

      const newProfile = await createProfile({
        name: name.trim(),
        age: parseInt(age),
        gender,
        avatar_color: selectedColor,
        avatar_url: avatarUrl,
      });

      console.log('Profile created successfully:', newProfile);
      await setActiveProfile(newProfile);
      resetForm();
      setShowCreateModal(false);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Create profile error:', error);
      const errorMessage = error?.message || 'Failed to create profile. Please check your internet connection.';

      Alert.alert(
        'Failed to Create Profile',
        `${errorMessage}\n\nTap "Test Connection" below to diagnose the issue.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Test Connection',
            onPress: handleRunDiagnostics,
          },
        ]
      );
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!age || parseInt(age) < 2 || parseInt(age) > 18) {
      Alert.alert('Error', 'Please enter a valid age (2-18)');
      return;
    }

    try {
      await updateProfile(editingProfile.id, {
        name: name.trim(),
        age: parseInt(age),
        gender,
        avatar_color: selectedColor,
        avatar_url: avatarUrl,
      });
      resetForm();
      setEditingProfile(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(error);
    }
  };

  const handleDeleteProfile = (profile: KidProfile) => {
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${profile.name}'s profile? This will remove all progress.`,
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
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleSelectProfile = async (profile: KidProfile) => {
    await setActiveProfile(profile);
    router.replace('/(tabs)');
  };

  const resetForm = () => {
    setName('');
    setAge('');
    const defaultGender = 'boy';
    setGender(defaultGender);
    updateAvatarForGender(defaultGender);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (profile: KidProfile) => {
    setName(profile.name);
    setAge(profile.age.toString());
    setGender(profile.gender);
    setSelectedColor(profile.avatar_color);
    setAvatarUrl(profile.avatar_url || avatarService.getRandomAvatarUrl(profile.gender));
    setAvailableColors(avatarService.getColorPalette(profile.gender));
    setEditingProfile(profile);
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
      ? '✓ All tests passed!'
      : '✗ Some tests failed';

    const message = result.messages.join('\n');

    Alert.alert(
      'Connection Test Results',
      `${status}\n\n${message}\n\nIf tests failed, check NETWORK_FIX.md for solutions.`,
      [{ text: 'OK' }]
    );
  };

  const renderProfileForm = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>
        {editingProfile ? 'Edit Profile' : 'Create Profile'}
      </Text>

      <View style={styles.avatarPreviewContainer}>
        <View style={[styles.avatarPreview, { backgroundColor: selectedColor }]}>
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
          onPress={() => {
            setShowCreateModal(false);
            setEditingProfile(null);
            resetForm();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={editingProfile ? handleUpdateProfile : handleCreateProfile}
        >
          <Text style={styles.saveButtonText}>
            {editingProfile ? 'Update' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kid Profiles</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.profileList}>
        {profiles.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Profiles Yet</Text>
            <Text style={styles.emptyText}>
              Create a profile to start tracking learning progress
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={openCreateModal}>
              <Text style={styles.createFirstButtonText}>Create First Profile</Text>
            </TouchableOpacity>

            <View style={styles.diagnosticsContainer}>
              <Text style={styles.diagnosticsHint}>Having connection issues?</Text>
              <TouchableOpacity style={styles.diagnosticsButton} onPress={handleRunDiagnostics}>
                <Activity size={20} color="#6366F1" />
                <Text style={styles.diagnosticsButtonText}>Test Database Connection</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          profiles.map((profile) => (
            <View key={profile.id} style={styles.profileCard}>
              <TouchableOpacity
                style={styles.profileContent}
                onPress={() => handleSelectProfile(profile)}
              >
                <View style={[styles.avatar, { backgroundColor: profile.avatar_color }]}>
                  {profile.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {profile.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileDetails}>
                    {profile.age} years • Level {profile.current_level}
                  </Text>
                  <Text style={styles.profileStats}>
                    {profile.words_learned} words learned • {profile.total_xp} XP
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(profile)}
                >
                  <Edit2 size={20} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteProfile(profile)}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal || editingProfile !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setEditingProfile(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          {renderProfileForm()}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileList: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createFirstButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  profileStats: {
    fontSize: 12,
    color: '#94A3B8',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 24,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  shuffleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
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
    paddingVertical: 12,
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
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
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
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  diagnosticsContainer: {
    marginTop: 40,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    width: '100%',
  },
  diagnosticsHint: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  diagnosticsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
});
