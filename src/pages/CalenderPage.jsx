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
  
  const [reservations, setReservations] = useState([]); 
  // 🔥 [수정] processedEvents: 층수(rowIndex)가 계산된 행사 목록
  const [processedEvents, setProcessedEvents] = useState([]); 

  const token = localStorage.getItem('token');
  let userName = "사용자";
  if (token) {
    try {
        const decoded = jwtDecode(token);
        userName = decoded.name;
    } catch(e) {}
  }

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

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
  const processEventsWithRows = (rawEvents) => {
    // 1. 시작일 순서, 기간 긴 순서로 정렬
    const sortedEvents = [...rawEvents].sort((a, b) => {
      if (a.createdDate !== b.createdDate) return a.createdDate.localeCompare(b.createdDate);
      return b.endDate.localeCompare(a.endDate); // 기간 긴게 먼저
    });

    const eventsWithRows = [];

    sortedEvents.forEach((event) => {
      let rowIndex = 0;
      // 2. 빈 층 찾기 (테트리스)
      while (true) {
        // 현재 rowIndex 층에, 날짜가 겹치는 다른 행사가 있는지 확인
        const isOccupied = eventsWithRows.some((existingEvent) => {
          if (existingEvent.rowIndex !== rowIndex) return false;
          // 날짜 겹침 체크 (StartA <= EndB && EndA >= StartB)
          return (event.createdDate <= existingEvent.endDate && event.endDate >= existingEvent.createdDate);
        });

        if (!isOccupied) {
          // 빈 층을 찾았으면 할당하고 종료
          eventsWithRows.push({ ...event, rowIndex });
          break;
        }
        rowIndex++; // 겹치면 다음 층으로 이동
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
          <div key={`evt-${i}`} className={`event-bar ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`}>
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
    <div className="app-container">
      <div className="App">
        <Headers onMenuClick={toggleMenu} username={userName} isOpen={menuOpen} onClose={closeMenu} />

        <div className="calendarPage-calendar-container">
          <div className="month-header">
            <button className="circle-btn left-btn" onClick={prevMonth}>{"🡸"}</button>
            <h2 className="month-title">{currentYear}년 {currentMonth}월</h2>
            <button className="circle-btn right-btn" onClick={nextMonth}>{"🢂"}</button>
          </div>
          <div className="calendar-day-header-container">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <span key={day} className="calendar-day-header">{day}</span>
            ))}
          </div>
          <div className="calendarPage-calendar-grid">
            {calendarCells.map((date, idx) => (
              <div key={idx} className="calendarPage-calendar-cell">
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
      </div>
    </div>
  );
}

export default CalenderPage;