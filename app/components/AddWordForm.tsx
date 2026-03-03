import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { customWordsService } from '../services/customWordsService';
import { KidButton } from '../../components/KidButton';
import { BookPlus, CheckCircle2 } from 'lucide-react-native';

interface AddWordFormProps {
  profileId: string;
  onWordAdded?: () => void;
}

export function AddWordForm({ profileId, onWordAdded }: AddWordFormProps) {
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!word.trim() || !definition.trim()) {
      Alert.alert('Missing Information', 'Please provide both a word and its definition.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await customWordsService.addCustomWord(
        profileId,
        word.trim(),
        definition.trim(),
        example.trim() || undefined
      );

      if (result) {
        setWord('');
        setDefinition('');
        setExample('');
        setShowSuccess(true);
        onWordAdded?.();
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        Alert.alert('Error', 'Could not add the word. It might already exist in your list.');
      }
    } catch (error) {
      console.error('Error in AddWordForm:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BookPlus size={24} color="#42A5F5" />
        <Text style={styles.title}>Add Custom Word</Text>
      </View>
      
      <Text style={styles.description}>
        Add words from school or home to help your child learn them!
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Word</Text>
          <TextInput
            style={styles.input}
            value={word}
            onChangeText={setWord}
            placeholder="e.g. photosynthesis"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Definition</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={definition}
            onChangeText={setDefinition}
            placeholder="What does it mean?"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Example Sentence (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={example}
            onChangeText={setExample}
            placeholder="Use it in a sentence..."
            multiline
            numberOfLines={2}
          />
        </View>

        <KidButton
          title={showSuccess ? "Word Added!" : "Add Word to List"}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          icon={showSuccess ? <CheckCircle2 size={20} color="#FFFFFF" /> : <BookPlus size={20} color="#FFFFFF" />}
        />
        
        {showSuccess && (
          <Text style={styles.successMessage}>Word added successfully!</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  successMessage: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
});
