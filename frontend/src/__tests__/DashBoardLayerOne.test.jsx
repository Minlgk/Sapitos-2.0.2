// src/__tests__/DashBoardLayerOne.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import DashBoardLayerOne from '../components/DashBoardLayerOne';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
/* eslint-env jest */
/* global describe, test, expect,beforeEach,global*/

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
  });

  test('renderiza estadísticas principales al cargar', async () => {
    render(<DashBoardLayerOne />);

    await waitFor(() => {
      expect(screen.getByText(/Ventas/i)).toBeInTheDocument();
      expect(screen.getByText(/Clientes/i)).toBeInTheDocument();
      expect(screen.getByText(/Productos en Riesgo/i)).toBeInTheDocument();
    });
  });
});
