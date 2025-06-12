import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeneratedContent from '../components/general/child/GeneratedContent';
import '@testing-library/jest-dom';
import axios from 'axios';
import { vi } from 'vitest';


vi.mock('react-apexcharts', () => ({
  default: () => <div data-testid="mock-chart" />,
}));

/* eslint-env jest */
/* global describe, test, expect*/

vi.mock('axios');

describe('GeneratedContent', () => {
  test('muestra spinner mientras carga', () => {
    axios.get.mockResolvedValueOnce({ data: {} });

    render(<GeneratedContent />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('muestra datos cuando la carga es exitosa', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        paymentStatusChartSeries: [10, 20],
        paymentStatusChartOptions: { chart: { id: 'test' } },
        metrics: {
          totalProductos: 15,
          totalCategorias: 3,
        },
      },
    });

    render(<GeneratedContent />);

    await waitFor(() =>
      expect(screen.getByText(/Productos Vendidos/i)).toBeInTheDocument()
    );
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('muestra mensaje de error si falla la petición', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    render(<GeneratedContent />);

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/categorías/i)
    );
  });
});
