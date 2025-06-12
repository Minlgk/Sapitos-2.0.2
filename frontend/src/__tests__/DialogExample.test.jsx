// src/__tests__/DialogExample.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import DialogExample from '../components/DialogExample';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

/* eslint-env jest */
/* global describe, test, expect,beforeEach*/

// Mock de UI5Dialog y NotificationService
vi.mock('../components/UI5Dialog', () => ({
  __esModule: true,
  default: ({ open, onClose, title }) => (
    open ? <div>
      <h1>{title}</h1>
      <button onClick={onClose}>Cerrar</button>
    </div> : null
  )
}));

vi.mock('../components/NotificationService', () => ({
  notify: vi.fn(),
  NotificationType: {
    SUCCESS: 'Success',
    WARNING: 'Warning',
    ERROR: 'Error',
    INFO: 'Info'
  }
}));

describe('DialogExample', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('muestra los botones y abre/cierra el diálogo', () => {
    render(<DialogExample />);

    // Verifica que los botones existan
    expect(screen.getByText('Abrir Dialog')).toBeInTheDocument();
    expect(screen.getByText('Mostrar Ejemplos de Notificaciones')).toBeInTheDocument();

    // Abre el diálogo
    fireEvent.click(screen.getByText('Abrir Dialog'));
    expect(screen.getByText('Ejemplo de Dialog UI5')).toBeInTheDocument();

    // Cierra el diálogo
    fireEvent.click(screen.getByText('Cerrar'));
    expect(screen.queryByText('Ejemplo de Dialog UI5')).not.toBeInTheDocument();
  });
});
