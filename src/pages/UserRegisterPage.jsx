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
];


const UserRegisterPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordConfirm, setUserPasswordConfirm] = useState("");
  const [userName, setUserName] = useState("");
  const [userYear, setUserYear] = useState("");
  const [userSession, setUserSession] = useState("");

  const [isExecutive, setIsExecutive] = useState(false); // 체크박스 상태
  const [execCode, setExecCode] = useState("");          // 입력 코드
  const [role, setRole] = useState("none");              // 기본 none
  const [execVerified, setExecVerified] = useState(false); // 인증 여부

  const EXECUTIVE_SECRET = "SCOPS2025";

  const isFormValid =
    userId.trim() !== "" &&
    userPassword.trim() !== "" &&
    userPasswordConfirm.trim() !== "" &&
    userName.trim() !== "" &&
    userYear.trim() !== "" &&
    userSession.trim() !== "";

  const handleExecVerify = () => {
    if (execCode === EXECUTIVE_SECRET) {
      Swal.fire({
        icon: "success",
        text: "임원 인증이 완료되었습니다.",
        width: "400px"
      });
      setExecVerified(true);
      setRole("ADMIN");
    } else {
      Swal.fire({
        icon: "error",
        text: "인증코드가 올바르지 않습니다.",
        width: "400px"
      });
      setExecVerified(false);
      setRole("none");
    }
  };
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
    if (isExecutive && !execVerified) {
      Swal.fire({
        icon: "error",
        text: "임원 인증을 먼저 완료해주세요.",
        width: "400px"
      });
      return;
    }
    axios.post(`${process.env.REACT_APP_API_URL}/scops/userRegister`, {
      userName,
      userYear,
      session: userSession,
      userID: userId,
      userPassword,
      role
    })
      .then(res => {
        console.log('회원가입:', res.data);
        Swal.fire({
          title: '성공',
          text: '회원가입이 신청이 완료되었습니다.',
          width: '400px',
          icon: 'success'
        });
        navigate('/scops/login');
      })
      .catch(err => {
        console.error('회원가입 실패:', err);
        const errorMessage = err.response?.data || "회원가입 중 오류가 발생했습니다.";

        Swal.fire({
          title: '회원가입 실패',
          text: errorMessage, // 👈 여기에 "이미 가입된 학번입니다."가 뜹니다.
          width: '400px',
          icon: 'error'
        });
      });
  };

  return (
    <div className="App">
      <div className="app-container">
        <div className='register-container'>
          <div className='register-logo-box'>
            <img src={`/images/scopsLogo.png`} alt="Scops Logo" />
          </div>

          <input
            type="text"
            placeholder="이름"
            value={userName}
            onChange={(e) => {
              const value = e.target.value;
              if (/[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ]/.test(value)) {
                Swal.fire({
                  icon: 'error',
                  text: '이름에는 한글과 영문만 입력 가능합니다. (공백, 숫자, 특수문자 불가)',
                  width: '400px'
                });
                return;
              }
              if (value.length > 5) {
                Swal.fire({
                  icon: 'error',
                  text: '이름은 최대 5글자까지 입력 가능합니다.',
                  width: '400px'
                });
                return;
              }

              setUserName(value);
            }}
            className="userinput-box"
          />

          <input
            type="tel"
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
          <div className="session-label-container">
            <span style={{ color: "#868688ff", fontSize: "14px", backgroundColor: "#FFFEF8" }}>
              세션 선택
            </span>
          </div>
          <div className="radio-group">
            {sectionList.map((sec, idx) => (
              <label key={idx} style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="session"
                  value={sec.value}
                  checked={userSession === sec.value}
                  onChange={() => setUserSession(sec.value)}
                />
                {sec.label}
              </label>
            ))}
          </div>
          <input
            type="tel"
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
          {/* 임원 체크박스 */}
          <div className="exec-check-container">
            <input
              type="checkbox"
              checked={isExecutive}
              onChange={(e) => {
                setIsExecutive(e.target.checked);

                if (!e.target.checked) {
                  setExecCode("");
                  setExecVerified(false);
                  setRole("none");
                }
              }}
            />
            <span style={{ whiteSpace: "nowrap", color:"#868688ff"}}>임원입니까?</span>

            <div className={`exec-auth-container ${isExecutive ? "active" : ""}`}>
              <input
                type="password"
                placeholder="인증코드"
                value={execCode}
                onChange={(e) => setExecCode(e.target.value)}
                className="exec-input"
              />
              <button
                onClick={handleExecVerify}
                className="exec-btn"
              >
                인증
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleUserRegister}
          disabled={!isFormValid}
          className={`submit-button2 ${isFormValid ? "" : "disabled"}`}
        >
          <img src={`/images/registerbtn.png`} alt='등록완료'></img>
        </button>
      </div>
    </div>
  );
};

export default UserRegisterPage;