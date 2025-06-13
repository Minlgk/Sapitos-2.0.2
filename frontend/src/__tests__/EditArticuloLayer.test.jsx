// EditArticuloLayer.test.jsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditArticuloLayer from '../components/EditArticuloLayer';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import '@testing-library/jest-dom';

/* eslint-env jest */
/* global describe, test, expect,beforeEach*/
vi.mock('axios');

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: '1' }),
  };
});

describe('EditArticuloLayer', () => {
  const mockArticulo = {
    ARTICULO_ID: 1,
    NOMBRE: 'Zapato Rojo',
    CATEGORIA: 'Calzado',
    PRECIOPROVEEDOR: 120.5,
    PRECIOVENTA: 199.99,
    TEMPORADA: 'Invierno',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  const renderComponent = () => {
    render(
      <MemoryRouter initialEntries={['/articulos/edit/1']}>
        <Routes>
          <Route path="/articulos/edit/:id" element={<EditArticuloLayer />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('carga los datos del artículo y permite editar y guardar', async () => {
    axios.get.mockResolvedValueOnce({ data: [mockArticulo] });
    axios.put.mockResolvedValueOnce({ status: 200 });

    renderComponent();

    // Esperar a que se carguen los valores iniciales
    await waitFor(() => {
      expect(screen.getByDisplayValue('Zapato Rojo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('199.99')).toBeInTheDocument();
    });

    // Editar valores directamente usando getByDisplayValue
    const nombreInput = screen.getByDisplayValue('Zapato Rojo');
    const precioVentaInput = screen.getByDisplayValue('199.99');

    fireEvent.change(nombreInput, { target: { value: 'Zapato Azul' } });
    fireEvent.change(precioVentaInput, { target: { value: '210.00' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:5000/articulo/1',
        expect.objectContaining({
          Nombre: 'Zapato Azul',
          PrecioVenta: '210.00',
        }),
        expect.anything()
      );

      expect(window.alert).toHaveBeenCalledWith('Artículo actualizado correctamente.');
      expect(navigateMock).toHaveBeenCalledWith('/articulos');
    });
  });
});
