import MasterLayout from "../../components/masterLayout";
import DashBoardLayerOne from "../../components/DashBoardLayerOne";


const HomeAdmin = () => {
  return (
    <>
      <MasterLayout role="admin">
        <div id="homeAdminPage">
          <DashBoardLayerOne />
        </div>
      </MasterLayout>
    </>
  );
};

export default HomeAdmin;
