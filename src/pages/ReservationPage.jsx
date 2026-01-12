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

  // 로그인한 유저의 이름 (DB에 저장되는 이름과 일치해야 함)
  const userName = user?.name;

  const [isPersonalPractice, setIsPersonalPractice] = useState(false);

  const [eventList, setEventList] = useState([]);
  const [songList, setSongList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedSong, setSelectedSong] = useState('');

  // 알림 메시지 상태
  const [notification, setNotification] = useState('');

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // 드롭다운 오픈 상태 관리용
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [songDropdownOpen, setSongDropdownOpen] = useState(false);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [weekRange, setWeekRange] = useState({ start: '', end: '' });

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

  // 시간 체크 함수
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

    checkTime();
    const interval = setInterval(checkTime, 200);

    return () => clearInterval(interval);
  }, []);

  // 예약 목록 다시 불러오는 함수 (내가 예약하면 바로 취소 가능하도록)
  const fetchWeekSongs = async (start, end) => {
    if (!start || !end) return;
    try {
      const res = await api.get(`/reservations/by-week?start=${start}&end=${end}`);
      setSongs(res.data);
    } catch (err) {
      console.error('예약정보 갱신 실패:', err);
    }
  };

  useEffect(() => {
    const now = new Date();
    const currentDay = now.getDay();

    const daysUntilNextMonday = (1 + 7 - currentDay) % 7 || 7;

    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilNextMonday);

    const shortWeekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const result = [];

    // 월(0) ~ 금(4)까지 5일 생성
    for (let i = 0; i < 5; i++) {
      const d = new Date(nextMonday);
      d.setDate(nextMonday.getDate() + i);

      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

      const year = d.getFullYear();
      const localIsoDate = `${year}-${mm}-${dd}`;

      result.push({
        date: localIsoDate,
        displayDate: `${mm}.${dd}`,
        day: shortWeekdays[d.getDay()]
      });
    }

    setWeekInfo(result);

    const startDate = result[0].date;
    const endDate = result[result.length - 1].date;

    // 범위 상태 저장 (나중에 재사용하기 위해)
    setWeekRange({ start: startDate, end: endDate });

    fetchWeekSongs(startDate, endDate);

    // 1. 예약 정보 가져오기
    api.get(`/reservations/by-week?start=${startDate}&end=${endDate}`)
      .then(res => setSongs(res.data))
      .catch(err => console.error('이번 주 예약정보 실패:', err));

    // 2. 행사명 리스트 가져오기
    api.get('/songs/events/available')
      .then(res => setEventList(res.data))
      .catch(err => console.error('행사명 목록 실패:', err));


    // ============================================================
    // 3. SSE 실시간 연결
    // ============================================================
    const eventSource = new EventSource(`${BASE_URL}/sse/subscribe`);

    eventSource.addEventListener('connect', (e) => {
    });

    eventSource.addEventListener('new-reservation', (e) => {
      try {
        const newReservation = JSON.parse(e.data);

        // 내가 예약한 건은 SSE로 추가하지 않음
        if (newReservation.userName === userName) {
            return; 
        }

        setSongs((prevSongs) => {
            // 중복 방지: 이미 같은 ID의 예약이 있는지 확인
            if (prevSongs.some(song => song.id === newReservation.id)) {
                return prevSongs;
            }
            return [...prevSongs, newReservation];
        });

        const start = newReservation.startTime ? newReservation.startTime.slice(0, 5) : "";
        const end = newReservation.endTime ? newReservation.endTime.slice(0, 5) : "";
        const song = newReservation.songName;

        const msg = `${start} ~ ${end} - <b>${song}</b>: 예약되었습니다!`;
        setNotification(msg);

        setTimeout(() => {
          setNotification('');
        }, 3000);

      } catch (error) {
        console.error('SSE 데이터 파싱 에러:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE 에러 발생 (연결 종료):', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };

  }, [userName]);


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
    if (!selectedDate || !startTime || !endTime) {
      Swal.fire({
        icon: 'error',
        title: '입력 확인',
        text: '날짜와 시간을 선택해주세요.',
        confirmButtonText: '확인',
        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-confirm' }
      });
      return;
    }
    if (!isPersonalPractice && (!selectedEvent || !selectedSong)) {
      Swal.fire({
        icon: 'error',
        title: '입력 확인',
        text: '행사와 곡을 선택해주세요.',
        confirmButtonText: '확인',
        customClass: { popup: 'my-swal-popup', title: 'my-swal-title', confirmButton: 'my-swal-confirm' }
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
    
    let requestBody = {};

    if (isPersonalPractice) {
        // [개인 연습]
        requestBody = {
            type: "PERSONAL",
            userName: user.name,
            eventName: "개인연습", // (DB에 저장 안 되더라도 로깅용으로 남겨둠)
            songName: `${user.name} 개인연습`,
            singerName: "",
            date: selectedDate,
            startTime: startTime,
            endTime: endTime,
            songRegisterId: null,
            sessions: [{ date: selectedDate, startTime, endTime }]
        };
    } else {
        // [밴드 합주]
        const selectedSongObj = songList.find(song => song.songName === selectedSong);
        const singerName = selectedSongObj ? selectedSongObj.singerName : '';
        const songRegisterId = selectedSongObj ? selectedSongObj.id : null;

        requestBody = {
            type: "BAND",
            userName: user.name,
            eventName: selectedEvent,
            songName: selectedSong,
            singerName: singerName,
            date: selectedDate,
            startTime: startTime,
            endTime: endTime,
            songRegisterId: songRegisterId,
            sessions: [{ date: selectedDate, startTime, endTime }]
        };
    }

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
      // 예약 성공 후 DB에서 최신 목록을 다시 받아옴 (ID가 포함된 데이터를 가져옴)
      await fetchWeekSongs(weekRange.start, weekRange.end);

      setSelectedDate(null);
      setSelectedEvent('');
      setSelectedSong('');
      setStartTime('');
      setEndTime('');

    } catch (error) {
      console.error("예약 에러:", error);

      let errorMsg = '예약 중 오류가 발생했습니다.';

      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        }
      } else {
        errorMsg = '서버와 연결할 수 없거나 알 수 없는 오류가 발생했습니다.';
      }

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

  const handleTimeClick = (time) => {
    setStartTime(time);
    const h = parseInt(time.split(':')[0]);
    const end = `${(h + 1).toString().padStart(2, '0')}:00`;
    setEndTime(end);
  };

  // 삭제 핸들러 함수
  const handleDeleteReservation = (targetSong) => {

    if (targetSong.userName !== userName) {
      Swal.fire({
        icon: 'error',
        title: '삭제 불가',
        text: '본인이 예약한 곡이 아닙니다.',
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

    // 2. 취소 확인 모달
    Swal.fire({
      title: '예약 취소',
      html: `[${targetSong.startTime.slice(0, 5)}] <b>${targetSong.songName}</b><br/>예약을 정말 취소하시겠습니까?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '네, 취소합니다',
      cancelButtonText: '돌아가기',
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        confirmButton: 'my-swal-confirm',
        cancelButton: 'my-swal-cancel'
      },
      buttonsStyling: false
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // 3. API 호출 (삭제 요청)
          await api.delete(`/reservations/${targetSong.id}`);

          // 4. 성공 시 상태 업데이트 (화면에서 즉시 제거)
          setSongs((prev) => prev.filter((s) => s.id !== targetSong.id));

          Swal.fire({
            icon: 'success',
            title: '취소 완료',
            text: '예약이 정상적으로 취소되었습니다.',
            confirmButtonText: '확인',
            customClass: {
              popup: 'my-swal-popup',
              title: 'my-swal-title',
              confirmButton: 'my-swal-confirm'
            },
            buttonsStyling: false
          });
        } catch (error) {
          console.error("삭제 실패:", error);
          Swal.fire({
            icon: 'error',
            title: '취소 실패',
            text: error.response?.data || '예약 취소 중 오류가 발생했습니다.',
            confirmButtonText: '확인',
            customClass: {
              popup: 'my-swal-popup',
              title: 'my-swal-title',
              confirmButton: 'my-swal-confirm'
            },
            buttonsStyling: false
          });
        }
      }
    });
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

        {notification && (
          <div
            className="notification-banner"
            dangerouslySetInnerHTML={{ __html: notification }}
          />
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
                    <div
                      key={i}
                      className="reservation-calendar-song"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReservation(song);
                      }}
                      title="클릭하여 예약 취소"
                    >
                      {`·${song.startTime.split(':')[0]}시 `}
                      <span style={{ color: "#EAB211" }}> {song.songName}</span>
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        </div>
        <div className='reservation-info'>
          본인이 예약한 곡을 선택하여 예약 취소할 수 있습니다.
        </div>
        <div className="reservation-controls">
          {!isPersonalPractice && (
            <>
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
                    <li className="custom-select-list-item" onClick={() => { setSelectedEvent(''); setEventDropdownOpen(false); }}>행사명 선택</li>
                    {eventList.map((eventName, idx) => (
                      <li key={idx} className="custom-select-list-item" onClick={() => { setSelectedEvent(eventName); setEventDropdownOpen(false); }}>
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
                    <li className="custom-select-list-item" onClick={() => { setSelectedSong(''); setSongDropdownOpen(false); }}>내가 등록한 곡 선택</li>
                    {songList.map((song, idx) => (
                      <li key={idx} className="custom-select-list-item" onClick={() => { setSelectedSong(song.songName); setSongDropdownOpen(false); }}>
                        {song.songName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <div className="time-select-section">
            <div className="time-section-title">연습 시간 선택</div>
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
        {/* 개인연습 체크박스 */}
          <div className="checkbox-container">
            <label className='reservation-edit-label'>
              <input
                type="checkbox"
                checked={isPersonalPractice}
                onChange={(e) => {
                    setIsPersonalPractice(e.target.checked);
                    if (e.target.checked) {
                        setSelectedEvent('');
                        setSelectedSong('');
                    }
                }}
                className='reservation-event-custom-checkbox'
              />
              개인연습 예약하기
            </label>
          </div>
        <button
          className={`reservation-submit-btn ${!isBookingOpen ? 'disabled' : ''}`}
          disabled={!isBookingOpen || !selectedDate || !startTime || !endTime || (!isPersonalPractice && (!selectedEvent || !selectedSong))}
          onClick={handleReservation}
          style={!isBookingOpen ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}
        >
          {isBookingOpen ? "예약하기" : "예약 불가"}
        </button>
      </div>
    </div>
  );
}

export default ReservationPage;