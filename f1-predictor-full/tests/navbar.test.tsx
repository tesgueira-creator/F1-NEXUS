import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Navbar from '../components/Navbar';

describe('Navbar', () => {
  it('renders navigation links for the main sections', () => {
    render(<Navbar />);

    const navigation = screen.getByRole('navigation');
    const links = within(navigation).getAllByRole('link');

    expect(links).toHaveLength(8);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Pilotos' })).toHaveAttribute('href', '/drivers');
    expect(screen.getByRole('link', { name: 'Equipas' })).toHaveAttribute('href', '/teams');
    expect(screen.getByRole('link', { name: 'Pistas' })).toHaveAttribute('href', '/tracks');
    expect(screen.getByRole('link', { name: 'Simulações' })).toHaveAttribute('href', '/simulations');
    expect(screen.getByRole('link', { name: 'Dados' })).toHaveAttribute('href', '/data');
    expect(screen.getByRole('link', { name: 'Análises' })).toHaveAttribute('href', '/analysis');
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute('href', '/settings');
  });
});
