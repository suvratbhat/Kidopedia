import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddWordForm } from '../AddWordForm';
import { customWordsService } from '../../services/customWordsService';
import { Alert } from 'react-native';

jest.mock('../../services/customWordsService', () => ({
  customWordsService: {
    addCustomWord: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AddWordForm', () => {
  const profileId = 'profile-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<AddWordForm profileId={profileId} />);
    expect(getByText('Add Custom Word')).toBeTruthy();
    expect(getByPlaceholderText('e.g. photosynthesis')).toBeTruthy();
  });

  it('shows error if word or definition is missing', async () => {
    const { getByText } = render(<AddWordForm profileId={profileId} />);
    const addButton = getByText('Add Word to List');
    
    fireEvent.press(addButton);
    
    expect(Alert.alert).toHaveBeenCalledWith('Missing Information', expect.any(String));
  });

  it('calls addCustomWord and shows success message on valid submission', async () => {
    (customWordsService.addCustomWord as jest.Mock).mockResolvedValue({ id: '1' });
    const onWordAdded = jest.fn();
    
    const { getByPlaceholderText, getByText } = render(
      <AddWordForm profileId={profileId} onWordAdded={onWordAdded} />
    );
    
    fireEvent.changeText(getByPlaceholderText('e.g. photosynthesis'), 'Apple');
    fireEvent.changeText(getByPlaceholderText('What does it mean?'), 'A fruit');
    fireEvent.press(getByText('Add Word to List'));
    
    await waitFor(() => {
      expect(customWordsService.addCustomWord).toHaveBeenCalledWith(
        profileId,
        'Apple',
        'A fruit',
        undefined
      );
      expect(onWordAdded).toHaveBeenCalled();
      expect(getByText('Word added successfully!')).toBeTruthy();
    });
  });

  it('handles error from service', async () => {
    (customWordsService.addCustomWord as jest.Mock).mockResolvedValue(null);
    
    const { getByPlaceholderText, getByText } = render(
      <AddWordForm profileId={profileId} />
    );
    
    fireEvent.changeText(getByPlaceholderText('e.g. photosynthesis'), 'Apple');
    fireEvent.changeText(getByPlaceholderText('What does it mean?'), 'A fruit');
    fireEvent.press(getByText('Add Word to List'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringContaining('Could not add the word'));
    });
  });
});
