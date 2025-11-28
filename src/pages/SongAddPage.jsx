import './SongAddPage.css';
import Headers from '../components/Headers';
import Swal from 'sweetalert2';
import '../components/Headers.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { jwtDecode } from "jwt-decode";

function SongAddPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // ---------------------
  // 🔥 상태값
  // ---------------------
  const [eventList, setEventList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const role = localStorage.getItem("role");

  // 🔥 [수정] 모달 관련 상태
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    eventName: "",
    createdDate: "",
    endDate: ""
  });

  const [songName, setSongName] = useState('');
  const [singerName, setSingerName] = useState('');
  const [sessions, setSessions] = useState([{ type: '', name: '' }]);
  const token = localStorage.getItem('token');

  let decoded = null;
  if (token) {
    try {
      decoded = jwtDecode(token);
    } catch (err) {
      console.error("JWT decode error", err);
    }
  }

  // ---------------------
  // 🔥 행사명 불러오기 함수 (재사용을 위해 분리)
  // ---------------------
  const fetchEvents = () => {
    api.get(`/songs/events`)
      .then(res => {
        setEventList(res.data);
        // 리스트가 있고 선택된게 없으면 첫번째꺼 선택
        if (res.data.length > 0 && !selectedEvent) {
          setSelectedEvent(res.data[0]);
        }
      })
      .catch(err => console.error('행사명 불러오기 실패:', err));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 드롭다운 외부 클릭 처리
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // 세션 입력 핸들러
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
    if (updated.length === 0) {
      updated.push({ type: 'V', name: '' });
    }
    setSessions(updated);
  };

  // ---------------------
  // 🔥 [신규] 행사 추가 로직
  // ---------------------
  const handleAddEvent = async () => {
    if (!newEventData.eventName || !newEventData.createdDate || !newEventData.endDate) {
      Swal.fire({ icon: "warning", text: "모든 정보를 입력해주세요.", width: "300px" });
      return;
    }

    try {
      // 백엔드로 행사 저장 요청
      await api.post('/songs/events/new', newEventData);
      
      Swal.fire({ icon: "success", text: "행사가 추가되었습니다!", width: "300px" });
      
      // 모달 닫기 및 초기화
      setShowEventModal(false);
      setNewEventData({ eventName: "", createdDate: "", endDate: "" });
      
      // 목록 새로고침 및 방금 추가한 행사 자동 선택
      fetchEvents();
      setSelectedEvent(newEventData.eventName);
      
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", text: error.response?.data || "행사 추가 실패", width: "300px" });
    }
  };

  // ---------------------
  // 🔥 곡 등록 처리
  // ---------------------
  const handleSubmit = async () => {
    if (!selectedEvent) {
      Swal.fire({ icon: "error", text: "행사명을 선택해주세요.", width: "400px" });
      return;
    }

    const formattedSessions = sessions.map(s => ({
      sessionType: s.type,
      playerName: s.name,
    }));

    const payload = {
      eventName: selectedEvent,
      songName,
      singerName,
      userName: decoded.name,
      sessions: formattedSessions,
    };

    try {
      await api.post(`/songs`, payload);
      Swal.fire({ title: '성공!', text: '등록 완료!', width: '400px', icon: 'success' });
      navigate('/scops/songRegister', { state: { eventName: selectedEvent } });
    } catch (err) {
      Swal.fire({ title: '실패!', text: '등록 실패!', width: '400px', icon: 'error' });
    }
  };

  return (
    <div className="app-container">
      <div className="App">
        <Headers onMenuClick={toggleMenu} username={decoded.name} isOpen={menuOpen} onClose={closeMenu} />

        <div className="songAdd-wrapper">
          <div className="songAdd-mainContainer">

            {/* 행사명 드롭다운 */}
            <div className="songAdd-event-dropdown" ref={dropdownRef} style={{ position: "relative" }}>
              <div className="custom-select-display" onClick={() => setDropdownOpen(prev => !prev)}>
                {selectedEvent || "행사 선택"}
                <span>▼</span>
              </div>

              {dropdownOpen && (
                <ul className="custom-select-list">
                  {eventList.map((e, idx) => (
                    <li key={idx} onClick={() => { setSelectedEvent(e); setDropdownOpen(false); }} className="custom-select-list-item">
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 🔥 [수정] ADMIN용 행사 추가 버튼 */}
            <div className="songAdd-mainContainer-eventOption">
              {role === "ADMIN" && (
                <button className="add-event-btn" onClick={() => setShowEventModal(true)}>
                  + 새 행사 만들기
                </button>
              )}

              <input type="text" value={songName} onChange={(e) => setSongName(e.target.value)} placeholder="곡 제목" />
              <input type="text" value={singerName} onChange={(e) => setSingerName(e.target.value)} placeholder="가수" />
            </div>

            {/* 세션 입력 */}
            <div className="songAdd-mainContainer-session">
              {sessions.map((session, idx) => (
                <div className="session-input" key={idx}>
                  <select value={session.type} onChange={(e) => handleSessionChange(idx, 'type', e.target.value)}>
                    <option value="" disabled hidden>포지션</option>
                    <option value="V">Vocal</option>
                    <option value="B">Bass</option>
                    <option value="D">Drum</option>
                    <option value="G">Guitar</option>
                    <option value="P">Piano</option>
                    <option value="Vi">Violin</option>
                    <option value="C">Cajon</option>
                    <option value="etc">etc</option>
                  </select>
                  <input type="text" value={session.name} className="songadd-input" onChange={(e) => handleSessionChange(idx, 'name', e.target.value)} placeholder="이름" />
                  <button type="button" className="delete-button" onClick={() => removeSessionInput(idx)}>&times;</button>
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

        {/* 🔥 [신규] 행사 추가 모달 */}
        {showEventModal && (
          <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">새 행사 추가</div>
              
              <div className="modal-input-group">
                <label>행사명</label>
                <input 
                  type="text" 
                  className="modal-input"
                  placeholder="예: 2025 정기공연"
                  value={newEventData.eventName}
                  onChange={(e) => setNewEventData({...newEventData, eventName: e.target.value})}
                />
              </div>

              <div className="modal-input-group">
                <label>시작일</label>
                <input 
                  type="date" 
                  className="modal-input"
                  value={newEventData.createdDate}
                  onChange={(e) => setNewEventData({...newEventData, createdDate: e.target.value})}
                />
              </div>

              <div className="modal-input-group">
                <label>종료일</label>
                <input 
                  type="date" 
                  className="modal-input"
                  value={newEventData.endDate}
                  onChange={(e) => setNewEventData({...newEventData, endDate: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button className="modal-btn cancel" onClick={() => setShowEventModal(false)}>취소</button>
                <button className="modal-btn save" onClick={handleAddEvent}>저장</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default SongAddPage;