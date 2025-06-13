import { render } from '@testing-library/react';
import LocationListLayer from '../components/LocationListLayer';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import '@testing-library/jest-dom';
/* eslint-env jest */
/* global  test*/
// Mock de axios y cookies
vi.mock('axios');
vi.mock('../utils/cookies', () => ({
  default: vi.fn(() => JSON.stringify({ ROL: 'ADMIN', LOCATION_ID: 1 }))
}));

// Devolver datos falsos para que el render pase sin errores
axios.get.mockResolvedValue({ data: [] });

test('renderiza LocationListLayer sin errores', () => {
  render(
    <BrowserRouter>
      <LocationListLayer />
    </BrowserRouter>
  );
})