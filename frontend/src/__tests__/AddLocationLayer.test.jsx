// src/__tests__/AddLocationLayer.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddLocationLayer from "../components/AddLocationLayer";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";

// Mocks
vi.mock("axios");
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe("AddLocationLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza los campos correctamente", () => {
    renderWithRouter(<AddLocationLayer />);
    const inputs = screen.getAllByRole("textbox");
    const select = screen.getByRole("combobox");
    const guardarBtn = screen.getByRole("button", { name: /guardar/i });
    const cancelarBtn = screen.getByRole("button", { name: /cancelar/i });

    expect(inputs.length).toBe(1); // Solo el campo "Nombre"
    expect(select).toBeInTheDocument();
    expect(guardarBtn).toBeInTheDocument();
    expect(cancelarBtn).toBeInTheDocument();
  });

  it("envía el formulario correctamente", async () => {
    axios.post.mockResolvedValueOnce({ data: {} });

    renderWithRouter(<AddLocationLayer />);

    const inputNombre = screen.getAllByRole("textbox")[0];
    const selectTipo = screen.getByRole("combobox");
    const guardarBtn = screen.getByRole("button", { name: /guardar/i });

    fireEvent.change(inputNombre, { target: { value: "Sucursal Norte" } });
    fireEvent.change(selectTipo, { target: { value: "Sucursal" } });
    fireEvent.click(guardarBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:5000/location2/",
        expect.objectContaining({
          Nombre: "Sucursal Norte",
          Tipo: "Sucursal",
          PosicionX: 0,
          PosicionY: 0,
        }),
        { withCredentials: true }
      );
    });
  });

  it("no envía si los campos están vacíos", async () => {
    renderWithRouter(<AddLocationLayer />);
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
});
