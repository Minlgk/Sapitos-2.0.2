import { render, screen, waitFor, cleanup } from '@testing-library/react';
import DashBoardLayerOne from '../components/DashBoardLayerOne';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

/* eslint-env jest */
/* global describe, test, expect, beforeEach, afterEach, global */

// Mock de cookies y fetch
vi.mock('../utils/cookies', () => ({
  default: vi.fn(() => JSON.stringify({ ROL: 'ADMIN', LOCATION_ID: 1 }))
}));

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

describe('DashBoardLayerOne', () => {
  beforeEach(() => {
    fetch.mockClear();
    // No usar fakeTimers aquí
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();  // Por si acaso, limpia cualquier timeout
  });

  test(
    'renderiza estadísticas principales al cargar',
    async () => {
      render(<DashBoardLayerOne />);
      await waitFor(() => {
        expect(screen.getByText(/Ventas/i)).toBeInTheDocument();
        expect(screen.getByText(/Clientes/i)).toBeInTheDocument();
        expect(screen.getByText(/Productos en Riesgo/i)).toBeInTheDocument();
      });
    },
    10000 // Timeout extendido
  );
});
