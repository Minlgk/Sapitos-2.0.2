import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddUserLayer from '../components/AddUserLayer';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

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

vi.mock('../components/NotificationService', () => ({
  notify: vi.fn(),
  NotificationType: {
    SUCCESS: 'success',
    ERROR: 'error',
  },
}));

describe('AddUserLayer', () => {
  test('envía el formulario correctamente', async () => {
  axios.get.mockResolvedValueOnce({
    data: [{ LOCATION_ID: 1, NOMBRE: 'Oficina Central', TIPO: 'Oficina' }]
  });

  axios.post.mockResolvedValueOnce({ data: { success: true } });

  render(
    <BrowserRouter>
      <AddUserLayer />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/location2', { withCredentials: true });
  });

  // Llenar nombre y correo
  const textboxes = screen.getAllByRole('textbox');
  fireEvent.change(textboxes[0], { target: { value: 'Juan Pérez' } });        // Nombre
  fireEvent.change(textboxes[1], { target: { value: 'juan@example.com' } }); // Correo

  // Llenar contraseña manualmente con querySelector
  const passwordInput = document.querySelector('input[name="contrasena"]');
    fireEvent.change(passwordInput, { target: { value: '123456' } });

  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[0], { target: { value: 'admin' } });     // Rol
  fireEvent.change(selects[1], { target: { value: 'oficina' } });   // Tipo

  await waitFor(() => {
  const ubicacionSelect = document.querySelector('select[name="location_id"]');
  expect(ubicacionSelect).toBeInTheDocument();
});

// Seleccionar ubicación
const ubicacionSelect = document.querySelector('select[name="location_id"]');
fireEvent.change(ubicacionSelect, { target: { value: '1' } });

  fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/users/register',
      expect.objectContaining({
        nombre: 'Juan Pérez',
        correo: 'juan@example.com',
        contrasena: '123456',
        rol: 'admin',
        location_id: 1,
        organizacion: 'Oficina Central',
      })
    );
  });
});
})
