import './CalenderPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

function CalenderPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [reservations, setReservations] = useState([]); // 한 달치 예약 내역

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // 달의 모든 날짜 구하기
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

  // 한 달치 예약 불러오기
  useEffect(() => {
    const start = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const endDate = new Date(currentYear, currentMonth, 0).getDate(); // 그 달 마지막 일자
    const end = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${endDate}`;

    axios
      .get(`http://localhost:8080/api/by-month?start=${start}&end=${end}`)
      .then((res) => {
        setReservations(res.data);
      })
      .catch(console.error);
  }, [currentYear, currentMonth]);

  // 특정 날짜에 해당하는 예약 가져오기
  const getReservationsByDate = (date) => {
    if (!date) return [];
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
    return reservations.filter((r) => r.date === dateStr);
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

  return (
    <div className="app-container">
      <div className="App">
        <Headers
          onMenuClick={toggleMenu}
          username="김유빈"
          isOpen={menuOpen}
          onClose={closeMenu}
        />

        <div className="calendarPage-calendar-container">
          <button className="circle-btn left-btn" onClick={prevMonth}>{"<"}</button>
          <h2 className="month-title">{currentYear}년 {currentMonth}월</h2>
          <button className="circle-btn right-btn" onClick={nextMonth}>{">"}</button>

          <div className="calendarPage-calendar-grid">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
            {calendarCells.map((date, idx) => (
              <div key={idx} className="calendarPage-calendar-cell">
                {date && (
                  <>
                    <div className="date-number">{date.getDate()}</div>
                    <div className="events">
                      {getReservationsByDate(date).map((res, i) => (
                        <div key={i} className="event-item">
                          {`${res.songName}`}
                        </div>
                      ))}
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
