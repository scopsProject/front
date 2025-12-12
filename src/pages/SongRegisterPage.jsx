import './SongRegisterPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../api';
import SongDetailView from '../pages/SongDetailView';   // 상세페이지 컴포넌트 추가

function SongRegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [songs, setSongs] = useState([]);
  const [eventNameData, setEventNameData] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 상세 조회 모달 상태
  const [selectedSong, setSelectedSong] = useState(null);

  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (eventName) => {
    setSelectedEvent(eventName);
    setDropdownOpen(false);
  };
  const reloadSongs = () => {
    api.get(`/songs/by-event?eventName=${encodeURIComponent(selectedEvent)}`)
      .then(res => setSongs(res.data))
      .catch(err => console.error('곡 목록 불러오기 실패:', err));
  };


  useEffect(() => {
    api.get(`/songs/events`)
      .then(res => {
        const fetchedEvents = res.data;
        const incomingEvent = location.state?.eventName;

        const mergedEvents = incomingEvent && !fetchedEvents.includes(incomingEvent)
          ? [...fetchedEvents, incomingEvent]
          : fetchedEvents;

        setEventNameData(mergedEvents);

        if (incomingEvent) {
          setSelectedEvent(incomingEvent);
        } else if (mergedEvents.length > 0) {
          setSelectedEvent(mergedEvents[0]);
        }
      })
      .catch(err => console.error('행사명 불러오기 실패:', err));
  }, [location.state]);

  useEffect(() => {
    if (!selectedEvent) return;

    api.get(`/songs/by-event?eventName=${encodeURIComponent(selectedEvent)}`)
      .then(res => {
        setSongs(res.data);
      })
      .catch(err => {
        console.error('곡 목록 불러오기 실패:', err);
        setSongs([]);
      });
  }, [selectedEvent]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="app-container">
      <div className="App">

        <Headers onMenuClick={toggleMenu} username="김유빈" isOpen={menuOpen} onClose={closeMenu} />

        <div className='songResister-mainContainer'>

          {/* 행사명 드롭다운 */}
          <div className='songResister-mainContainer-eventName' ref={dropdownRef} style={{ position: 'relative' }}>
            <div className="custom-select-display"
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              {selectedEvent || '행사 선택'}
              <span>▼</span>
            </div>

            {dropdownOpen && (
              <ul className="custom-select-list">
                {eventNameData.map((eventName, idx) => (
                  <li key={idx} onClick={() => handleSelect(eventName)} className="custom-select-list-item">
                    {eventName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 곡 리스트 */}
          <div className='songResister-mainContainer-songs'>
            {songs.length > 0 ? (
              songs.map((item, idx) => (
                <div
                  key={idx}
                  className="song-item"
                  onClick={() => setSelectedSong(item)}  // ✨ 클릭 시 상세 조회 열림
                >
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

        {/* 플러스 버튼 */}
        <div className='songResister-btnPlus'>
          <button className="plus-button" onClick={() => handleNavigation('/scops/songAdd')}>+</button>
        </div>

        {/* ✨ 상세조회 모달 컴포넌트 */}
        {selectedSong && (
          <SongDetailView
            song={selectedSong}
            onClose={() => setSelectedSong(null)}
            eventName={selectedEvent}
            reloadSongs={reloadSongs}
          />
        )}

      </div>
    </div>
  );
}

export default SongRegisterPage;
