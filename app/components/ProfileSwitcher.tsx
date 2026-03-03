import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useProfile } from '@/contexts/ProfileContext';
import { ChevronDown, User } from 'lucide-react-native';

export default function ProfileSwitcher() {
  const { activeProfile, profiles, setActiveProfile } = useProfile();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!activeProfile) return null;

  const otherProfiles = profiles.filter((p) => p.id !== activeProfile.id);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.activeProfile, isOpen && styles.activeProfileOpen]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <View style={[styles.avatar, { backgroundColor: activeProfile.avatar_color }]}>
          {activeProfile.avatar_url ? (
            <Image
              source={{ uri: activeProfile.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {activeProfile.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {activeProfile.name}
        </Text>
        <ChevronDown
          size={16}
          color="#64748B"
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          <ScrollView bounces={false} style={styles.scrollView}>
            {otherProfiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={styles.profileItem}
                onPress={() => {
                  setActiveProfile(profile);
                  setIsOpen(false);
                }}
              >
                <View style={[styles.itemAvatar, { backgroundColor: profile.avatar_color }]}>
                  {profile.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.itemAvatarText}>
                      {profile.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {profile.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {profiles.length < 4 && (
              <TouchableOpacity
                style={styles.manageItem}
                onPress={() => {
                  // This could navigate to profile management or show creation modal
                  // For now, we'll assume the user goes to settings to manage
                  setIsOpen(false);
                }}
              >
                <View style={styles.manageIcon}>
                  <User size={16} color="#64748B" />
                </View>
                <Text style={styles.manageText}>Manage Profiles</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  activeProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeProfileOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: '#CBD5E1',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    maxWidth: 100,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  scrollView: {
    maxHeight: 200,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  manageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    backgroundColor: '#F8FAFC',
  },
  manageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
});
