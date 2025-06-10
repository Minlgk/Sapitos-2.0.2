const express = require('express');
const request = require('supertest');
const app = express();
app.use(express.json());

jest.mock('../config/db', () => ({
  connection: {
    exec: jest.fn(),
  },
}));

const { connection } = require('../config/db');
const alertaController = require('../controllers/alertaController');

app.get('/alertas', alertaController.getAlertas);
app.delete('/alertas/:id', alertaController.deleteAlerta);

describe('Alerta Controller', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET /alertas - retorna lista de alertas procesadas', async () => {
    const mockRows = [
      {
        id: 1,
        descripcion: 'Orden ID 123 En Reparto',
        fecha: '2025-06-09T10:00:00Z',
        location_id: 5,
        prioridad: 3,
        orden_producto_id: 123
      },
    ];

    connection.exec.mockImplementation((query, params, cb) => cb(null, mockRows));

    const res = await request(app).get('/alertas');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        id: 1,
        tipo: 'primary',
        titulo: 'Orden #123 en reparto',
        descripcion: 'Orden ID 123 En Reparto',
        fecha: '2025-06-09T10:00:00Z',
        orden_id: '123',
        usuario_id: null,
        location_id: 5
      }
    ]);
  });

  test('DELETE /alertas/:id - elimina alerta correctamente', async () => {
    connection.exec.mockImplementation((query, params, cb) => cb(null, { affectedRows: 1 }));

    const res = await request(app).delete('/alertas/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Alerta eliminada correctamente' });
  });

  test('generarNotificacion - éxito', async () => {
    connection.exec
      .mockImplementationOnce((query, params, cb) => cb(null, {})) // Inserción
      .mockImplementationOnce((query, params, cb) => cb(null, [{ alertaId: 42 }])); // Obtener ID

    const result = await alertaController.generarNotificacion(
      'Nueva orden registrada',
      'Alerta',
      'info',
      1,
      999,
      3
    );

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(42);
  });

  test('generarNotificacion - error por falta de datos', async () => {
    await expect(alertaController.generarNotificacion('', 'título', 'info', null))
      .rejects.toThrow('La descripción y el location_id son obligatorios');
  });

  test('generarNotificacion - error de inserción en DB', async () => {
    connection.exec.mockImplementationOnce((query, params, cb) =>
      cb(new Error('DB insert error'))
    );

    await expect(
      alertaController.generarNotificacion('desc', 'titulo', 'info', 1)
    ).rejects.toThrow('DB insert error');
  });
});
