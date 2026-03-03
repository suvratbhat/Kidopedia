import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PronounceButton } from '../PronounceButton';
import { audioService } from '../../services/audioService';

jest.mock('../../services/audioService', () => ({
  audioService: {
    playPronunciation: jest.fn(),
    fetchAndCacheAudio: jest.fn(),
  },
}));

describe('PronounceButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props (Happy Path)', () => {
    const { getByText } = render(<PronounceButton word="hello" />);
    expect(getByText('Pronounce')).toBeTruthy();
  });

  it('calls audioService.playPronunciation when pressed', async () => {
    const { getByText } = render(<PronounceButton word="hello" audioUrl="https://example.com/audio.mp3" />);
    const button = getByText('Pronounce');
    
    fireEvent.press(button);
    
    expect(audioService.playPronunciation).toHaveBeenCalledWith('hello', 'https://example.com/audio.mp3');
    expect(getByText('Speaking...')).toBeTruthy();
  });

  it('fetches audio if not provided on press (Edge Case)', async () => {
    (audioService.fetchAndCacheAudio as jest.Mock).mockResolvedValue('https://example.com/fetched.mp3');
    
    const { getByText } = render(<PronounceButton word="apple" />);
    const button = getByText('Pronounce');
    
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(audioService.fetchAndCacheAudio).toHaveBeenCalledWith('apple');
      expect(audioService.playPronunciation).toHaveBeenCalledWith('apple', 'https://example.com/fetched.mp3');
    });
  });

  it('handles errors gracefully (Error Handling)', async () => {
    (audioService.playPronunciation as jest.Mock).mockRejectedValue(new Error('Playback failed'));
    
    const { getByText } = render(<PronounceButton word="error" />);
    const button = getByText('Pronounce');
    
    fireEvent.press(button);
    
    // Should still reset the state after failure
    await waitFor(() => {
      expect(getByText('Pronounce')).toBeTruthy();
    });
  });
});
