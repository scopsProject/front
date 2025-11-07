import './LoginPage.css';
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
  if(studentId.trim() === "" || password.trim() === "")
  {
    alert("아이디와 비밀번호를 입력해주세요.")
  }
  else
  {
    axios.post('/api/scops/login', {
    userID: studentId,
    password: password,
  })
  .then(response => {
  console.log('로그인 성공:', response.data);
  if (response.data && response.data.user) {
    const { userName, userYear, session } = response.data.user; // userInfo에서 가져오기
    setUser({ userName, userYear, session });
    localStorage.setItem('token', response.data.token); // 토큰 저장
    navigate('/scops/main');
  } else {
    alert("로그인 실패: 사용자 정보가 없습니다.");
  }
})

  .catch(error => {
    console.error('로그인 실패:', error.response?.data || error.message);
    alert("로그인 실패: 아이디 혹은 비밀번호를 확인해주세요.");
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
            <button type="submit" className="login-button">
              <span style={{ color: '#876400' }}>LOGIN</span>
            </button>
          </form>
          <p className="register-link" onClick={handleRegisterClick} style={{ cursor: 'pointer' }}>
            신규 부원 등록
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
