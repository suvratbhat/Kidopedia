import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DailyWordCard } from '../DailyWordCard';

describe('DailyWordCard', () => {
  const mockWord = {
    id: '1',
    word: 'adventure',
    phonetic: '/ədˈventʃə/',
    audio_url: '',
    meanings: [],
    origin: '',
    search_count: 0,
    created_at: '',
    updated_at: '',
  };

  const mockTheme = {
    primary: '#FF6B6B',
    accent: '#4ECDC4',
  };

  it('renders correctly', () => {
    const { getByText } = render(
      <DailyWordCard
        word={mockWord}
        theme={mockTheme}
        onPress={() => {}}
        definition="An unusual and exciting experience."
      />
    );

    expect(getByText('WORD OF THE DAY')).toBeTruthy();
    expect(getByText('adventure')).toBeTruthy();
    expect(getByText('An unusual and exciting experience.')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <DailyWordCard
        word={mockWord}
        theme={mockTheme}
        onPress={onPressMock}
        definition="Test definition"
      />
    );

    fireEvent.press(getByText('adventure'));
    expect(onPressMock).toHaveBeenCalledWith(mockWord);
  });

  it('truncates long definitions', () => {
    const longDefinition = 'This is a very long definition that should definitely be truncated because it exceeds the two line limit we set in our styles to keep the card looking nice and clean for the users.';
    const { getByText } = render(
      <DailyWordCard
        word={mockWord}
        theme={mockTheme}
        onPress={() => {}}
        definition={longDefinition}
      />
    );

    const definitionElement = getByText(longDefinition);
    expect(definitionElement.props.numberOfLines).toBe(2);
  });
});
