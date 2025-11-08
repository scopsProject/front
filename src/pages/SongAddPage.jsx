import './SongAddPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

function SongAddPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [songName, setSongName] = useState('');
  const [singerName, setSingerName] = useState('');
  const [sessions, setSessions] = useState([{ type: 'V', name: '' }]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleSessionChange = (index, field, value) => {
    const updated = [...sessions];
    updated[index][field] = value;
    setSessions(updated);
  };

  const addSessionInput = () => {
    setSessions([...sessions, { type: 'V', name: '' }]);
  };

  const removeSessionInput = (index) => {
    const updated = [...sessions];
    updated.splice(index, 1);

    // 세션이 0개가 되면 기본 세션 하나 추가
    if (updated.length === 0) {
      updated.push({ type: 'V', name: '' });
    }

    setSessions(updated);
  };
  const handleSubmit = async () => {
  // sessions 배열 키 이름 맞추기
  const formattedSessions = sessions.map(s => ({
    sessionType: s.type,
    playerName: s.name,
  }));

  const payload = {
    eventName,
    songName,
    singerName,
    userName: "김유빈",
    sessions: formattedSessions,
  };

  try {
    await axios.post('http://localhost:8080/api/songs', payload);
    alert('등록 완료!');
    navigate('/scops/songRegister', { state: { eventName: eventName } });
  } catch (err) {
    alert('등록 실패!');
  }
};


  return (
    <div className="app-container">
      <div className="App">
        <Headers onMenuClick={toggleMenu} username="김유빈" isOpen={menuOpen} onClose={closeMenu} />
        <div className="songAdd-wrapper">
        <div className="songAdd-mainContainer">
          <div className="songAdd-mainContainer-eventName">
            <label>행사 이름</label>
            <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="예: 2025 정기공연" />
          </div>

          <div className="songAdd-mainContainer-eventOption">
            <label>곡명</label>
            <input type="text" value={songName} onChange={(e) => setSongName(e.target.value)} placeholder="예: 첫눈" />
            <label>가수명</label>
            <input type="text" value={singerName} onChange={(e) => setSingerName(e.target.value)} placeholder="예: 김유빈" />
          </div>
          
          <div className="songAdd-mainContainer-session">
            {sessions.map((session, idx) => (
              <div className="session-input" key={idx}>
                <select value={session.type} onChange={(e) => handleSessionChange(idx, 'type', e.target.value)}>
                  <option value="V">Vocal</option>
                  <option value="B">Bass</option>
                  <option value="D">Drum</option>
                  <option value="G">Guitar</option>
                  <option value="P">Piano</option>
                  <option value="Vi">Violin</option>
                  <option value="C">Cajon</option>
                  <option value="etc">etc</option>
                </select>
                <input
                  type="text"
                  value={session.name}
                  onChange={(e) => handleSessionChange(idx, 'name', e.target.value)}
                  placeholder="이름 입력"
                />
                <button
                    type="button"
                    className="delete-button"
                    onClick={() => removeSessionInput(idx)}
                    aria-label="삭제"
                  >
                    &times;
                  </button>
              </div>
            ))}
            <div className="songAdd-btnPlus">
              <button className="plus-button" onClick={addSessionInput}>+</button>
            </div>
          </div>
        </div>
        </div>
        <div className="songAdd-btnSubmit">
            <button className="register-button" onClick={handleSubmit}>등록</button>
          </div>
      </div>
    </div>
  );
}

export default SongAddPage;
