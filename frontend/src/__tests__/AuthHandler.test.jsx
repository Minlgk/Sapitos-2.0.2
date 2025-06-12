import { render, screen, waitFor } from '@testing-library/react';
import AuthHandler, { useAuth } from '../components/AuthHandler';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import  { useEffect } from 'react';


/* eslint-env jest */
/* global describe, test, expect,afterEach*/
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(() => ({ rol: 'admin', email: 'admin@example.com' }))
}));

vi.stubGlobal('fetch', vi.fn());

const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      Usuario: {auth.user?.email}
    </div>
  );
};

const renderWithRouter = (initialPath = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <AuthHandler>
              <TestComponent />
            </AuthHandler>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('AuthHandler', () => {
  afterEach(() => {
    fetch.mockReset();
  });

  test('renderiza children si hay sesión válida', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'token123',
        usuario: { email: 'admin@example.com', rol: 'admin' }
      })
    });

    renderWithRouter('/dashboard');

    await waitFor(() => {
      expect(screen.getByText(/Usuario: admin@example.com/)).toBeInTheDocument();
    });
  });

  test('redirige al login si no hay sesión válida', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    const locationSpy = vi.fn();
    const LocationWatcher = () => {
      const location = useLocation();
      useEffect(() => {
        locationSpy(location.pathname);
      }, [location]);
      return null;
    };

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="*"
            element={
              <AuthHandler>
                <LocationWatcher />
              </AuthHandler>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(locationSpy).toHaveBeenCalledWith('/');
    });
  });

  test('no verifica sesión si está en / o /register', async () => {
    renderWithRouter('/');

    expect(screen.queryByText(/Verificando autenticación/i)).not.toBeInTheDocument();

  });

  test('muestra spinner mientras verifica', async () => {
    fetch.mockImplementation(() =>
      new Promise((resolve) =>
        setTimeout(() => resolve({ ok: true, json: async () => ({ token: 'x', usuario: {} }) }), 100)
      )
    );

    renderWithRouter('/dashboard');

    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
