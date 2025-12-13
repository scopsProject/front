import './ManagementPage.css';
import Headers from '../components/Headers';
//import Swal from 'sweetalert2';
import '../components/Headers.css';
//import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
//import api from '../api';

function ManagementPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="App">
      <div className="app-container">
        <Headers onMenuClick={toggleMenu} isOpen={menuOpen} onClose={closeMenu} />

        <div className='management-page-container'>

        </div>
      </div>
    </div>
  );
}

export default ManagementPage;