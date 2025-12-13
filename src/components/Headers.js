import './Headers.css';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Header({ onMenuClick, isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const clickCountRef = useRef(0);

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  const logout = async () => {
    const confirmLogout = await Swal.fire({
      title: '로그아웃 하시겠습니까?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '로그아웃',
      cancelButtonText: '취소',
      reverseButtons: true,
      width: '400px'
    });

    if (!confirmLogout.isConfirmed) return;

    // 실제 로그아웃 처리
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    setUser(null);

    setTimeout(() => {
      navigate('/scops/login');
    }, 0);
  };


  const handleLogoClick = () => {
  clickCountRef.current++;

  // 🎉 10번 클릭 → 이스터에그 팝업
  if (clickCountRef.current === 10) {
    Swal.fire({
      html: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <p style="font-size:18px; font-family:suit; margin-bottom:10px; color:#876400;">
            스콥스의 뜻은 음유시인이라는 것!</br>알고 계셨나요?
          </p>
          <img src="/images/image.png" style="width:250px; height:auto;" />
          <p style="font-size:16px; font-family:suit; margin-bottom:10px; color:#876400;">
            당신은 특별한 음유시인을 발견하셨습니다! 음유시인이 당신에게 행운을 깃들게 합니다!
          </p>
        </div>
      `,
      background: '#ffffff',
      backdrop: 'rgba(0,0,0,0.5)',
      showConfirmButton: false,
      width: 350,
      padding: '20px 10px',
    });

    clickCountRef.current = 0;
    return; // ❗여기서 끝내야 메인페이지로 이동하지 않음
  }

  // 🏃 10번이 아니면 → 바로 메인 페이지로 이동
  navigate('/scops/main');

  // ⏱ 1.5초 동안 추가 클릭 없으면 카운트 초기화
  setTimeout(() => {
    clickCountRef.current = 0;
  }, 1500);
};



  const deleteUser = async () => {
    try {
      // 탈퇴 확인
      const confirmDelete = await Swal.fire({
        title: '정말 탈퇴하시겠습니까?',
        text: '탈퇴하면 계정 정보를 복구할 수 없습니다.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '탈퇴',
        cancelButtonText: '취소',
        reverseButtons: true,
        width: '400px'
      });

      if (!confirmDelete.isConfirmed) return;


      const token = localStorage.getItem("token");
      if (!token) return alert("로그인 상태가 아닙니다.");

      await axios.delete(`${process.env.REACT_APP_API_URL}/scops/deleteUser`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      setUser(null);
      navigate("/scops/login");
      Swal.fire({
        text: '회원 탈퇴 성공',
        width: '400px',
        icon: 'success'
      });

    } catch (error) {
      console.error(error);
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  };

  if (!user) {
    return null; // 화면에 아무것도 그리지 않고 에러 방지
  }
  return (
    <>
      {/* 헤더 상단 바 */}
      <div className="header">
        <div className="menuButton" onClick={onMenuClick}>
          &#9776;
        </div>
        <div>
          <img className='logo-box2' src={`/images/scopsLogo.png`} onClick={handleLogoClick} alt='로고'></img>
        </div>
        <div className="username" onClick={() => handleNavigation('/scops/myPage')}>
          {user ? (
            <span>안녕하세요, <br />{user.name}님</span>
          ) : (
            <span>로그인 해주세요</span>
          )}
        </div>
      </div>

      {isOpen && <div className="overlay" onClick={onClose}></div>}

      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
        <button className='sideMyPageBtn' onClick={() => handleNavigation('/scops/myPage')}>MY</button>

        <div className='menu-container'>
          <ul className="menu-list">
            <li className='menu-list-li' onClick={() => handleNavigation('/scops/main')}>홈</li>
            <li className='menu-list-li' onClick={() => handleNavigation('/scops/reservation')}>예약</li>
            <li className='menu-list-li' onClick={() => handleNavigation('/scops/songRegister')}>곡 등록</li>
            <li className='menu-list-li' onClick={() => handleNavigation('/scops/calender')}>캘린더</li>
            <li className='menu-list-li' onClick={() => handleNavigation('/scops/timeTable')}>시간표</li>
            {user.role === 'ADMIN' && (
              <li className='menu-list-li' onClick={() => handleNavigation('/scops/management')}>관리자페이지</li>
            )}
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
