import './LoginPage.css';
import Swal from 'sweetalert2';
import { useAuth } from "../context/AuthContext.js";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api';
import '../components/SweetAlertCustom.css';

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
        icon: 'error',

        buttonsStyling: false,
        confirmButtonText: 'OK',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm',
        }
      });
    }
    else {
      api.post('/scops/login', {
        userID: studentId,
        password: password,
      })
        .then(response => {
          //console.log('로그인 성공:', response.data);

          if (response.data && response.data.user) {
            const { userName, userYear, session, role } = response.data.user;

            const userInfo = {
              name: userName,
              year: userYear,
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
            Swal.fire({
              title: '로그인 실패',
              html: '아이디 혹은 비밀번호를<br>확인해주세요.',
              icon: 'error',

              buttonsStyling: false,
              confirmButtonText: 'OK',
              customClass: {
                popup: 'my-swal-popup',
                title: 'my-swal-title',
                confirmButton: 'my-swal-confirm',
              }
            });
          }
        })
        .catch(error => {
          console.error('로그인 실패:', error.response?.data.message || error.message);
          Swal.fire({
            title: '로그인 실패',
            html: error.response?.data.message,
            icon: 'error',

            buttonsStyling: false,
            confirmButtonText: 'OK',
            customClass: {
              popup: 'my-swal-popup',
              title: 'my-swal-title',
              confirmButton: 'my-swal-confirm',
            }
          });
        });
    }
  };

  const handleRegisterClick = () => {
    navigate('/scops/register');
  };

  return (
    <div className="App">
      <div className="app-container">
        <div className="login-container">
          <div className="logo-box">
            <img src={`/images/scopsandlogo.png`} alt="Scops Logo" />
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="tel"
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
            <img src='/images/LOGIN.png' alt='로그인버튼' width="20%"></img>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;