import './MainPage.css';
import Headers from '../components/Headers';
import  '../components/Headers.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

function MainPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [date, setDate] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [songs, setSongs] = useState([]);
  const [weekInfo, setWeekInfo] = useState([]);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {                                                                     //오늘 날짜 받아오기, 오늘 날짜 해당하는 데이터 받아오기
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    setDate(`${month}/${day}`);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setDayOfWeek(weekdays[now.getDay()]);

    // 오늘 날짜 기준으로 곡 목록 요청
    axios.get(`http://localhost:8080/api/songs?date=${month}/${day}`)
          .then(response => setSongs(response.data))
          .catch(console.error);

    const dayNum = now.getDay();
    const isWeekend = (dayNum === 0 || dayNum === 6);
    const offsetToMonday = isWeekend ? (8 - dayNum) : (1 - dayNum);

    // 이번 주 또는 다음 주 월요일 기준 날짜 객체 생성
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + offsetToMonday);

    const result = [];
    const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      result.push({
        date: `${mm}-${dd}`,
        day: shortWeekdays[d.getDay()],
      });
    }
    setWeekInfo(result);
    }, []);

  

  
  return (
    <div className="phone-frame">
      <div className="App"> 
        <Headers onMenuClick={toggleMenu} username="김유빈" isOpen={menuOpen} onClose={closeMenu}></Headers>
        <div className='main-container'>
          <div className='main-container-time'>
            <div className='main-container-time-date'>{date}</div><div className='main-container-time-dayofweek'>{dayOfWeek}</div>
          </div>
          {songs.length === 0 ? (
        <p>예정된 합주가 없습니다.</p>
      ) : (
        songs.map(song => (
          <div key={song.id} className='main-container-song'>
            <div className='main-container-songname'>{song.songName}</div>
            <div className='main-container-songtime'>
              {new Date(song.startTime).toLocaleTimeString()} ~ {new Date(song.endTime).toLocaleTimeString()}
            </div>
            <div className='main-container-songperson'>{song.user}</div>
          </div>
                ))
          )}
        </div>
        <div>
          <div className="weekCalender-container">
            <ul className='main-weekCalender-date'>
                {weekInfo.map((day, index) => (
                  <li className='main-weekCalender-date-li' key={index}>
                    {day.date} 
                  </li>
              ))}
              </ul>
          </div>
          <div>
            <ul className='main-weekCalender-day'>
                {weekInfo.map((day, index) => (
                  <li className='main-weekCalender-day-li' key={index}>
                    {day.day} 
                  </li>
              ))}
              </ul>
          </div>
          <div>
            
          </div>
        </div>
    </div>
  </div>

  );
}

export default MainPage;
