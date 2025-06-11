import MasterLayout from "../../components/masterLayout";
import PedidoListDueno from "../../components/PedidoListDueno";

const Pedidos = () => {
  return (
    <>
      <MasterLayout role="dueno">
        <div id="pedidosDueno"> {/* ID agregado aquí */}
          <PedidoListDueno />
        </div>
      </MasterLayout>
    </>
  );
};
export default Pedidos;
