import './Headers.css';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Header({ onMenuClick, isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  const logout = () => {
    localStorage.removeItem("token"); // 토큰 삭제
    setUser(null);
    handleNavigation('/scops/login')        // 로그인 페이지 이동
  };

  const deleteUser = async () => {
  try {
    // 탈퇴 확인
    const confirmDelete = window.confirm("정말 탈퇴하시겠습니까?");
    if (!confirmDelete) return; // 취소하면 함수 종료

    const token = localStorage.getItem("token");
    if (!token) return alert("로그인 상태가 아닙니다.");

    await axios.delete("http://localhost:8080/scops/deleteUser", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    localStorage.removeItem("token");
    setUser(null);
    navigate("/scops/login");
    alert("회원 탈퇴 성공");

  } catch (error) {
    console.error(error);
    alert("회원 탈퇴 중 오류가 발생했습니다.");
  }
};


  return (
    <>
      {/* 헤더 상단 바 */}
      <div className="header">
        <div className="menuButton" onClick={onMenuClick}>
          &#9776;
        </div>
        <div>
          <img className='logo-box2' src={`/images/scopsLogo.png`} alt='로고'></img>
        </div>
        <div className="username">
          {user ? (
            <span>안녕하세요, <br/>{user.userName}님</span>
          ) : (
            <span>로그인 해주세요</span>
          )}
        </div>
      </div>

      {isOpen && <div className="overlay" onClick={onClose}></div>}

      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
  <button className='sideMyPageBtn' onClick={() => handleNavigation('/scops/myPage')}>MY</button>
  
  <div className='menu-container'>
    {user && (
      <>
        <span className='sidefont'>{user.userName}</span>
        <span>{user.userYear}기</span><br/>
        <span>{user.session}</span>
      </>
    )}

    <ul className="menu-list">
      <li className='menu-list-li' onClick={() => handleNavigation('/scops/main')}>홈</li>
      <li className='menu-list-li' onClick={() => handleNavigation('/scops/reservation')}>예약</li>
      <li className='menu-list-li' onClick={() => handleNavigation('/scops/songRegister')}>곡 등록</li>
      <li className='menu-list-li' onClick={() => handleNavigation('/scops/calender')}>캘린더</li>
      <li className='menu-list-li' onClick={() => handleNavigation('/scops/timeTable')}>시간표</li>
    </ul>
  </div>

  {/* 버튼은 항상 맨 아래 */}
  <div className="menu-buttons">
    <button className='logoutBtn' onClick={logout}>로그아웃</button>
    <button className='userOutBtn' onClick={deleteUser}>탈퇴</button>
  </div>
</div>

    </>
  );
}

export default Header;
