import './CalenderPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { jwtDecode } from "jwt-decode";
import Swal from 'sweetalert2';
import '../components/SweetAlertCustom.css';

function CalenderPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  const role = localStorage.getItem("role");
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    eventName: "",
    startDate: "",
    endDate: "",
    isSongRegistrationAvailable: false
  });

  const swalOptions = {
    confirmButtonText: '확인',
    buttonsStyling: false,
    customClass: {
      popup: 'my-swal-popup',
      title: 'my-swal-title',
      confirmButton: 'my-swal-confirm',
      cancelButton: 'my-swal-cancel'
    }
  };

  const EVENT_COLORS = [
    "#FC9798",
    "#A9EAFC",
    "#E9FC91",
    "#FCD49B",
    "#EFB5FC",
    "#B5FCCA",
    "#B5C7FC",
  ];

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

  const getEventColor = (eventId) => {
    const index = eventId % EVENT_COLORS.length;
    return EVENT_COLORS[index];
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = daysInMonth[0].getDay();
  const calendarCells = Array(firstDay).fill(null).concat(daysInMonth);
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const formatDate = (date) => {
    if (!date) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const processEventsWithRows = (rawEvents) => {
    const sortedEvents = [...rawEvents].sort((a, b) => {
      const startA = a.startDate || "";
      const startB = b.startDate || "";
      const endA = a.endDate || "";
      const endB = b.endDate || "";

      if (startA !== startB) return startA.localeCompare(startB);
      return endB.localeCompare(endA);
    });

    const eventsWithRows = [];

    sortedEvents.forEach((event) => {
      let rowIndex = 0;
      if (!event.startDate || !event.startDate) return;

      while (true) {
        let isOccupied = false;
        for (const existingEvent of eventsWithRows) {
          if (existingEvent.rowIndex === rowIndex) {
            if (event.startDate <= existingEvent.endDate && event.endDate >= existingEvent.startDate) {
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

  const fetchCalendarData = useCallback(() => {
    const pad = (n) => String(n).padStart(2, "0");
    const startStr = `${currentYear}-${pad(currentMonth)}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endStr = `${currentYear}-${pad(currentMonth)}-${pad(lastDay)}`;

    api.get(`/reservations/by-month?start=${startStr}&end=${endStr}`)
      .then((res) => setReservations(res.data))
      .catch(console.error);

    const timestamp = new Date().getTime();
    api.get(`/songs/events/period?start=${startStr}&end=${endStr}&t=${timestamp}`)
      .then((res) => {
        const calculatedEvents = processEventsWithRows(res.data);
        setProcessedEvents(calculatedEvents);
      })
      .catch((err) => console.error("행사 정보 실패:", err));
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handleAddEvent = async () => {
    if (!newEventData.eventName || !newEventData.startDate || !newEventData.endDate) {
      Swal.fire({
        ...swalOptions,
        icon: "warning",
        title: "입력 확인",
        text: "모든 정보를 입력해주세요.",
      });
      return;
    }

    try {
      await api.post('/songs/events/new', newEventData);
      Swal.fire({
        ...swalOptions,
        icon: "success",
        title: "완료",
        text: "행사가 추가되었습니다!",
      });

      setShowEventModal(false);
      setNewEventData({
        eventName: "",
        startDate: "",
        endDate: "",
        isSongRegistrationAvailable: false
      });

      fetchCalendarData();

    } catch (error) {
      console.error(error);
      Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "오류",
        text: error.response?.data?.message || "행사 추가 실패",
      });
    }
  };

  const getReservationsByDate = (date) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    return reservations
      .filter((r) => r.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };
  const handleDateClick = (date) => {
    if (!date) return;
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

  const getFormattedDay = (date) => {
    if (!date) return "";
    const week = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return week[date.getDay()];
  };

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

  const renderEventsForDate = (date) => {
    if (!date) return null;
    const dateStr = formatDate(date);

    const todaysEvents = processedEvents.filter(event =>
      dateStr >= event.startDate && dateStr <= event.endDate
    );

    if (todaysEvents.length === 0) return null;
    const maxRowIndex = Math.max(...todaysEvents.map(e => e.rowIndex));
    const renderElements = [];

    for (let i = 0; i <= maxRowIndex; i++) {
      const event = todaysEvents.find(e => e.rowIndex === i);

      if (event) {
        const isStart = dateStr === event.startDate;
        const isEnd = dateStr === event.endDate;
        renderElements.push(
          <div key={`evt-${i}`} className={`event-bar ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`} style={{ backgroundColor: getEventColor(event.id) }}>
            {isStart ? event.eventName : '\u00A0'}
          </div>
        );
      } else {
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
            <img src={`/images/left.png`} onClick={prevMonth} className='calender-left-btn' alt="이전 달"></img>
            <h2 className="month-title">{currentYear}년 {currentMonth}월</h2>
            <img src={`/images/right.png`} onClick={nextMonth} className='calender-right-btn' alt="다음 달"></img>
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
                      {renderEventsForDate(date)}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {role === "ROLE_ADMIN" && (
            <div style={{ marginTop: '10px', textAlign: 'right' }}>
              <button className="add-event-btn-small" onClick={() => setShowEventModal(true)}>
                + 행사 추가
              </button>
            </div>
          )}
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

              <div className="calender-main-container">
                {selectedDateInfo.songs.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
                    예약된 곡이 없습니다.
                  </p>
                ) : (
                  selectedDateInfo.songs.map((song, index) => (

                    <div key={index} className="calender-main-container-song">

                      <div className="calender-main-container-songname">
                        <span className='calender-main-container-songname-style'>{song.songName}{' '}</span>
                        <span className="calender-main-container-singer">{song.singerName}</span>
                      </div>

                      <div className="calender-main-container-songtime">
                        {`${song.startTime.slice(0, 5)} - ${song.endTime.slice(0, 5)}`}
                      </div>

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
        {showEventModal && (
          <div className="calendermodal-overlay" onClick={() => setShowEventModal(false)}>
            <div className="calendermodal-content" onClick={(e) => e.stopPropagation()}>
              <div className="calendermodal-title">새 행사 추가
                <button className="calendermodal-close" onClick={() => setShowEventModal(false)}>X</button>
              </div>

              <div className="calendermodal-input-group">
                <label>행사명</label>
                <input
                  type="text"
                  className="calendermodal-input"
                  placeholder="예: 2025 정기공연"
                  value={newEventData.eventName}
                  onChange={(e) => setNewEventData({ ...newEventData, eventName: e.target.value })}
                />
              </div>

              <div className="calendermodal-input-group">
                <label>시작일</label>
                <input
                  type="date"
                  className="calendermodal-input"
                  value={newEventData.startDate}
                  onChange={(e) => setNewEventData({ ...newEventData, startDate: e.target.value })}
                />
              </div>

              <div className="calendermodal-input-group">
                <label>종료일</label>
                <input
                  type="date"
                  className="calendermodal-input"
                  value={newEventData.endDate}
                  onChange={(e) => setNewEventData({ ...newEventData, endDate: e.target.value })}
                />
              </div>
              <div className="calendermodal-input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <input
                  type="checkbox"
                  id="availableCheck"
                  className="calendercustom-checkbox"
                  checked={newEventData.isSongRegistrationAvailable}
                  onChange={(e) => setNewEventData({ ...newEventData, isSongRegistrationAvailable: e.target.checked })}
                />
                <label htmlFor="availableCheck" style={{ cursor: 'pointer', margin: 0 }}>
                  이 행사에 곡 등록을 허용하시겠습니까?
                </label>
              </div>
              <div className="calendermodal-actions">
                <button className="calendermodal-savebtn" onClick={handleAddEvent}>저 장</button>
                <button className="calendermodal-cancelbtn" onClick={() => setShowEventModal(false)}>취 소</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalenderPage;