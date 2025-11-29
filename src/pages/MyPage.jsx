import { useAuth } from "../context/AuthContext.js";
import './MyPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect } from 'react';
import React from "react";
import { useNavigate } from 'react-router-dom';
import api from "../api.js";

const MyPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const handleMenuClick = () => setIsMenuOpen(true);
    const handleCloseMenu = () => setIsMenuOpen(false);
    const [timeTables, setTimeTables] = useState([]);

    useEffect(() => {
        api.get('/scops/timetable')
            .then(res => setTimeTables(res.data))
            .catch(err => console.error("시간표 로딩 실패", err));
    }, []);

    const getSchedule = (dayIndex, hour) => {
        const weekDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const currentDay = weekDays[dayIndex];

        // 해당 요일, 해당 시간에 걸리는 수업 찾기
        // (간단하게 '시작 시간'이 해당 시간인 경우만 표시하거나, 범위 체크)
        return timeTables.find(t => {
            const startH = parseInt(t.startTime.split(':')[0], 10);
            const endH = parseInt(t.endTime.split(':')[0], 10);
            return t.dayOfWeek === currentDay && hour >= startH && hour < endH;
        });
    };

    const handleEdit = (path) => {
        navigate(path);
    }
    return (
        <div className="app-container">
            <div className="App">
                <Headers
                    onMenuClick={handleMenuClick}
                    isOpen={isMenuOpen}
                    onClose={handleCloseMenu}
                />
                <div className="mypage-main-container">
                    <div className="profile-section">
                        <span className="profile-name">
                            {user ? user.name : "이름"}
                        </span>
                        <div className="profile-sessionAndYear">
                            <span className="profile-code">
                                {user?.session || "SESSION"}
                            </span>
                            {/* 기수 */}
                            <span className="profile-generation">
                                {user ? `${user.year}th` : "기수"}
                            </span>
                        </div>
                        <button className="edit-button" onClick={() => handleEdit('/scops/edit')}>수정하기</button>
                    </div>

                    {/* 내 시간표 제목 */}
                    <section className="section-title">
                        <span>내 시간표 확인</span>
                    </section>

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
                                {Array.from({ length: 12 }).map((_, idx) => {
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
                                {Array.from({ length: 12 }).map((_, row) => {
                                    const currentHour = 9 + row; // 10시, 11시...
                                    return (
                                        <React.Fragment key={row}>
                                            {Array.from({ length: 7 }).map((_, col) => {
                                                const schedule = getSchedule(col, currentHour); // 일정 찾기
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
                                                                    fontFamily: 'suit',
                                                                    color: '#634900',
                                                                    fontSize: '9px', // 글자 크기 조정
                                                                    lineHeight: '1.1'
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

                    {/* 하단 버튼 */}
                    <section className="bottom-button-area">
                        <button className="friends-button">친구 시간표 보러가기</button>
                    </section>
                </div>

            </div>
        </div>
    );
};

export default MyPage;