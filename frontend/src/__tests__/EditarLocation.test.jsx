import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditarLocation from '../components/EditarLocation';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
/* eslint-env jest */
/* global describe, test, expect,beforeEach*/
// Mock global
vi.mock('axios');

// ✅ Definimos navigateMock ANTES del mock
const navigateMock = vi.fn();

// ✅ Mock de react-router-dom con navigateMock
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: '1' }) // forzamos el ID también por seguridad
  };
});

describe('EditarLocation', () => {
  const locationMock = {
    LOCATION_ID: 1,
    NOMBRE: 'Ubicación A',
    TIPO: 'Sucursal',
    POSICIONX: 10,
    POSICIONY: 20
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = () => {
    render(
      <MemoryRouter initialEntries={['/location/edit/1']}>
        <Routes>
          <Route path="/location/edit/:id" element={<EditarLocation />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('renderiza formulario con datos cargados y permite editar', async () => {
    axios.get.mockResolvedValueOnce({ data: [locationMock] });
    axios.put.mockResolvedValueOnce({ status: 200 });

    window.alert = vi.fn(); // evitar alert real

    renderWithRouter();

    // Aparece "Cargando..."
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();

    // Esperar a que se rendericen los valores del formulario
    await waitFor(() => {
      expect(screen.getByDisplayValue('Ubicación A')).toBeInTheDocument();
    });

    // Cambiar valores
    fireEvent.change(screen.getByDisplayValue('Ubicación A'), { target: { value: 'Modificada' } });
    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '99' } });

    fireEvent.click(screen.getByText(/Guardar cambios/i));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:5000/location2/1',
        expect.objectContaining({
          Nombre: 'Modificada',
          PosicionX: '99'
        }),
        expect.anything()
      );

      expect(navigateMock).toHaveBeenCalledWith('/location');
    });
  });
});
