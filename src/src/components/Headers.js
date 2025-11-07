import './Headers.css';
import { useNavigate } from 'react-router-dom';

function Header({ onMenuClick, username = "김유빈", isOpen, onClose }) {
  const navigate = useNavigate();
  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      {/* 헤더 상단 바 */}
      <div className="header">
        <div className="menuButton" onClick={onMenuClick}>
          &#9776;
        </div>
        <div>
          <img className='logo-box2' src={`/images/scopsLogo.png`}></img>
        </div>
        <div className="username">
          <span>안녕하세요, <br />{username}님</span>
        </div>
      </div>

      {isOpen && <div className="overlay" onClick={onClose}></div>}

      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
        <button className='sideMyPageBtn' onClick={() => handleNavigation('/scops/myPage')}>MY</button>
        <div>
          <span className='sidefont'>김유빈</span>
          <span>기수</span><br />
          <span>포지션</span>
        </div>
        <ul className="menu-list">
          <li className='menu-list-li' onClick={() => handleNavigation('/scops/main')}>홈</li>
          <li className='menu-list-li' onClick={() => handleNavigation('/scops/reservation')}>예약</li>
          <li className='menu-list-li' onClick={() => handleNavigation('/scops/songRegister')}>곡 등록</li>
          <li className='menu-list-li' onClick={() => handleNavigation('/scops/calender')}>캘린더</li>
          <li className='menu-list-li' onClick={() => handleNavigation('/scops/timeTable')}>시간표</li>
        </ul>
      </div>
    </>
  );
}

export default Header;
