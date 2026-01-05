import './TimeTablePage.css';
import { useAuth } from "../context/AuthContext.js";
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect } from 'react';
import React from 'react';
import api from '../api.js';

function TimeTablePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const { user } = useAuth();
  const userName = user?.name;

  // ✅ state로 관리 (초기엔 빈 배열)
  const [sessions, setSessions] = useState([]);
  const [timeTables, setTimeTables] = useState([]);

  const [selectedFriend, setSelectedFriend] = useState(null); // 선택된 친구 정보
  const [friendSchedule, setFriendSchedule] = useState([]);   // 친구 시간표 데이터

  const getSchedule = (scheduleData, dayIndex, hour) => {
    if (!Array.isArray(scheduleData)) return undefined;
    const weekDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const currentDay = weekDays[dayIndex];

    return scheduleData.find(t => {
      const startH = parseInt(t.startTime.split(':')[0], 10);
      const endH = parseInt(t.endTime.split(':')[0], 10);
      return t.dayOfWeek === currentDay && hour >= startH && hour < endH;
    });
  };


  // ✅ 컴포넌트 마운트 시 백엔드에서 데이터 불러오기
  useEffect(() => {
    if (!userName) return;
    // 내 시간표 불러오기
    api.get('/scops/timetable')
      .then(res => setTimeTables(res.data))
      .catch(err => console.error("시간표 로딩 실패", err));

    // 다른 사람들 리스트 불러오기
    api.get(`/scops/sessions`)
      .then(res => {
        setSessions(res.data); // [{ name, userYear, session: ["V","G"] }, ...]
      })
      .catch(err => {
        console.error("세션 목록 로드 실패:", err);
      });
  }, [userName]);

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend); // 친구 선택 (모달 열기)

    api.get(`/timetables/user/${friend.userID}`)
      .then(res => setFriendSchedule(res.data))
      .catch(err => {
        console.error("친구 시간표 로드 실패:", err);
        setFriendSchedule([]);
      });
  };

  const renderTimetableGrid = (scheduleData) => {
    return (
      <div className="timetable-body">
        {/* 왼쪽 시간 라벨 */}
        <div className="time-column">
          {Array.from({ length: 13 }).map((_, idx) => (
            <div key={idx} className="time-label">{9 + idx}</div>
          ))}
        </div>

        {/* 오른쪽 시간표 그리드 */}
        <div className="timetable-grid">
          {Array.from({ length: 13 }).map((_, row) => {
            const currentHour = 9 + row;
            return (
              <React.Fragment key={row}>
                {Array.from({ length: 7 }).map((_, col) => {
                  const schedule = getSchedule(scheduleData, col, currentHour);
                  const isStartBlock = schedule && parseInt(schedule.startTime.split(':')[0], 10) === currentHour;

                  return (
                    <div
                      key={`${row}-${col}`}
                      className="timetable-cell"
                      style={schedule ? { backgroundColor: '#FFEEBB', padding: '1px' } : {}}
                    >
                      {isStartBlock && (
                        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{
                            fontFamily: 'suit',
                            color: '#634900',
                            fontSize: '9px', // 글자 크기 조정
                            lineHeight: '1.1'
                          }}>{schedule.title}</div>
                          <div style={{
                            fontSize: '7px',
                            color: '#EAB211',
                            lineHeight: '1'
                          }}>{schedule.memo}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <div className="app-container">
        <Headers
          onMenuClick={toggleMenu}
          isOpen={menuOpen}
          onClose={closeMenu}
        />

        <div className="timetable-container">
          {/* 내 시간표 */}
          <div className="timetable-main-container">
            {/* 내 시간표 제목 */}
            <div className='timetablesection-title-div'>
              <span className="timetablesection-title">내 시간표</span>
            </div>

            {/* 시간표 박스 */}
            <section className="timetable-wrapper">
              {/* 요일 헤더 */}
              <div className="timetable-header-row">
                <div className="time-header-empty" />
                <div className="day-cell">SUN</div>
                <div className="day-cell">MON</div>
                <div className="day-cell">TUE</div>
                <div className="day-cell">WED</div>
                <div className="day-cell">THU</div>
                <div className="day-cell">FRI</div>
                <div className="day-cell">SAT</div>
              </div>

              {/* 시간 + 그리드 */}
              <div className="timetable-body">
                {/* 왼쪽 시간 라벨 */}
                <div className="time-column">
                  {Array.from({ length: 13 }).map((_, idx) => {
                    const hour = 9 + idx; // 10 ~ 20
                    return (
                      <div key={hour} className="time-label">
                        {hour}
                      </div>
                    );
                  })}
                </div>

                {/* 오른쪽 시간표 그리드 */}
                <div className="timetable-grid">
                  {Array.from({ length: 13 }).map((_, row) => {
                    const currentHour = 9 + row; // 10시, 11시...
                    return (
                      <React.Fragment key={row}>
                        {Array.from({ length: 7 }).map((_, col) => {
                          const schedule = getSchedule(timeTables, col, currentHour);; // 일정 찾기
                          const isStartBlock = schedule &&
                            parseInt(schedule.startTime.split(':')[0], 10) === currentHour;
                          return (
                            <div
                              key={`${row}-${col}`}
                              className="timetable-cell"
                              // 수업이 있으면 색칠하기
                              style={schedule ? { backgroundColor: '#FFEEBB', padding: '1px' } : {}}
                            >
                              {/* 🔥 [핵심] 수업의 "시작 시간 칸"에만 제목과 메모 표시 */}
                              {isStartBlock && (
                                <div style={{
                                  height: '100%',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center' // 세로 중앙 정렬
                                }}>
                                  <div style={{
                                    color: '#634900',
                                    fontSize: '9px', // 글자 크기 조정
                                    lineHeight: '1.1',
                                    marginBottom: '5%'
                                  }}>
                                    {schedule.title}
                                  </div>
                                  <div style={{
                                    fontSize: '7px',
                                    color: '#EAB211',
                                    lineHeight: '1'
                                  }}>
                                    {schedule.memo}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* 다른 사람들 */}
          <div className="sessions-list">
            {sessions.map((s, idx) => (
              <React.Fragment key={idx}>
                <div
                  className="session-card"
                  onClick={() => handleFriendClick(s)}
                >
                  <span className='session-info'>{s.userName}_{s.userYear}th</span>
                  <span className="tags">{s.session}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        {selectedFriend && (
          <div className="timetablemodal-overlay" onClick={() => setSelectedFriend(null)}>
            <div className="timetablemodal-content timetableadd-modal" style={{ width: '350px', padding: '10px' }} onClick={(e) => e.stopPropagation()}>
              <div className="timetablemodal-header-row" style={{ marginBottom: '10px' }}>
                <div className="timetablemodal-title" style={{ fontSize: '18px' }}>
                  {selectedFriend.userName}님의 시간표
                </div>
                <button className="timetablemodal-close-btn" onClick={() => setSelectedFriend(null)}>X</button>
              </div>

              {/* 친구 시간표 그리드 (Wrapper로 감싸서 스타일 적용) */}
              <div className="timetable-wrapper" style={{ marginTop: '0', border: '1px solid #eee' }}>
                <div className="timetable-header-row">
                  <div className="time-header-empty" />
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => <div key={d} className="day-cell">{d}</div>)}
                </div>
                {renderTimetableGrid(friendSchedule)}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default TimeTablePage;