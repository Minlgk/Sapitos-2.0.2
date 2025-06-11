import { Link, NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import SidebarButton from "../../general/sideBarButton";


const Sidebar = ({ sidebarActive, mobileMenu, mobileMenuControl }) => {
  return (
    <aside
      className={
        sidebarActive
          ? "sidebar active "
          : mobileMenu
          ? "sidebar sidebar-open"
          : "sidebar"
      }
    >
      {/*<button
        onClick={mobileMenuControl}
        type='button'
        className='sidebar-close-btn'
      >
        <Icon icon='radix-icons:cross-2' />
      </button> */}
      
      <div>
        <Link to='/dashboard' className='sidebar-logo'>
          <img
            src='/assets/images/logo.png'
            alt='site logo'
            className='light-logo'
          />
          <img
            src='/assets/images/logo-light.png'
            alt='site logo'
            className='dark-logo'
          />
          <img
            src='/assets/images/logo-icon.png'
            alt='site logo'
            className='logo-icon'
          />
        </Link>
      </div>      <div className='sidebar-menu-area'>
        <ul className='sidebar-menu' id='sidebar-menu'>            <SidebarButton to='/dashboard' icon='solar:home-smile-angle-outline' label='Estadisticas' />
            <SidebarButton to='/inventario' icon='fluent:box-20-filled' label='Inventario' />
            <SidebarButton to='/pedidos' icon='hugeicons:invoice-03' label='Pedidos' />
            <SidebarButton to='/ordenes-pymes' icon='mdi:store' label='Ordenes Pymes' />
            <SidebarButton to='/usuarios' icon='solar:user-linear' label='Usuarios' />
            <SidebarButton to="/articulos" icon="mdi:package-variant-closed" label="Artículos" />
            <SidebarButton to='/location' icon='material-symbols:location-on' label='Ubicaciones' />

            <SidebarButton to='/modelo-prediccion' icon='carbon:machine-learning-model' label='Modelo IA' />
            <SidebarButton to='/notificaciones' icon='mdi:bell-outline' label='Notificaciones' />
            <SidebarButton to='/ai-assistant' icon='simple-icons:openai' label='Asistente IA' />
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;