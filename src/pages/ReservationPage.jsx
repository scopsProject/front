import './ReservationPage.css';
import { useAuth } from "../context/AuthContext.js";
import Swal from 'sweetalert2';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '../api';
import '../components/SweetAlertCustom.css';

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

  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const eventRef = useRef(null);
  const songRef = useRef(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e) {
      if (eventRef.current && !eventRef.current.contains(e.target)) setEventDropdownOpen(false);
      if (songRef.current && !songRef.current.contains(e.target)) setSongDropdownOpen(false);
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🕒 시간 체크 함수 (컴포넌트 마운트 시 & 1분마다 체크 추천)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const day = now.getDay(); // 0:일, 1:월, 2:화, 3:수, 4:목, 5:금, 6:토
      const hour = now.getHours();

      let isOpen = false;

      if (day === 2) { // 화요일
        if (hour >= 9) isOpen = true;
      } else if (day === 3) { // 수요일
        isOpen = true;
      } else if (day === 4) { // 목요일
        if (hour < 19) isOpen = true;
      }

      setIsBookingOpen(isOpen);
    };

    checkTime(); // 처음 한번 실행
    const interval = setInterval(checkTime, 200); // 0.2초마다 갱신

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0(일) ~ 6(토)

    const daysUntilNextMonday = (1 + 7 - currentDay) % 7 || 7;

    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilNextMonday);

    const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];

    // 🔥 월(0) ~ 금(4)까지 5일 생성
    for (let i = 0; i < 5; i++) {
      const d = new Date(nextMonday);
      d.setDate(nextMonday.getDate() + i);

      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      const year = d.getFullYear();
      const localIsoDate = `${year}-${mm}-${dd}`;

      result.push({
        date: localIsoDate, // 🔥 수정된 날짜값
        displayDate: `${mm}-${dd}`,
        day: shortWeekdays[d.getDay()]
      });
    }

    setWeekInfo(result);

    // 초기 데이터 로딩 범위도 다음 주로 변경
    const startDate = result[0].date;
    const endDate = result[result.length - 1].date;

    // 1. 예약 정보 가져오기
    api.get(`/reservations/by-week?start=${startDate}&end=${endDate}`)
      // ... (이하 동일) ...
      .then(res => setSongs(res.data))
      .catch(err => console.error('이번 주 예약정보 실패:', err));

    // 2. 행사명 리스트 가져오기
    api.get('/songs/events/names/all')
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
      Swal.fire({
        icon: 'error',
        title: '입력 확인',
        text: '모든 항목을 선택해주세요.',
        confirmButtonText: '확인',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm'
        },
        buttonsStyling: false
      });
      return;
    }
    if (startTime >= endTime) {
      Swal.fire({
        icon: 'error',
        title: '시간 선택 오류',
        text: '시작 시간은 종료 시간보다 빨라야 합니다.',
        confirmButtonText: '확인',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm'
        },
        buttonsStyling: false
      });
      return;
    }

    const selectedSongObj = songList.find(song => song.songName === selectedSong);
    const singerName = selectedSongObj ? selectedSongObj.singerName : '';
    const songRegisterId = selectedSongObj ? selectedSongObj.id : null;

    const requestBody = {
      userName: user.name,
      eventName: selectedEvent,
      songName: selectedSong,
      singerName: singerName,
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
      await api.post(`/reservations/reservation`, requestBody);
      Swal.fire({
        icon: 'success',
        title: '당신은 럭키가이!',
        text: '예약이 완료되었습니다!',
        confirmButtonText: '확인',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm'
        },
        buttonsStyling: false
      });

      // 예약 후 초기화
      setSelectedDate(null);
      setSelectedEvent('');
      setSelectedSong('');
      setStartTime('');
      setEndTime('');

    } catch (error) {
      console.error("예약 에러:", error);

      let errorMsg = '예약 중 오류가 발생했습니다.';
      
      // 에러 메시지 추출 로직
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        }
      } else {
        errorMsg = '서버와 연결할 수 없거나 알 수 없는 오류가 발생했습니다.';
      }

      // 4. 실패 알림 (통합 처리)
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: errorMsg,
        confirmButtonText: '확인',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm'
        },
        buttonsStyling: false
      });
    }
  };

  const hourSlots = Array.from({ length: 14 }, (_, idx) => {
    const hour = 9 + idx;
    const timeString = `${hour.toString().padStart(2, '0')}:00`;

    return {
      time: timeString,
      label: `${hour}:00`,
      hour,
      disabled: songs.some(s =>
        s.date === selectedDate &&
        (s.startTime ? s.startTime.substring(0, 5) : "") === timeString
      )
    };
  });

  // 클릭 처리 (1시간 선택)
  const handleTimeClick = (time) => {
    setStartTime(time);

    // 자동으로 1시간 뒤로 endTime 설정
    const h = parseInt(time.split(':')[0]);
    const end = `${(h + 1).toString().padStart(2, '0')}:00`;
    setEndTime(end);
  };


  return (
    <div className="App">
      <div className="app-container">
        <Headers onMenuClick={toggleMenu} username={userName} isOpen={menuOpen} onClose={closeMenu} />

        {!isBookingOpen && (
          <div style={{
            backgroundColor: '#ffebee', color: '#c62828', padding: '10px',
            textAlign: 'center', fontSize: '12px', fontWeight: 'bold',
            borderBottom: '1px solid #ffcdd2'
          }}>
            ⛔ 지금은 예약 시간이 아닙니다.<br />(화 09:00 ~ 목 19:00)
          </div>
        )}
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
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((song, i) => (
                    <div key={i} className="reservation-calendar-song">{`·${song.startTime.split(':')[0]}시 `}<span style={{ color: "#EAB211" }}> {song.songName}</span></div>
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

          <div className="time-select-section">
            <div className="time-section-title">연습 시간 선택</div>
            {/* 오전 */}
            <div className="time-group">
              <div className="time-group-title">오전</div>
              <div className="time-buttons">
                {hourSlots
                  .filter(t => t.hour >= 9 && t.hour < 12)
                  .map((t, idx) => (
                    <button
                      key={idx}
                      className={`time-btn ${t.disabled ? 'disabled' : ''} ${startTime === t.time ? 'selected' : ''}`}
                      disabled={t.disabled}
                      onClick={() => handleTimeClick(t.time)}
                    >
                      {t.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* 오후 */}
            <div className="time-group">
              <div className="time-group-title">오후</div>
              <div className="time-buttons">
                {hourSlots
                  .filter(t => t.hour >= 12 && t.hour <= 22)
                  .map((t, idx) => (
                    <button
                      key={idx}
                      className={`time-btn ${t.disabled ? 'disabled' : ''} ${startTime === t.time ? 'selected' : ''}`}
                      disabled={t.disabled}
                      onClick={() => handleTimeClick(t.time)}
                    >
                      {t.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <button
          className={`reservation-submit-btn ${!isBookingOpen ? 'disabled' : ''}`}
          // 기존 disabled 조건에 !isBookingOpen 추가
          disabled={!isBookingOpen || !selectedDate || !selectedEvent || !selectedSong || !startTime || !endTime}
          onClick={handleReservation}
          style={!isBookingOpen ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}} // 스타일 추가
        >
          {isBookingOpen ? "예약하기" : "예약 불가"}
        </button>
      </div>
    </div>
  );
}

export default ReservationPage;