import './LoginPage.css';
import Swal from 'sweetalert2';
import { useAuth } from "../context/AuthContext.js";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

function LoginPage() {

  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (studentId.trim() === "" || password.trim() === "") {
      Swal.fire({
        title: '로그인 실패',
        text: '아이디와 비밀번호를 입력해주세요.',
        width: '400px',
        icon: 'error'
      });
    }
    else {
      axios.post(`${process.env.REACT_APP_API_URL}/scops/login`, {
        userID: studentId,
        password: password,
      })
        .then(response => {
          console.log('로그인 성공:', response.data);

          if (response.data && response.data.user) {
            // 🔥 [핵심 수정] 서버가 주는 이름(userName, userYear)으로 데이터를 꺼냅니다.
            const { userName, userYear, session, role } = response.data.user;

            // 🔥 [핵심 수정] 우리가 앱에서 쓸 이름(name, year)으로 바꿔서 뭉쳐줍니다.
            const userInfo = {
              name: userName,  // 서버의 userName을 -> 우리의 name으로 저장
              year: userYear,  // 서버의 userYear를 -> 우리의 year로 저장
              session: session,
              role: role
            };

            // Context 업데이트
            setUser(userInfo);

            // JWT 토큰 저장
            localStorage.setItem('token', response.data.token);

            // ADMIN 역할 저장
            localStorage.setItem('role', role);

            // 유저 정보 저장 (이제 name과 year가 올바르게 들어갑니다)
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            navigate('/scops/main');
          } else {
            // ... (기존 에러 처리 코드 유지)
            Swal.fire({
              title: '로그인 실패',
              text: '서버에서 사용자 정보를 받지 못했습니다.',
              width: '400px',
              icon: 'error'
            });
          }
        })
        .catch(error => {
          console.error('로그인 실패:', error.response?.data || error.message);
          Swal.fire({
            title: '로그인 실패',
            text: '아이디 혹은 비밀번호를 확인해주세요.',
            width: '400px',
            icon: 'error'
          });
        });
    }
  };

  const handleRegisterClick = () => {
    navigate('/scops/register');
  };

  return (
    <div className="app-container">
      <div className="App">
        <div className="login-container">
          <div className="logo-box">
            <img src={`/images/scopsLogo.png`} alt="Scops Logo" />
          </div>
          <p className="slogan">SCOPS</p>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="학번"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="input-box"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-box"
            />
            <button type="submit" style={{ display: 'none' }}></button>
          </form>
          <p className="register-link" onClick={handleRegisterClick} style={{ cursor: 'pointer' }}>
            신규 부원 등록
          </p>
          <button
            type="button"
            className="login-button"
            onClick={handleLogin}
          >
            LOGIN
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;