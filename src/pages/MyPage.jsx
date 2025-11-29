import { useAuth } from "../context/AuthContext.js";
import './MyPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import React from "react";

const MyPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleMenuClick = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  return (
    <div className="mypage-root">
      <div className="mypage-phone">
        {/*  위쪽 고정 헤더 (메뉴 + 로고 + 안녕하세요 000님 + 사이드메뉴) */}
        <Headers
          onMenuClick={handleMenuClick}
          isOpen={isMenuOpen}
          onClose={handleCloseMenu}
        />

        {/* 프로필 영역 */}
        <section className="profile-section">
          <div className="profile-name-badge">
            <div className="profile-name">
              {user ? user.userName : "이름"}
            </div>
          </div>

          <div className="profile-meta">
            {/* 세션(예: VKG 같은 느낌) */}
            <span className="profile-code">
              {user?.session || "SESSION"}
            </span>
            {/* 기수 */}
            <span className="profile-generation">
              {user ? `${user.userYear}기` : "기수"}
            </span>
          </div>

          <button className="edit-button">수정하기</button>
        </section>

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
              {Array.from({ length: 11 }).map((_, idx) => {
                const hour = 10 + idx; // 10 ~ 20
                return (
                  <div key={hour} className="time-label">
                    {hour}
                  </div>
                );
              })}
            </div>

            {/* 오른쪽 시간표 그리드 */}
            <div className="timetable-grid">
              {/* 기본 빈 셀들 */}
              {Array.from({ length: 11 }).map((_, row) => (
                <React.Fragment key={row}>
                  {Array.from({ length: 7 }).map((_, col) => (
                    <div
                      key={`${row}-${col}`}
                      className="timetable-cell"
                    />
                  ))}
                </React.Fragment>
              ))}

            </div>
          </div>
        </section>

        {/* 하단 버튼 */}
        <section className="bottom-button-area">
          <button className="friends-button">친구 시간표 보러가기</button>
        </section>
      </div>
    </div>
  );
};

export default MyPage;
