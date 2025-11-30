import { useAuth } from "../context/AuthContext.js";
import './MyPageEdit.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import Swal from 'sweetalert2';
import { useState, useEffect, useCallback } from 'react';
import React from "react";
import api from "../api.js";
import { useNavigate } from 'react-router-dom';

const MyPageEdit = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const handleMenuClick = () => setIsMenuOpen(true);
    const handleCloseMenu = () => setIsMenuOpen(false);
    const [showModal, setShowModal] = useState(false);
    const [timeTables, setTimeTables] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        memo: "",
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "10:00"
    });

    const fetchTimeTables = useCallback(() => {
        api.get('/scops/timetable')
            .then(res => setTimeTables(res.data))
            .catch(err => console.error("시간표 로딩 실패", err));
    }, []);

    // 🔥 [3] 페이지 로드 시 시간표 가져오기
    useEffect(() => {
        fetchTimeTables();
    }, [fetchTimeTables]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "title" && value.length > 15) {
            Swal.fire({
                icon: 'error',
                text: '시간표 이름은 최대 15글자까지 입력 가능합니다.',
                width: '350px'
            });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };



    const handleAddClick = () => {
        setSelectedId(null); // ID 초기화
        setFormData({
            title: "",
            memo: "",
            dayOfWeek: "MONDAY",
            startTime: "09:00",
            endTime: "10:00"
        });
        setShowModal(true);
    };

    // 🔥 [신규] 시간표 셀 클릭 (수정 모드로 모달 열기)
    const handleEditClick = (schedule) => {
        setSelectedId(schedule.id); // ID 설정
        setFormData({
            title: schedule.title,
            memo: schedule.memo || "",
            dayOfWeek: schedule.dayOfWeek,
            // "09:00:00" -> "09:00" (초 단위 자르기)
            startTime: schedule.startTime.slice(0, 5),
            endTime: schedule.endTime.slice(0, 5)
        });
        setShowModal(true);
    };

    // 🔥 [수정] 저장/수정 핸들러
    const handleSubmit = async () => {
        try {
            const payload = {
                title: formData.title,
                memo: formData.memo,
                dayOfWeek: formData.dayOfWeek,
                // 시간 포맷 맞추기 (HH:mm -> HH:mm:00)
                startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
                endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime
            };

            if (selectedId) {
                // 수정 (PUT)
                await api.put(`/timetables/${selectedId}`, payload);
                Swal.fire({ icon: 'success', title: '수정 완료', width: '300px' });
            } else {
                // 추가 (POST)
                await api.post('/scops/timetable', payload);
                Swal.fire({ icon: 'success', title: '추가 완료', width: '300px' });
            }

            setShowModal(false);
            fetchTimeTables(); // 목록 갱신
        } catch (error) {
            console.error(error);
            const msg = error.response?.data || "요청 실패";
            Swal.fire({ icon: 'error', title: '오류', text: msg, width: '300px' });
        }
    };

    // 🔥 [신규] 삭제 핸들러
    const handleDelete = async () => {
        if (!selectedId) return;

        // 삭제 전 확인 (선택사항)
        const result = await Swal.fire({
            title: '삭제하시겠습니까?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '삭제',
            cancelButtonText: '취소',
            width: '300px'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/timetables/${selectedId}`);
                Swal.fire({ icon: 'success', title: '삭제 완료', width: '300px' });
                setShowModal(false);
                fetchTimeTables(); // 목록 갱신
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: 'error', title: '오류', text: "삭제 실패", width: '300px' });
            }
        }
    };

    const getSchedule = (dayIndex, hour) => {
        const weekDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const currentDay = weekDays[dayIndex];
        return timeTables.find(t => {
            const startH = parseInt(t.startTime.split(':')[0], 10);
            const endH = parseInt(t.endTime.split(':')[0], 10);
            return t.dayOfWeek === currentDay && hour >= startH && hour < endH;
        });
    };

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
                    </div>

                    {/* 내 시간표 제목 */}
                    <section className="section-title">
                        <span>내 시간표 수정</span>
                        <button className="add-timetablebtn" onClick={handleAddClick}>+</button>
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
                                    const currentHour = 9 + row;
                                    return (
                                        <React.Fragment key={row}>
                                            {Array.from({ length: 7 }).map((_, col) => {
                                                // 🔥 [6] 저장된 시간표 정보 가져오기
                                                const schedule = getSchedule(col, currentHour);
                                                const isStartBlock = schedule && parseInt(schedule.startTime.split(':')[0], 10) === currentHour;

                                                return (
                                                    <div
                                                        key={`${row}-${col}`}
                                                        className="timetable-cell"
                                                        onClick={() => schedule && handleEditClick(schedule)}
                                                        // 🔥 [7] 데이터 있으면 색칠
                                                        style={schedule ? { backgroundColor: '#FFEEBB', padding: '1px', cursor: "pointer" } : {}}
                                                    >
                                                        {/* 🔥 [8] 시작 칸에 제목/메모 표시 */}
                                                        {isStartBlock && (
                                                            <div style={{
                                                                height: '100%',
                                                                overflow: 'hidden',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center'
                                                            }}>
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
                    </section>

                    {/* 하단 버튼 */}
                    <section className="bottom-button-area">
                        <button className="friends-button" onClick={() => navigate('/scops/myPage')}>수정완료</button>
                    </section>
                </div>
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content add-modal">
                            <div className="modal-header-row">
                                <h2 className="modal-title">{selectedId ? formData.title : "추가하기"}</h2>
                                <span className="modal-memo">{selectedId ? formData.memo : ""}</span>
                                <button className="modal-close-btn" onClick={() => setShowModal(false)}>X</button>
                            </div>

                            <div className="input-group">
                                <label>이 름</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} />
                            </div>

                            <div className="input-group">
                                <label>메 모</label>
                                <input type="text" name="memo" value={formData.memo} onChange={handleChange} />
                            </div>

                            <div className="input-group time-select-group">
                                <label>시 간</label>
                                <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange}>
                                    <option value="MONDAY">월</option>
                                    <option value="TUESDAY">화</option>
                                    <option value="WEDNESDAY">수</option>
                                    <option value="THURSDAY">목</option>
                                    <option value="FRIDAY">금</option>
                                    <option value="SATURDAY">토</option>
                                    <option value="SUNDAY">일</option>
                                </select>

                                <select name="startTime" value={formData.startTime} onChange={handleChange}>
                                    {Array.from({ length: 11 }, (_, i) => i + 10).map(h => (
                                        <option key={h} value={`${h}:00`}>{h}:00</option>
                                    ))}
                                </select>
                                <span>-</span>
                                <select name="endTime" value={formData.endTime} onChange={handleChange}>
                                    {Array.from({ length: 11 }, (_, i) => i + 11).map(h => (
                                        <option key={h} value={`${h}:00`}>{h}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer-buttons">

                                {/* 수정 모드(selectedId 있음)일 때만 삭제 버튼 표시 */}
                                {selectedId && (
                                    <button
                                        className="modal-btn delete"
                                        onClick={handleDelete}
                                    >
                                        삭 제 하 기
                                    </button>
                                )}

                                {/* 저장/수정 버튼 */}
                                <button
                                    className={`modal-btn submit ${selectedId ? 'half-width' : 'full-width'}`}
                                    onClick={handleSubmit}
                                >
                                    {selectedId ? "수 정 완 료" : "저 장 완 료"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MyPageEdit;