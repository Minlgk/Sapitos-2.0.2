import MasterLayout from "../../components/masterLayout";
import PedidoDueno from "../../components/PedidoDueno";

const CrearPedidoWarehouse = () => {
  return (
    <>
      <MasterLayout role="dueno">
        <div id="pedidoWarehouseDueno">
          <PedidoDueno />
        </div>
      </MasterLayout>
    </>
  );
};

export default CrearPedidoWarehouse; 