import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileCard from '../ProfileCard';
import { KidProfile } from '@/types/profile';

const mockProfile: KidProfile = {
  id: '1',
  name: 'John',
  age: 5,
  gender: 'boy',
  avatar_color: '#FF0000',
  current_level: 1,
  total_xp: 50,
  words_learned: 5,
  created_at: '',
  last_active_at: '',
};

describe('ProfileCard', () => {
  const mockOnSelect = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  it('renders profile information correctly', () => {
    const { getByText } = render(
      <ProfileCard
        profile={mockProfile}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(getByText('John')).toBeTruthy();
    expect(getByText('5 years • Level 1')).toBeTruthy();
    expect(getByText('5 words learned • 50 XP')).toBeTruthy();
  });

  it('calls onSelect when card is pressed', () => {
    const { getByText } = render(
      <ProfileCard
        profile={mockProfile}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.press(getByText('John'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockProfile);
  });

  it('shows active badge when isActive is true', () => {
    const { getByText } = render(
      <ProfileCard
        profile={mockProfile}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isActive={true}
      />
    );

    expect(getByText('Active')).toBeTruthy();
  });

  it('calls onEdit when edit button is pressed', () => {
    const { getByLabelText } = render(
      <ProfileCard
        profile={mockProfile}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.press(getByLabelText('Edit Profile'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockProfile);
  });

  it('calls onDelete when delete button is pressed', () => {
    const { getByLabelText } = render(
      <ProfileCard
        profile={mockProfile}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.press(getByLabelText('Delete Profile'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockProfile);
  });
});
