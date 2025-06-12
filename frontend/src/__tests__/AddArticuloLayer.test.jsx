import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddArticuloLayer from '../components/AddArticuloLayer';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';


import { vi } from 'vitest';
/* eslint-env jest */
/* global describe, test, expect*/
vi.mock('axios');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('AddArticuloLayer', () => {
  test('envía el formulario correctamente', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <BrowserRouter>
        <AddArticuloLayer />
      </BrowserRouter>
    );

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Articulo 1' } }); // Nombre
    fireEvent.change(inputs[1], { target: { value: 'Categoria 1' } }); // Categoria

    const precios = screen.getAllByRole('spinbutton');
    fireEvent.change(precios[0], { target: { value: '10.00' } }); // PrecioProveedor
    fireEvent.change(precios[1], { target: { value: '15.00' } }); // PrecioVenta

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Primavera' } });

    const submitButton = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/articulo',
        {
          Nombre: 'Articulo 1',
          Categoria: 'Categoria 1',
          PrecioProveedor: '10.00',
          PrecioVenta: '15.00',
          Temporada: 'Primavera',
        },
        { withCredentials: true }
      );
    });
  });

});

