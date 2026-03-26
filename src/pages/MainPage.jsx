import { useAuth } from "../context/AuthContext.js";
import './MainPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect } from 'react';
import api from "../api.js";

function MainPage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [date, setDate] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [songs, setSongs] = useState([]);
  const [weekInfo, setWeekInfo] = useState([]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);


  // 중복 곡 병합 함수
  const mergeSongs = (songList) => {
    const merged = songList.reduce((acc, song) => {
      const key = `${song.songName}-${song.startTime}-${song.endTime}-${song.date}`;
      if (!acc[key]) {
        acc[key] = { ...song, sessions: [...song.sessions] };
      } else {
        acc[key].sessions.push(...song.sessions);
      }
      return acc;
    }, {});

    // 세션 중복 제거
    Object.values(merged).forEach(song => {
      song.sessions = Array.from(
        new Map(
          song.sessions.map(s => [`${s.sessionType}.${s.playerName}`, s])
        ).values()
      );
    });

    return Object.values(merged);
  };

  useEffect(() => {
    const now = new Date();
    const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // 이번 주 평일(오늘 포함 5일) 날짜 계산
    const result = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      // 로컬 시간으로 직접 포맷팅
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formattedFullDate = `${year}-${month}-${day}`;

      result.push({
        fullDate: formattedFullDate, // 수정됨: 로컬 기준 yyyy-mm-dd
        date: `${month}/${day}`,     // 로컬 기준 MM/DD
        day: shortWeekdays[d.getDay()].toUpperCase(),
      });
    }
    setWeekInfo(result);

    // 오늘 날짜 MM/DD 형식
    setDate(result[0].date.replace('-', '/'));
    setDayOfWeek(result[0].day);

    // 백엔드에 start~end 범위로 요청해쓰
    const start = result[0].fullDate;
    const end = result[result.length - 1].fullDate;

    api
      .get(`/reservations/by-week?start=${start}&end=${end}`)
      .then(response => setSongs(response.data))
      .catch(console.error);
  }, []);

  const todayFullDate = weekInfo[0]?.fullDate;
  const todaySongs = mergeSongs(songs.filter(song => song.date === todayFullDate));
  if (!user) {
    return null; // 화면에 아무것도 그리지 않고 에러 방지
  }
  return (
    <div className="App">
      <div className="app-container">
        <Headers
          onMenuClick={toggleMenu}
          isOpen={menuOpen}
          onClose={closeMenu}
        />
        <div className="main-container">
          <div className="main-container-time">
            <div className="main-container-time-date">{date}</div>
            <div className="main-container-time-dayofweek">{dayOfWeek}</div>
          </div>
          {/* 오늘 곡 목록 */}
          {todaySongs.length === 0 ? (
            <div className="no-songs-message">
              예정된 합주가 없습니다.
            </div>
          ) : (
            todaySongs
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((song, index) => (
                <div
                  key={song.id ?? `${song.songName}-${song.date}-${index}`}
                  className="main-container-song"
                >
                  <div className="main-container-songname">
                    <span className='main-container-songname-style'>{song.songName}{' '}</span>
                    <span style={{ fontSize: '10px', color: "#876400" }}>{song.singerName}</span>
                  </div>
                  <div className="main-container-songtime">
                    {`${song.startTime.slice(0, 5)} - ${song.endTime.slice(0, 5)}`}
                  </div>
                  <div className="main-container-songperson">
                    {song.sessions.map(s => (
                      <span key={s.sessionType + s.playerName} style={{ marginRight: '10px' }}>
                        {`${s.sessionType}.${s.playerName}`}
                      </span>
                    ))}
                  </div>

                </div>
              ))
          )}
        </div>

        {/* 달력 */}
        <div className="calendar-grid-container">
          <div className="calendar-grid">
            {weekInfo.map((day, dayIndex) => {
              const daySongs = mergeSongs(
                songs.filter(song => song.date === day.fullDate)
              );
              return (
                <div key={`${day.fullDate}-${dayIndex}`} className="calendar-cell">
                  <div className="calendar-day">{day.day}</div>
                  <div className="calendar-date">{day.date}</div>
                  {daySongs
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((song, songIndex) => (
                      <div
                        key={song.id ?? `${song.songName}-${song.date}-${songIndex}`}
                        className="calendar-song"
                      >
                        <span style={{ color: "#876400" }}>
                          {`·${song.startTime.slice(0, 5)} `}
                          {` ~ ${song.endTime.slice(0, 5)} `}
                        </span>
                        <br/>
                        <span style={{ color: "#EAB211" }}>
                          {song.songName}
                        </span>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage;