import './CalenderPage.css';
import Headers from '../components/Headers';
import  '../components/Headers.css';
import { useState, useEffect } from 'react';
import axios from 'axios';


function CalenderPage(){
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  const closeMenu = () => {
    setMenuOpen(false);
  };

    return (
      <div className="phone-frame">
        <div className="App"> 
          <Headers onMenuClick={toggleMenu} username="김유빈" isOpen={menuOpen} onClose={closeMenu}></Headers>
        </div>
      </div>
    );
}
export default CalenderPage;