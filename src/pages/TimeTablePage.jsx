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

  const [sessions, setSessions] = useState([]); // 전체 유저 목록
  const [timeTables, setTimeTables] = useState([]); // 내 시간표

  const [selectedFriend, setSelectedFriend] = useState(null); //선택된 친구
  const [friendSchedule, setFriendSchedule] = useState([]);   //친구 시간표

  //시간표 찾기(겹치기) 관련 State
  const [showFindModal, setShowFindModal] = useState(false); // 모달 표시 여부
  const [searchTerm, setSearchTerm] = useState(""); // 검색어
  const [selectedUsers, setSelectedUsers] = useState([]); // 체크된 유저 리스트
  const [userSchedulesMap, setUserSchedulesMap] = useState({}); // 체크된 유저들의 시간표 데이터

  // 일정 찾기 헬퍼 함수
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

  // 초기 데이터 로드
  useEffect(() => {
    if (!userName) return;
    api.get('/scops/timetable')
      .then(res => setTimeTables(res.data))
      .catch(err => console.error("시간표 로딩 실패", err));

    api.get(`/scops/sessions`)
      .then(res => {
        setSessions(res.data);
      })
      .catch(err => {
        console.error("세션 목록 로드 실패:", err);
      });
  }, [userName]);

  // 친구 상세 보기
  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    api.get(`/timetables/user/${friend.userID}`)
      .then(res => setFriendSchedule(res.data))
      .catch(err => {
        console.error("친구 시간표 로드 실패:", err);
        setFriendSchedule([]);
      });
  };

  // 1. 체크박스 선택/해제 핸들러
  const handleUserCheck = async (targetUser, isChecked) => {
    if (isChecked) {
      // 선택 추가
      setSelectedUsers(prev => [...prev, targetUser]);

      // 데이터가 없으면 로드
      if (!userSchedulesMap[targetUser.userID]) {
        if (user && targetUser.userID === user.id) {
          setUserSchedulesMap(prev => ({
            ...prev,
            [targetUser.userID]: timeTables
          }));
          return;
        }

        // 다른 사람이면 API 호출
        try {
          const res = await api.get(`/timetables/user/${targetUser.userID}`);
          setUserSchedulesMap(prev => ({
            ...prev,
            [targetUser.userID]: res.data
          }));
        } catch (err) {
          console.error("유저 시간표 로드 실패", err);
          setUserSchedulesMap(prev => ({
            ...prev,
            [targetUser.userID]: []
          }));
        }
      }
    } else {
      // 선택 해제
      setSelectedUsers(prev => prev.filter(u => u.userID !== targetUser.userID));
    }
  };

  // 2. 필터 태그 삭제 핸들러
  const removeSelectedUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.userID !== userId));
  };

  // 3. 겹친 시간표 렌더링 
  const renderOverlapGrid = () => {
    return (
      <div className="timetable-body">
        {/* 왼쪽 시간 라벨 */}
        <div className="time-column">
          {Array.from({ length: 13 }).map((_, idx) => (
            <div key={idx} className="time-label">{9 + idx}</div>
          ))}
        </div>

        {/* 오른쪽 그리드 */}
        <div className="timetable-grid">
          {Array.from({ length: 13 }).map((_, row) => {
            const currentHour = 9 + row;
            return (
              <React.Fragment key={row}>
                {Array.from({ length: 7 }).map((_, col) => {

                  let busyCount = 0;

                  selectedUsers.forEach(u => {
                    const schedules = userSchedulesMap[u.userID] || [];
                    const hasClass = getSchedule(schedules, col, currentHour);
                    if (hasClass) busyCount++;
                  });

                  // 투명도 계산 (사람이 많을수록 진하게)
                  // 최대 1.0 (완전 불투명), 1명일 때 0.2 정도
                  const opacity = busyCount > 0
                    ? Math.min(0.2 + (busyCount * 0.15), 0.9)
                    : 0;

                  // 색상 설정 (진한 갈색/노란색 계열)
                  const cellStyle = busyCount > 0
                    ? { backgroundColor: `rgba(255, 204, 59, ${opacity})` }
                    : {};

                  return (
                    <div
                      key={`${row}-${col}`}
                      className="find-timetable-cell"
                      style={cellStyle}
                    >
                      {/* 겹친 사람 수 표시 (선택 사항) */}
                      {busyCount > 0 && (
                        <span style={{ fontSize: '8px', color: '#fff', fontWeight: 'bold' }}>
                          {busyCount}
                        </span>
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

  // 기존 내 시간표 렌더링
  const renderTimetableGrid = (scheduleData) => {
    return (
      <div className="timetable-body">
        <div className="time-column">
          {Array.from({ length: 13 }).map((_, idx) => (
            <div key={idx} className="time-label">{9 + idx}</div>
          ))}
        </div>
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
                          <div style={{ color: '#634900', fontSize: '9px', lineHeight: '1.1', marginBottom:'5%'}}>{schedule.title}</div>
                          <div style={{ fontSize: '7px', color: '#EAB211', lineHeight: '1' }}>{schedule.memo}</div>
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

  // 검색 필터링된 유저 리스트
  const filteredSessions = searchTerm.trim() === ""
    ? []
    : (() => {
      // 1. '나' 객체 생성 (sessions 데이터 구조와 맞춤)
      const myProfile = user ? {
        userName: user.name,
        userYear: user.year,
        session: user.session,
        userID: user.id
      } : null;

      // 2. 전체 리스트
      const allUsers = myProfile
        ? [myProfile, ...sessions.filter(s => s.userID !== user.id)]
        : sessions;

      // 3. 이름으로 필터링
      return allUsers.filter(s =>
        s.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })();
  return (
    <div className="App">
      <div className="app-container">
        <Headers onMenuClick={toggleMenu} isOpen={menuOpen} onClose={closeMenu} />

        <div className="timetable-container">
          <div className="timetable-main-container">
            <div className='timetablesection-title-div'>
              <span className="timetablesection-title">내 시간표</span>
              {/* 버튼 클릭 시 모달 열기 */}
              <button className="timetablesection-title" onClick={() => setShowFindModal(true)}>
                시간표 찾기
              </button>
            </div>

            <section className="timetable-wrapper">
              <div className="timetable-header-row">
                <div className="time-header-empty" />
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => <div key={d} className="day-cell">{d}</div>)}
              </div>
              {renderTimetableGrid(timeTables)}
            </section>
          </div>

          <div className="sessions-list">
            {sessions.map((s, idx) => (
              <React.Fragment key={idx}>
                <div className="session-card" onClick={() => handleFriendClick(s)}>
                  <span className='session-info'>{s.userName}_{s.userYear}th</span>
                  <span className="tags">{s.session}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 기존 상세 보기 모달 */}
        {selectedFriend && (
          <div className="timetablemodal-overlay" onClick={() => setSelectedFriend(null)}>
            <div className="timetablemodal-content timetableadd-modal" style={{ width: '350px', padding: '10px' }} onClick={(e) => e.stopPropagation()}>
              <div className="timetablemodal-header-row" style={{ marginBottom: '10px' }}>
                <div className="timetablemodal-title" style={{ fontSize: '18px' }}>
                  {selectedFriend.userName}님의 시간표
                </div>
                <button className="timetablemodal-close-btn" onClick={() => setSelectedFriend(null)}>X</button>
              </div>
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

        {/* 시간표 찾기 모달 */}
        {showFindModal && (
          <div className="timetablemodal-overlay" onClick={() => setShowFindModal(false)}>
            <div className="timetablemodal-content timetableadd-modal" style={{ width: '90%', maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>

              <div className="timetablemodal-header-row">
                <div className="timetablemodal-title">시간표 찾기</div>
                <button className="timetablemodal-close-btn" onClick={() => setShowFindModal(false)}>X</button>
              </div>

              {/* 1. 검색창 */}
              <div className="find-search-container">
                <input
                  type="text"
                  className="find-search-input"
                  placeholder="이름 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 2. 검색 결과 리스트 (체크박스) */}
              {searchTerm.trim() !== "" && (
                <div className="find-result-list">
                  {filteredSessions.length === 0 ? (
                    <div style={{ padding: '10px', color: '#999', fontSize: '12px' }}>검색 결과가 없습니다.</div>
                  ) : (
                    filteredSessions.map((s, idx) => {
                      const isChecked = selectedUsers.some(u => u.userID === s.userID);
                      return (
                        <label key={idx} className="find-result-item">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleUserCheck(s, e.target.checked)}
                          />
                          <span className="find-name-text">{s.userName}_{s.userYear}th</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {/* 3. 선택된 필터 태그 */}
              {selectedUsers.length > 0 && (
                <div className="find-filter-tags">
                  {selectedUsers.map(u => (
                    <span key={u.userID} className="find-filter-tag">
                      {u.userName}
                      <button onClick={() => removeSelectedUser(u.userID)}>x</button>
                    </span>
                  ))}
                </div>
              )}

              {/* 4. 겹쳐지는 시간표 그리드 */}
              <div className="timetable-wrapper" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="timetable-header-row">
                  <div className="time-header-empty" />
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => <div key={d} className="day-cell">{d}</div>)}
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {renderOverlapGrid()}
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '10px', color: '#999', marginTop: '5px' }}>
                * 색이 진할수록 시간이 겹치는 사람이 많습니다.
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default TimeTablePage;