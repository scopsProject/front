import './UserRegisterPage.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

const UserRegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    section: "",
    studentId: "",
    password: "",
    confirmPassword: "",
    etc: ""
  });

  const sectionList = [
    "보컬", "건반", "키보드", "일렉기타", "통기타", "베이스", "드럼", "기타"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log(form);
  };

  return (
    <div className="phone-frame">
      <div className="App">
        <div className='login-container'>
          <div className='logo-box'>
            <img src={`/images/scopsLogo.png`} alt="Scops Logo" />
          </div>
          <p className="register-form"></p>
          <input
            type="text"
            name="name"
            placeholder="이름"
            value={form.name}
            onChange={handleChange}
            className="input-box"
          />

          <div className="input-box">
            <div className="section-label">
              세션 <span className="section-note">-중복선택 가능</span>
            </div>
          </div>
            <div className="section-options">
              {sectionList.map((sec) => (
                <label key={sec} className="radio-label">
                  <input
                    type="radio"
                    name="section"
                    value={sec}
                    checked={form.section === sec}
                    onChange={handleChange}
                  />
                  <span>{sec}</span>
                </label>
              ))}
            </div>
            {form.section === "기타" && (
              <input
                type="text"
                name="etc"
                placeholder="직접 입력"
                value={form.etc}
                onChange={handleChange}
                className="input-etc"
              />
            )}

          <input
            type="text"
            name="studentId"
            placeholder="학번"
            value={form.studentId}
            onChange={handleChange}
            className="input-box"
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
            className="input-box"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            value={form.confirmPassword}
            onChange={handleChange}
            className="input-box"
          />

          <button
            onClick={handleSubmit}
            style={{ cursor: 'pointer'}}
            className="submit-button"
          >
            등 록 완 료
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserRegisterPage;
