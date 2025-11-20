import './ReservationPage.css';
import { useAuth } from "../context/AuthContext.js";
import Swal from 'sweetalert2';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '../api';

function ReservationPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [songs, setSongs] = useState([]);
  const [weekInfo, setWeekInfo] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const { user } = useAuth();
  const userName = user?.userName;
  const [eventList, setEventList] = useState([]);        
  const [songList, setSongList] = useState([]);          
  const [selectedEvent, setSelectedEvent] = useState(''); 
  const [selectedSong, setSelectedSong] = useState('');   
  
  // 🔔 알림 메시지 상태
  const [notification, setNotification] = useState(''); 

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // 드롭다운 오픈 상태 관리용
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [songDropdownOpen, setSongDropdownOpen] = useState(false);
  const [startTimeDropdownOpen, setStartTimeDropdownOpen] = useState(false);
  const [endTimeDropdownOpen, setEndTimeDropdownOpen] = useState(false);

  const eventRef = useRef(null);
  const songRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e) {
      if (eventRef.current && !eventRef.current.contains(e.target)) setEventDropdownOpen(false);
      if (songRef.current && !songRef.current.contains(e.target)) setSongDropdownOpen(false);
      if (startTimeRef.current && !startTimeRef.current.contains(e.target)) setStartTimeDropdownOpen(false);
      if (endTimeRef.current && !endTimeRef.current.contains(e.target)) setEndTimeDropdownOpen(false);
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔥 페이지 로드 시 초기 데이터 로딩 + SSE 연결
  useEffect(() => {
    const now = new Date();
    const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoDate = d.toISOString().slice(0, 10);

      result.push({
        date: isoDate,
        displayDate: `${mm}-${dd}`,
        day: shortWeekdays[d.getDay()]
      });
    }

    setWeekInfo(result);

    const startDate = result[0].date;             
    const endDate = result[result.length - 1].date; 

    // 1. 이번 주 예약 정보 가져오기
    api.get(`/songs/by-week?start=${startDate}&end=${endDate}`)
      .then(res => setSongs(res.data))
      .catch(err => console.error('이번 주 예약정보 실패:', err));

    // 2. 행사명 리스트 가져오기
    api.get('/songs/events')
      .then(res => setEventList(res.data))
      .catch(err => console.error('행사명 목록 실패:', err));


    // ============================================================
    // 🚀 3. SSE 실시간 연결
    // ============================================================
    console.log("SSE 연결 시도:", `${BASE_URL}/sse/subscribe`);
    const eventSource = new EventSource(`${BASE_URL}/sse/subscribe`);

    // (A) 연결 성공 시
    eventSource.addEventListener('connect', (e) => {
      console.log('SSE 연결 성공:', e.data);
    });

    // (B) 실시간 예약 알림 도착 시 ("new-reservation")
    eventSource.addEventListener('new-reservation', (e) => {
      try {
        const newReservation = JSON.parse(e.data);
        console.log('실시간 예약 알림 도착:', newReservation);

        // 1. 데이터 갱신: songs 상태 업데이트 -> 화면 리렌더링
        setSongs((prevSongs) => [...prevSongs, newReservation]);
        
        // 2. 🔔 [추가] 상단 알림 메시지 설정
        // 시간 포맷 깔끔하게 (13:00:00 -> 13:00)
        const start = newReservation.startTime ? newReservation.startTime.slice(0, 5) : "";
        const end = newReservation.endTime ? newReservation.endTime.slice(0, 5) : "";
        const song = newReservation.songName;

        // 알림 메시지 구성
        const msg = `${start} ~ ${end} - ${song}: 예약되었습니다!`;
        setNotification(msg);

        // 3초 뒤에 알림 끄기
        setTimeout(() => {
            setNotification('');
        }, 3000);

      } catch (error) {
        console.error('SSE 데이터 파싱 에러:', error);
      }
    });

    // (C) 에러 처리
    eventSource.onerror = (error) => {
      console.error('SSE 에러 발생 (연결 종료):', error);
      eventSource.close(); 
    };

    // 🧹 Clean-up
    return () => {
      console.log("SSE 연결 종료");
      eventSource.close();
    };
    
  }, []); 

    
  // 행사 선택 시 그에 맞는 곡 리스트 불러오기
  useEffect(() => {
    if (selectedEvent) {
      api.get(`/songs/by-event?eventName=${selectedEvent}`)
        .then(res => setSongList(res.data))
        .catch(err => console.error('곡 리스트 불러오기 실패:', err));
    } else {
      setSongList([]);
    }
  }, [selectedEvent]);

  const handleReservation = async () => {
    if (!selectedDate || !selectedEvent || !selectedSong || !startTime || !endTime) {
      Swal.fire('모든 항목을 선택해주세요.');
      return;
    }

    const selectedSongObj = songList.find(song => song.songName === selectedSong);
    const singerName = selectedSongObj ? selectedSongObj.singerName : '';
    const songRegisterId = selectedSongObj ? selectedSongObj.id : null;

    const requestBody = {
      eventName: selectedEvent,
      songName: selectedSong,
      singerName: singerName,
      userName: userName,
      date: selectedDate,
      startTime: startTime,
      endTime: endTime,
      songRegisterId: songRegisterId,
      sessions: [
        {
          date: selectedDate,
          startTime: startTime,
          endTime: endTime,
        }
      ]
    };

    try {
      await api.post(`/songs/reservation`, requestBody);
      Swal.fire('예약이 완료되었습니다!');
      
      // 예약 후 초기화
      setSelectedDate(null);
      setSelectedEvent('');
      setSelectedSong('');
      setStartTime('');
      setEndTime('');

    } catch (error) {
      console.error("예약 에러:", error);

      if (error.response && error.response.data) {
        if (error.response.data.message) {
           Swal.fire(error.response.data.message);
        } 
        else if (typeof error.response.data === 'string') {
           Swal.fire(error.response.data);
        } else {
           Swal.fire('예약 중 오류가 발생했습니다.');
        }
      } else {
        Swal.fire('서버와 연결할 수 없거나 알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  return (
    <div className="app-container">
      <div className="App">
        <Headers onMenuClick={toggleMenu} username={userName} isOpen={menuOpen} onClose={closeMenu} />
        
        {/* 🔔 [추가] 알림창 (notification 내용이 있을 때만 표시) */}
        {notification && (
            <div className="notification-banner">
                {notification}
            </div>
        )}

        <div className='reservation-calendar-grid-container'>
          <div className="reservation-calendar-grid">
            {weekInfo.map((day, index) => (
              <div
                key={index}
                className={`reservation-calendar-cell ${selectedDate === day.date ? 'selected' : ''}`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className='reservation-calendar-time'>
                  <span className="reservation-calendar-date" id='reservation-calender-date-span'>{day.displayDate}</span>
                  <span className="reservation-calendar-day">{day.day}</span>
                </div>

                {songs
                  .filter(song => song.date === day.date)
                  .map((song, i) => (
                    <div key={i} className="reservation-calendar-song">{`${song.startTime.split(':')[0]}시 `}<span style={{ color: "#EAB211" }}> {song.songName}</span></div>
                  ))
                }
              </div>
            ))}
          </div>
        </div>

        <div className="reservation-controls">
          {/* ... (기존 컨트롤 영역 그대로) ... */}
          <div className="custom-select-container" ref={eventRef} style={{ marginBottom: 12 }}>
            <div
              className={`custom-select-display ${!selectedEvent ? 'custom-select-placeholder' : ''}`}
              onClick={() => setEventDropdownOpen(o => !o)}
            >
              {selectedEvent || '행사명 선택'}
              <span className="custom-select-arrow">▼</span>
            </div>
            {eventDropdownOpen && (
              <ul className="custom-select-list">
                <li
                  className="custom-select-list-item"
                  onClick={() => { setSelectedEvent(''); setEventDropdownOpen(false); }}
                >
                  행사명 선택
                </li>
                {eventList.map((eventName, idx) => (
                  <li
                    key={idx}
                    className="custom-select-list-item"
                    onClick={() => { setSelectedEvent(eventName); setEventDropdownOpen(false); }}
                  >
                    {eventName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="custom-select-container" ref={songRef} style={{ marginBottom: 12 }}>
            <div
              className={`custom-select-display ${!selectedSong ? 'custom-select-placeholder' : ''}`}
              onClick={() => setSongDropdownOpen(o => !o)}
            >
              {selectedSong || '내가 등록한 곡 선택'}
              <span className="custom-select-arrow">▼</span>
            </div>
            {songDropdownOpen && (
              <ul className="custom-select-list">
                <li
                  className="custom-select-list-item"
                  onClick={() => { setSelectedSong(''); setSongDropdownOpen(false); }}
                >
                  내가 등록한 곡 선택
                </li>
                {songList.map((song, idx) => (
                  <li
                    key={idx}
                    className="custom-select-list-item"
                    onClick={() => { setSelectedSong(song.songName); setSongDropdownOpen(false); }}
                  >
                    {song.songName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div
              className="custom-select-container"
              ref={startTimeRef}
              style={{ marginBottom: 12, width: 120, display: 'inline-block', marginRight: 8 }}
            >
              <div
                className={`custom-select-display ${!startTime ? 'custom-select-placeholder' : ''}`}
                onClick={() => setStartTimeDropdownOpen(o => !o)}
              >
                {startTime || '연습시간'}
                <span className="custom-select-arrow">▼</span>
              </div>
              {startTimeDropdownOpen && (
                <ul className="custom-select-list" style={{ maxHeight: 150 }}>
                  <li
                    className="custom-select-list-item"
                    onClick={() => { setStartTime(''); setStartTimeDropdownOpen(false); }}
                  >
                    연습시간
                  </li>
                  {timeOptions.map((time, idx) => (
                    <li
                      key={idx}
                      className="custom-select-list-item"
                      onClick={() => { setStartTime(time); setStartTimeDropdownOpen(false); }}
                    >
                      {time}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <span style={{ color: "#876400" }}> - </span>

            <div
              className="custom-select-container"
              ref={endTimeRef}
              style={{ marginBottom: 12, width: 120, display: 'inline-block' }}
            >
              <div
                className={`custom-select-display ${!endTime ? 'custom-select-placeholder' : ''}`}
                onClick={() => setEndTimeDropdownOpen(o => !o)}
              >
                {endTime || '연습시간'}
                <span className="custom-select-arrow">▼</span>
              </div>
              {endTimeDropdownOpen && (
                <ul className="custom-select-list" style={{ maxHeight: 150 }}>
                  <li
                    className="custom-select-list-item"
                    onClick={() => { setEndTime(''); setEndTimeDropdownOpen(false); }}
                  >
                    연습시간
                  </li>
                  {timeOptions.map((time, idx) => (
                    <li
                      key={idx}
                      className="custom-select-list-item"
                      onClick={() => { setEndTime(time); setEndTimeDropdownOpen(false); }}
                    >
                      {time}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            className="reservation-submit-btn"
            disabled={!selectedDate || !selectedEvent || !selectedSong || !startTime || !endTime}
            onClick={handleReservation}
          >
            예약하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReservationPage;