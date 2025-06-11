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
            src='assets/images/logo.png'
            alt='site logo'
            className='light-logo'
          />
          <img
            src='assets/images/logo-light.png'
            alt='site logo'
            className='dark-logo'
          />
          <img
            src='assets/images/logo-icon.png'
            alt='site logo'
            className='logo-icon'
          />
        </Link>
      </div>      <div className='sidebar-menu-area'>
        <ul className='sidebar-menu' id='sidebar-menu'>
            <SidebarButton to='/dashboard' icon='solar:home-smile-angle-outline' label='Estadisticas' />
            <SidebarButton to='/inventario' label='Inventario'/>
            <SidebarButton to='/ai-assistant' icon='simple-icons:openai' label='Asistente IA' />
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
