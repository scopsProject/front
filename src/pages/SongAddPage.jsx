import './SongAddPage.css';
import Headers from '../components/Headers';
import Swal from 'sweetalert2';
import '../components/Headers.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api';

function SongAddPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [songName, setSongName] = useState('');
  const [singerName, setSingerName] = useState('');
  const [sessions, setSessions] = useState([{ type: '', name: '' }]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleSessionChange = (index, field, value) => {
    const updated = [...sessions];
    updated[index][field] = value;
    setSessions(updated);
  };

  const addSessionInput = () => {
    setSessions([...sessions, { type: '', name: '' }]);
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
      await api.post(`/songs`, payload);
      Swal.fire({
        title: '성공!',
        text: '등록 완료!',
        width: '400px',
        icon: 'success'
      });
      navigate('/scops/songRegister', { state: { eventName: eventName } });
    } catch (err) {
      Swal.fire({
        title: '실패!',
        text: '등록 실패!',
        width: '400px',
        icon: 'error'
      });
    }
  };


  return (
    <div className="app-container">
      <div className="App">
        <Headers onMenuClick={toggleMenu} username="김유빈" isOpen={menuOpen} onClose={closeMenu} />
        <div className="songAdd-wrapper">
          <div className="songAdd-mainContainer">
            <div className="songAdd-mainContainer-eventName">
              <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="행사명" />
            </div>

            <div className="songAdd-mainContainer-eventOption">
              <input type="text" value={songName} onChange={(e) => setSongName(e.target.value)} placeholder="곡 제목" />
              <input type="text" value={singerName} onChange={(e) => setSingerName(e.target.value)} placeholder="가수" />
            </div>

            <div className="songAdd-mainContainer-session">
              {sessions.map((session, idx) => (
                <div className="session-input" key={idx}>
                  <select value={session.type} onChange={(e) => handleSessionChange(idx, 'type', e.target.value)} placeholder="포지션">
                    <option value="" disabled hidden>
                      포지션
                    </option>
                    <option value="V" placeholder="포지션">Vocal</option>
                    <option value="B" placeholder="포지션">Bass</option>
                    <option value="D" placeholder="포지션">Drum</option>
                    <option value="G" placeholder="포지션">Guitar</option>
                    <option value="P" placeholder="포지션">Piano</option>
                    <option value="Vi" placeholder="포지션">Violin</option>
                    <option value="C" placeholder="포지션">Cajon</option>
                    <option value="etc" placeholder="포지션">etc</option>
                  </select>
                  <input
                    type="text"
                    value={session.name}
                    className='songadd-input'
                    onChange={(e) => handleSessionChange(idx, 'name', e.target.value)}
                    placeholder="이름"
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
