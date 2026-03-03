import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeCard } from '../BadgeCard';

describe('BadgeCard', () => {
  const mockBadge = {
    title: 'Super Reader',
    description: 'Read 10 words',
    icon: '📖',
  };

  it('renders earned badge correctly', () => {
    const { getByText } = render(
      <BadgeCard
        {...mockBadge}
        isEarned={true}
        unlockedAt="2026-03-03T00:00:00Z"
      />
    );

    expect(getByText('Super Reader')).toBeTruthy();
    expect(getByText('Read 10 words')).toBeTruthy();
    expect(getByText('📖')).toBeTruthy();
    expect(getByText(/Earned on/)).toBeTruthy();
  });

  it('renders locked badge correctly', () => {
    const { getByText, queryByText } = render(
      <BadgeCard
        {...mockBadge}
        isEarned={false}
      />
    );

    expect(getByText('Super Reader')).toBeTruthy();
    expect(queryByText(/Earned on/)).toBeNull();
  });

  it('displays the title and description even when locked', () => {
    const { getByText } = render(
      <BadgeCard
        {...mockBadge}
        isEarned={false}
      />
    );

    expect(getByText('Super Reader')).toBeTruthy();
    expect(getByText('Read 10 words')).toBeTruthy();
  });
});
