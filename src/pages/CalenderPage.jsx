import './CalenderPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect } from 'react';
import api from '../api';
import { jwtDecode } from "jwt-decode";

function CalenderPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const EVENT_COLORS = [
    "#FC9798",
    "#A9EAFC",
    "#E9FC91",
    "#FCD49B",
    "#EFB5FC",
    "#B5FCCA",
    "#B5C7FC",
  ];
  // 🔥 [수정] processedEvents: 층수(rowIndex)가 계산된 행사 목록
  const [processedEvents, setProcessedEvents] = useState([]);
  const [reservations, setReservations] = useState([]);


  const token = localStorage.getItem('token');
  let userName = "사용자";
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userName = decoded.name;
    } catch (e) { }
  }

  const [showModal, setShowModal] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState({ date: null, songs: [] });

  // 날짜 계산
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };
  // 🎨 [신규] 이벤트 ID를 받아서 색상을 반환하는 함수
  const getEventColor = (eventId) => {
    // ID를 색상 개수로 나눈 나머지(%)를 인덱스로 사용 (순환)
    const index = eventId % EVENT_COLORS.length;
    return EVENT_COLORS[index];
  };
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = daysInMonth[0].getDay();
  const calendarCells = Array(firstDay).fill(null).concat(daysInMonth);
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  // 날짜 포맷 헬퍼
  const formatDate = (date) => {
    if (!date) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  // 🔥 [핵심 알고리즘] 행사들에 층수(rowIndex) 부여하기
  // 🔥 [수정] 행사들에 층수(rowIndex) 부여하기 (Null 방어 코드 추가)
  const processEventsWithRows = (rawEvents) => {
    const sortedEvents = [...rawEvents].sort((a, b) => {
      // 🛡️ [방어 코드] 데이터가 null이면 빈 문자열("")로 취급해서 에러 방지
      const startA = a.createdDate || "";
      const startB = b.createdDate || "";
      const endA = a.endDate || "";
      const endB = b.endDate || "";

      if (startA !== startB) return startA.localeCompare(startB);
      return endB.localeCompare(endA); 
    });

    const eventsWithRows = [];

    sortedEvents.forEach((event) => {
      let rowIndex = 0;
      
      // 날짜가 없는 잘못된 데이터는 건너뛰기 (선택사항)
      if (!event.createdDate || !event.endDate) return;

      while (true) {
        let isOccupied = false;
        
        for (const existingEvent of eventsWithRows) {
          if (existingEvent.rowIndex === rowIndex) {
            if (event.createdDate <= existingEvent.endDate && event.endDate >= existingEvent.createdDate) {
              isOccupied = true;
              break; 
            }
          }
        }

        if (!isOccupied) {
          eventsWithRows.push({ ...event, rowIndex });
          break;
        }
        rowIndex++; 
      }
    });

    return eventsWithRows;
  };

  // 데이터 불러오기
  useEffect(() => {
    const pad = (n) => String(n).padStart(2, "0");
    const startStr = `${currentYear}-${pad(currentMonth)}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endStr = `${currentYear}-${pad(currentMonth)}-${pad(lastDay)}`;

    // 예약 조회
    api.get(`/songs/by-month?start=${startStr}&end=${endStr}`)
      .then((res) => setReservations(res.data))
      .catch(console.error);

    // 행사 조회
    api.get(`/songs/events/period?start=${startStr}&end=${endStr}`)
      .then((res) => {
        // 🔥 받아온 데이터를 알고리즘에 넣어서 층수 계산 후 저장
        const calculatedEvents = processEventsWithRows(res.data);
        setProcessedEvents(calculatedEvents);
      })
      .catch((err) => console.error("행사 정보 실패:", err));

  }, [currentYear, currentMonth]);

  // 예약 필터링
  const getReservationsByDate = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    return reservations
      .filter((r) => r.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };
  const handleDateClick = (date) => {
    if (!date) return;

    // 선택한 날짜의 예약된 곡들 가져오기
    const songs = getReservationsByDate(date);

    setSelectedDateInfo({
      date: date,
      songs: songs
    });
    setShowModal(true);
  };
  const getFormattedDate = (date) => {
    if (!date) return "";
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 🔥 [수정] 요일 포맷 함수 분리 (Sat)
  const getFormattedDay = (date) => {
    if (!date) return "";
    const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return week[date.getDay()];
  };
  // 오늘 날짜 확인
  const isToday = (date) => {
    if (!date) return false;
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 🔥 [렌더링 로직] 날짜별로 행사 층수대로 그리기
  const renderEventsForDate = (date) => {
    if (!date) return null;
    const dateStr = formatDate(date);

    // 1. 오늘 날짜에 걸쳐있는 모든 행사 가져오기
    const todaysEvents = processedEvents.filter(event =>
      dateStr >= event.createdDate && dateStr <= event.endDate
    );

    if (todaysEvents.length === 0) return null;

    // 2. 오늘 있는 행사 중 가장 높은 층수 찾기 (그만큼 반복문 돌려야 함)
    const maxRowIndex = Math.max(...todaysEvents.map(e => e.rowIndex));

    const renderElements = [];

    // 3. 0층부터 꼭대기 층까지 차례대로 쌓기
    for (let i = 0; i <= maxRowIndex; i++) {
      const event = todaysEvents.find(e => e.rowIndex === i);

      if (event) {
        // 행사가 있으면 그림
        const isStart = dateStr === event.createdDate;
        const isEnd = dateStr === event.endDate;
        renderElements.push(
          <div key={`evt-${i}`} className={`event-bar ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`} style={{ backgroundColor: getEventColor(event.id) }}>
            {isStart ? event.eventName : '\u00A0'}
          </div>
        );
      } else {
        // 🔥 [핵심] 행사가 없으면 '투명 바(Spacer)'를 넣어서 자리 차지하기
        renderElements.push(
          <div key={`spacer-${i}`} className="event-bar spacer"></div>
        );
      }
    }

    return renderElements;
  };

  return (
    <div className="App">
      <div className="app-container">
        <Headers onMenuClick={toggleMenu} username={userName} isOpen={menuOpen} onClose={closeMenu} />

        <div className="calendarPage-calendar-container">
          <div className="month-header">
            <button className="circle-btn left-btn" onClick={prevMonth}>{"⬅"}</button>
            <h2 className="month-title">{currentYear}년 {currentMonth}월</h2>
            <button className="circle-btn right-btn" onClick={nextMonth}>{"➡"}</button>
          </div>
          <div className="calendar-day-header-container">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <span key={day} className="calendar-day-header">{day}</span>
            ))}
          </div>
          <div className="calendarPage-calendar-grid">
            {calendarCells.map((date, idx) => (
              <div key={idx} className="calendarPage-calendar-cell" onClick={() => handleDateClick(date)}>
                {date && (
                  <>
                    <div className="cell-top">
                      <div className={`date-number ${isToday(date) ? 'today-mark' : ''}`}>
                        {date.getDate()}
                      </div>
                      <div className="reservation-list">
                        {getReservationsByDate(date).map((res, i) => (
                          <div key={i} className="reservation-item">
                            <span style={{ fontWeight: 'bold', marginRight: '3px' }}>
                              {res.startTime ? `${res.startTime.split(':')[0]}시` : ''}
                            </span>
                            {res.songName}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="cell-bottom">
                      {/* 🔥 여기서 함수 호출 */}
                      {renderEventsForDate(date)}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        {showModal && (
          <div className="calendermodal-overlay" onClick={() => setShowModal(false)}>
            <div className="calendermodal-content" onClick={(e) => e.stopPropagation()}>
              <div className="calendermodal-header">
                <span className="calendermodal-date-title">
                  {getFormattedDate(selectedDateInfo.date)}
                </span>
                <span className="calendermodal-day">
                  {getFormattedDay(selectedDateInfo.date)}
                </span>
                <button className="calenderclose-btn" onClick={() => setShowModal(false)}>&times;</button>
              </div>

              {/* ✨ 클래스 이름 변경: main-container -> calender-main-container */}
              <div className="calender-main-container">
                {selectedDateInfo.songs.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
                    예약된 곡이 없습니다.
                  </p>
                ) : (
                  selectedDateInfo.songs.map((song, index) => (

                    /* ✨ 클래스 이름 변경: main-container-song -> calender-main-container-song */
                    <div key={index} className="calender-main-container-song">

                      <div className="calender-main-container-songname">
                        {/* ✨ 곡 제목 스타일 변경 */}
                        <span className='calender-main-container-songname-style'>{song.songName}{' '}</span>
                        {/* ✨ 가수 이름 클래스 별도 적용 (CSS에서 .calender-main-container-singer) */}
                        <span className="calender-main-container-singer">{song.singerName}</span>
                      </div>

                      {/* ✨ 시간 스타일 변경 */}
                      <div className="calender-main-container-songtime">
                        {`${song.startTime.slice(0, 5)} - ${song.endTime.slice(0, 5)}`}
                      </div>

                      {/* ✨ 세션 스타일 변경 */}
                      <div className="calender-main-container-songperson">
                        {song.sessions && song.sessions.map((s, idx) => (
                          <span key={idx} style={{ marginRight: '10px' }}>
                            {s.sessionType ? `${s.sessionType}.${s.playerName}` : s.playerName}
                          </span>
                        ))}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalenderPage;