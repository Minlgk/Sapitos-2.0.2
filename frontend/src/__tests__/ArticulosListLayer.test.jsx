import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArticulosListLayer from '../components/ArticulosListLayer';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import '@testing-library/jest-dom';
/* eslint-env jest */
/* global describe, test, expect*/
vi.mock('axios');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    // eslint-disable-next-line react/prop-types
    Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>
  };
});

describe('ArticulosListLayer', () => {
  test('muestra artículos y permite filtrar por nombre', async () => {
    // Mock de artículos
    const mockData = [
      {
        ARTICULO_ID: 1,
        NOMBRE: 'Camisa Azul',
        CATEGORIA: 'Camisa',
        PRECIOPROVEEDOR: 10,
        PRECIOVENTA: 20,
        TEMPORADA: 'Verano'
      },
      {
        ARTICULO_ID: 2,
        NOMBRE: 'Pantalón Negro',
        CATEGORIA: 'Pantalón',
        PRECIOPROVEEDOR: 15,
        PRECIOVENTA: 30,
        TEMPORADA: 'Invierno'
      }
    ];
    axios.get.mockResolvedValueOnce({ data: mockData });

    render(
      <BrowserRouter>
        <ArticulosListLayer />
      </BrowserRouter>
    );

    // Esperar carga
    await waitFor(() => {
      expect(screen.getByText('Camisa Azul')).toBeInTheDocument();
      expect(screen.getByText('Pantalón Negro')).toBeInTheDocument();
    });

    // Buscar "camisa"
    const searchInput = screen.getByPlaceholderText(/buscar artículos/i);
    fireEvent.change(searchInput, { target: { value: 'camisa' } });

    // Validar que solo se muestra "Camisa Azul"
    await waitFor(() => {
      expect(screen.getByText('Camisa Azul')).toBeInTheDocument();
      expect(screen.queryByText('Pantalón Negro')).not.toBeInTheDocument();
    });
  });

  test('muestra mensaje cuando no hay artículos', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <ArticulosListLayer />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron artículos/i)).toBeInTheDocument();
    });
  });
});
