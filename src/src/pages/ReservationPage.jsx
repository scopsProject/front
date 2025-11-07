
import "./ReservationPage.css";
import Headers from '../components/Headers';
import  '../components/Headers.css';
import { useState, useEffect } from 'react';
import axios from 'axios';


const ReservationPage = () => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [member1, setMember1] = useState("");
  const [member2, setMember2] = useState("");
  const [songs, setSongs] = useState(["머큐리얼", "메테리얼걸", "시퍼런봄"]);

  const days = ["월", "화", "수", "목", "금", "토", "일"];

  const handleSubmit = () => {
    alert(`예약 완료!\n날짜: ${selectedDay}\n시간: ${startTime} ~ ${endTime}\n멤버: ${member1}, ${member2}`);
  };

  return (
    <div className="phone-frame">
      <div className="reservation-container">

        {/* 날짜 선택 */}
        <div className="calendar-label">날짜</div>
        <div className="calendar-days">
          {days.map((day, index) => (
            <div
              key={index}
              className={`day-box ${selectedDay === day ? "selected" : ""}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 시간 선택 */}
        <div className="calendar-label">시간</div>
        <div className="time-select">
          <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
            <option value="">시작 시간</option>
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
          </select>
          <span className="dash">~</span>
          <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
            <option value="">종료 시간</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
          </select>
        </div>

        {/* 멤버 입력 */}
        <div className="calendar-label">멤버</div>
        <div className="member-list">
          <input
            className="member-item"
            type="text"
            placeholder="멤버 1"
            value={member1}
            onChange={(e) => setMember1(e.target.value)}
          />
          <input
            className="member-item"
            type="text"
            placeholder="멤버 2"
            value={member2}
            onChange={(e) => setMember2(e.target.value)}
          />
        </div>

        {/* 곡 리스트 */}
        <div className="calendar-label">등록된 곡</div>
        <div className="member-list">
          {songs.length > 0 ? (
            songs.map((song, idx) => (
              <div key={idx} className="member-item">{song}</div>
            ))
          ) : (
            <div className="member-item empty">곡이 없습니다.</div>
          )}
        </div>

        {/* 예약 버튼 */}
        <button className="submit-button" onClick={handleSubmit}>
          예약하기
        </button>
      </div>
    </div>
  );
};

export default ReservationPage;
