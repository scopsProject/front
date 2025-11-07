import './SongRegisterPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function SongRegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [songs, setSongs] = useState([]);
  const [eventNameData, setEventNameData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 메뉴 토글
  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

  // 외부 클릭 시 드롭다운 닫기 처리
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드롭다운 항목 클릭 시 선택
  const handleSelect = (eventName) => {
    setSelectedEvent(eventName);
    setDropdownOpen(false);
  };

  // 행사 목록 최초 로드 + location.state.eventName 반영
  useEffect(() => {
    axios.get('http://localhost:8080/api/songs/events')
      .then(res => {
        const fetchedEvents = res.data;
        console.log('행사명 목록:', fetchedEvents);

        const incomingEvent = location.state?.eventName;

        // location.state.eventName이 목록에 없으면 추가
        const mergedEvents = incomingEvent && !fetchedEvents.includes(incomingEvent)
          ? [...fetchedEvents, incomingEvent]
          : fetchedEvents;

        setEventNameData(mergedEvents);

        // selectedEvent 설정: location.state.eventName 우선, 없으면 목록 첫번째
        if (incomingEvent) {
          setSelectedEvent(incomingEvent);
        } else if (mergedEvents.length > 0) {
          setSelectedEvent(mergedEvents[0]);
        }
      })
      .catch(err => console.error('행사명 불러오기 실패:', err));
  }, [location.state]);

  // selectedEvent가 바뀌면 해당 행사곡 리스트 로드
  useEffect(() => {
    if (!selectedEvent) return;

    axios.get(`http://localhost:8080/api/songs/by-event?eventName=${encodeURIComponent(selectedEvent)}`)
      .then(res => {
        setSongs(res.data);
      })
      .catch(err => {
        console.error('곡 목록 불러오기 실패:', err);
        setSongs([]); // 에러시 빈 배열 처리
      });
  }, [selectedEvent]);


  // + 버튼 클릭 시 등록 페이지 이동
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="app-container">
      <div className="App">
        <Headers onMenuClick={toggleMenu} username="김유빈" isOpen={menuOpen} onClose={closeMenu} />
        <div className='songResister-mainContainer'>
          <div
            className='songResister-mainContainer-eventName'
            ref={dropdownRef}
            style={{ position: 'relative' }}
          >
            {/* 선택된 이벤트 표시용 div */}
            <div
              className="custom-select-display"
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              {selectedEvent || '행사 선택'}
              {/* ▼ 화살표 */}
              <span >▼</span>
            </div>

            {/* 드롭다운 목록 */}
            {dropdownOpen && (
              <ul className="custom-select-list">
                {eventNameData.map((eventName, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelect(eventName)}
                    className="custom-select-list-item"
                  >
                    {eventName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 기존 노래 리스트 */}
          <div className='songResister-mainContainer-songs'>
            {songs.length > 0 ? (
              songs.map((item, idx) => (
                <div key={idx} className="song-item">
                  <span className='song-item-subject'>{item.songName}</span>
                  <span className='song-item-singerName'>{item.singerName}</span>
                  <span className="song-item-playerName">
                    {item.sessions.map(s => (
                      <span key={s.sessionType + s.playerName}>
                        {s.sessionType}.{s.playerName}
                      </span>
                    ))}
                  </span>
                </div>
              ))
            ) : (
              <div>데이터가 없습니다.</div>
            )}
          </div>
        </div>

        <div className='songResister-btnPlus'>
          <button className="plus-button" onClick={() => handleNavigation('/scops/songAdd')}>+</button>
        </div>
      </div>
    </div>
  );
}

export default SongRegisterPage;
