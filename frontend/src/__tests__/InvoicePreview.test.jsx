// src/__tests__/InvoicePreview.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import InvoicePreview from '../components/InvoicePreview';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
/* eslint-env jest */
/* global global, test, expect,beforeEach*/

// Mock global fetch
beforeEach(() => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({
      json: () => Promise.resolve({
        usuario: { id: 1, nombre: 'Admin', correo: 'admin@test.com', rol: 'admin' }
      })
    })
    .mockResolvedValueOnce({
      json: () => Promise.resolve({
        fechaCreacion: '2024-04-30T00:00:00Z',
        creadoPorNombre: 'Admin',
        creadaPor: 'admin@test.com',
        organizacion: 'Sapitos Inc',
        proveedor: 'Proveedor X',
        descuentoAplicado: 10,
        total: 90
      })
    })
    .mockResolvedValueOnce({
      json: () => Promise.resolve([
        {
          ID: 1,
          NOMBRE: 'Producto A',
          CATEGORIA: 'Categoria A',
          CANTIDAD: 2,
          PRECIOUNITARIO: 50,
          TOTAL: 100
        }
      ])
    });
});

test('InvoicePreview muestra correctamente los datos cargados', async () => {
  render(
    <MemoryRouter initialEntries={['/invoice/123']}>
      <Routes>
        <Route path="/invoice/:id" element={<InvoicePreview />} />
      </Routes>
    </MemoryRouter>
  );

  // Espera a que se renderice el número de pedido
  await waitFor(() => {
    expect(screen.getByText(/Pedido #123/i)).toBeInTheDocument();
  });

  // Verifica que existan al menos algunos textos clave
  expect(screen.getAllByText(/Admin/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/Proveedor X/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeInTheDocument();
});