import './UserRegisterPage.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// 라디오 버튼 목록: label은 화면에 표시, value는 저장용
const sectionList = [
  { label: "보컬", value: "V" },
  { label: "기타", value: "G" },
  { label: "베이스", value: "B" },
  { label: "드럼", value: "D" },
  { label: "건반", value: "P" },
  { label: "직접 입력", value: "etc" }
];


const UserRegisterPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordConfirm, setUserPasswordConfirm] = useState("");
  const [userName, setUserName] = useState("");
  const [userYear, setUserYear] = useState("");
  const [userSession, setUserSession] = useState("");
  const [customSession, setCustomSession] = useState("");

  const isFormValid =
    userId.trim() !== "" &&
    userPassword.trim() !== "" &&
    userPasswordConfirm.trim() !== "" &&
    userName.trim() !== "" &&
    userYear.trim() !== "" &&
    userSession.trim() !== "" &&
    (userSession !== "etc" || customSession.trim() !== "");

  const handleUserRegister = () => {
    if (!isFormValid) {
      Swal.fire({
        text: '모든 항목을 입력해주세요.',
        width: '400px',
        icon: 'error'
      });
      return;
    }
    if (userPassword !== userPasswordConfirm) {
      Swal.fire({
        title: '에러',
        text: '비밀번호가 일치하지 않습니다. 다시 확인해주세요.',
        width: '400px',
        icon: 'error'
      });
      return;
    }

    axios.post(`${process.env.REACT_APP_API_URL}/scops/userRegister`, {
      userName,
      userYear,
      session: userSession === "etc" ? customSession : userSession,
      userID: userId,
      userPassword,
    })
      .then(res => {
        console.log('회원가입:', res.data);
        Swal.fire({
          title: '성공',
          text: '회원가입이 완료되었습니다.',
          width: '400px',
          icon: 'success'
        });
        navigate('/scops/login');
      })
      .catch(err => {
        console.error('회원가입 실패:', err);
      });
  };

  return (
    <div className="app-container">
      <div className="App">
        <div className='register-container'>
          <div className='logo-box'>
            <img src={`/images/scopsLogo.png`} alt="Scops Logo" />
          </div>

          <input
            type="text"
            placeholder="이름"
            value={userName}
            onChange={(e) => {
              const value = e.target.value;

              if (/[0-9]/.test(value)) {
                Swal.fire({
                  icon: 'error',
                  text: '이름에는 숫자를 입력할 수 없습니다.',
                  width: '400px'
                });
                return;
              }

              setUserName(value);
            }}
            className="userinput-box"
          />

          <input
            type="text"
            placeholder="기수 입력"
            value={userYear}
            onChange={(e) => {
              const value = e.target.value;

              if (!/^[0-9]*$/.test(value)) {
                Swal.fire({
                  icon: 'error',
                  text: '기수는 숫자만 입력 가능합니다.',
                  width: '400px'
                });
                return;
              }

              setUserYear(value);
            }}
            className="userinput-box"
          />


          {/* 세션 라디오 버튼 */}
          <div className="usersinput-box">
            <span style={{ color: "#8f8686ff", fontSize: "14px" }}>세션</span>
          </div>
          <div className="radio-group">
            {sectionList.map((sec, idx) => (
              <React.Fragment key={idx}>
                <label style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="session"
                    value={sec.value}
                    checked={userSession === sec.value}
                    onChange={() => {
                      setUserSession(sec.value);
                      if (sec.value !== "etc") setCustomSession("");
                    }}
                  />
                  {sec.label}
                </label>

                {sec.value === "etc" && userSession === "etc" && (
                  <input
                    type="text"
                    placeholder="직접 입력"
                    value={customSession}
                    onChange={(e) => setCustomSession(e.target.value)}
                    className="input-etc"
                    style={{ margin: '5px auto 0', display: 'block' }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>



          <input
            type="text"
            placeholder="학번"
            value={userId}
            onChange={(e) => {
              const value = e.target.value;

              if (!/^[0-9]*$/.test(value)) {
                Swal.fire({
                  icon: 'error',
                  text: '학번은 숫자만 입력 가능합니다.',
                  width: '400px'
                });
                return;
              }

              setUserId(value);
            }}
            className="userinput-box"
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            className="userinput-box"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={userPasswordConfirm}
            onChange={(e) => setUserPasswordConfirm(e.target.value)}
            className="userinput-box"
          />
          <button
            onClick={handleUserRegister}
            disabled={!isFormValid}
            className={`submit-button ${isFormValid ? "" : "disabled"}`}
          >
            등 록 완 료
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserRegisterPage;