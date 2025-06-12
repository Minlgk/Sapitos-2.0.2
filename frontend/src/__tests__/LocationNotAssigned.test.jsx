import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocationNotAssigned from '../components/LocationNotAssigned';
import '@testing-library/jest-dom';


describe('LocationNotAssigned', () => {
  const renderWithRole = (role) => render(<LocationNotAssigned userRole={role} />);

  it('muestra mensaje genérico si no se proporciona rol', () => {
    render(<LocationNotAssigned />);
    expect(screen.getByText(/sin ubicación asignada/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tu cuenta necesita una ubicación asignada/i)
    ).toBeInTheDocument();
  });

  it('muestra mensaje para rol cliente', () => {
    renderWithRole('cliente');
    expect(
      screen.getByText(/necesitas tener una ubicación asignada/i)
    ).toBeInTheDocument();
  });

  it('muestra mensaje para rol proveedor', () => {
    renderWithRole('proveedor');
    expect(
      screen.getByText(/solicita que te asignen una ubicación/i)
    ).toBeInTheDocument();
  });

  it('muestra mensaje para rol admin', () => {
    renderWithRole('admin');
    expect(
      screen.getByText(/cuenta de administrador necesita una ubicación asignada/i)
    ).toBeInTheDocument();
  });

  it('muestra mensaje por defecto con rol desconocido', () => {
    renderWithRole('rol_inexistente');
    expect(
      screen.getByText(/tu cuenta necesita una ubicación asignada/i)
    ).toBeInTheDocument();
  });

  it('muestra la alerta informativa sobre estadísticas', () => {
    renderWithRole('cliente');
    expect(screen.getByRole('alert')).toHaveTextContent(
      /las estadísticas se filtran por ubicación/i
    );
  });

  it('renderiza encabezado y tarjeta', () => {
    renderWithRole('admin');
    expect(screen.getByText(/sin ubicación asignada/i)).toBeInTheDocument();
    expect(screen.getAllByText(/estadísticas/i).length).toBeGreaterThan(0);

  });
});
