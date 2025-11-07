import { useAuth } from "../context/AuthContext.js";
import './MainPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

function MainPage() {
  const { user } = useAuth();
  const userName = user?.userName;
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
      result.push({
        fullDate: d.toISOString().slice(0, 10), // yyyy-mm-dd
        date: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, // MM-DD
        day: shortWeekdays[d.getDay()],
      });
    }
    setWeekInfo(result);

    // 오늘 날짜 MM/DD 형식
    setDate(result[0].date.replace('-', '/'));
    setDayOfWeek(result[0].day);

    // 백엔드에 start~end 범위로 요청
    const start = result[0].fullDate;
    const end = result[result.length - 1].fullDate;

    axios
      .get(`http://localhost:8080/api/songs/by-week?start=${start}&end=${end}&userName=${userName}`)
      .then(response => setSongs(response.data))
      .catch(console.error);
  }, [userName]);

  const todayFullDate = weekInfo[0]?.fullDate;
  const todaySongs = mergeSongs(songs.filter(song => song.date === todayFullDate));

  return (
    <div className="app-container">
      <div className="App">
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
            <p>예정된 합주가 없습니다.</p>
          ) : (
            todaySongs.map((song, index) => (
              <div
                key={song.id ?? `${song.songName}-${song.date}-${index}`}
                className="main-container-song"
              >
                <div className="main-container-songname">
                  <span className='main-container-songname-style'>{song.songName}{' '}</span>
                  <span style={{ fontSize: '10px', color: "#876400"}}>{song.singerName}</span>
                </div>
                <div className="main-container-songtime">
                  {`${song.startTime.slice(0,5)} - ${song.endTime.slice(0,5)}`}
                </div>
                <div className="main-container-songperson">
                  {song.sessions.map(s => (
                    <span key={s.sessionType + s.playerName} style={{ marginRight: '20px' }}>
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
                  {daySongs.map((song, songIndex) => (
                    <div
                      key={song.id ?? `${song.songName}-${song.date}-${songIndex}`}
                      className="calendar-song"
                    >
                      {`＊${song.startTime.split(':')[0]}시 `}<span style={{color: "#EAB211"}}> {song.songName}</span>
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
