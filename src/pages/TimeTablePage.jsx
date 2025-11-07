import './TimeTablePage.css';
import { useAuth } from "../context/AuthContext.js";
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect } from 'react';
import React from 'react';
import axios from 'axios';

function TimeTablePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const { user } = useAuth();
  const userName = user?.userName;

  // ✅ state로 관리 (초기엔 빈 배열)
  const [sessions, setSessions] = useState([]);
  const [mySchedule, setMySchedule] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);

  // ✅ 컴포넌트 마운트 시 백엔드에서 데이터 불러오기
  useEffect(() => {
    // 내 시간표 불러오기
    axios.get(`http://localhost:8080/scops/myschedule/${userName}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => {
      setMySchedule(res.data); // [{ day, start, end, subject, place }, ...]
    })
    .catch(err => {
      console.error("내 시간표 로드 실패:", err);
    });

    // 다른 사람들 리스트 불러오기
    axios.get("http://localhost:8080/scops/sessions")
    .then(res => {
      setSessions(res.data); // [{ name, userYear, session: ["V","G"] }, ...]
    })
    .catch(err => {
      console.error("세션 목록 로드 실패:", err);
    });
  }, [userName]);

  return (
    <div className="app-container">
      <div className="App">
        <Headers 
          onMenuClick={toggleMenu}
          isOpen={menuOpen}
          onClose={closeMenu}
        />

        <div className="timetable-container">
          {/* 내 시간표 */}
          <div className="my-timetable">
            <h2>{userName}의 시간표</h2>
            <div className="calendar">
              {/* 요일 헤더 */}
              <div className="header-cell" style={{ gridColumn: 1, gridRow: 1 }}></div>
              {["SUN","MON","TUE","WED","THU","FRI","SAT"].map((day, idx) => (
                <div
                  key={day}
                  className="header-cell"
                  style={{ gridColumn: idx + 2, gridRow: 1 }}
                >
                  {day}
                </div>
              ))}

              {/* 시간열 + 요일셀 */}
              {Array.from({ length: 11 }, (_, i) => {
                const hour = 10 + i;       // 10시~20시
                const row = i + 2;         // 헤더 1행 포함
                return (
                  <React.Fragment key={hour}>
                    <div className="time-cell" style={{ gridColumn: 1, gridRow: row }}>
                      {hour}
                    </div>
                    {["SUN","MON","TUE","WED","THU","FRI","SAT"].map((day, colIdx) => (
                      <div
                        key={`${day}-${hour}`}
                        className="calendar-cell"
                        style={{ gridColumn: colIdx + 2, gridRow: row }}
                      ></div>
                    ))}
                  </React.Fragment>
                );
              })}

              {/* 수업 블록 */}
              {mySchedule.map((cls, idx) => {
                const col = ["SUN","MON","TUE","WED","THU","FRI","SAT"].indexOf(cls.day) + 2;
                let rowStart = cls.start - 10 + 2;
                let rowEnd = cls.end - 10 + 2;

                if (rowEnd > 12) rowEnd = 12; // 마지막 20시 행 초과 방지

                return (
                  <div
                    key={idx}
                    className="class-block"
                    style={{
                      gridColumn: col,
                      gridRow: `${rowStart} / ${rowEnd}`,
                    }}
                  >
                    <div className="class-subject">{cls.subject}</div>
                    <div className="class-place">{cls.place}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 다른 사람들 */}
          <div className="sessions-list">
            {sessions.map((s, idx) => (
              <React.Fragment key={idx}>
                <div
                  className="session-card"
                  onClick={() =>
                    setExpandedSession(expandedSession === idx ? null : idx)
                  }
                >
                  <span>{s.userName}_{s.userYear}</span>
                  <span className="tags">{s.session}</span>
                </div>

                {/* 클릭된 카드 밑에만 시간표 표시 */}
                {expandedSession === idx && (
                  <div className="expanded-timetable">
                    <h3>{s.userName}님의 시간표</h3>
                    <div className="calendar small">
                      {/* TODO: 해당 사람 시간표 백엔드에서 불러와서 표시 */}
                    </div>
                    <button onClick={() => setExpandedSession(null)}>닫기</button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* 클릭한 사람 시간표 */}
          {expandedSession !== null && (
            <div className="expanded-timetable">
              <h3>{sessions[expandedSession].userName}님의 시간표</h3>
              <div className="calendar small">
                {/* TODO: 해당 사람 시간표도 백엔드에서 불러와서 표시 */}
              </div>
              <button onClick={() => setExpandedSession(null)}>닫기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeTablePage;
