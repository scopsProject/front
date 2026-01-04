import './SongDetailView.css';
import { useState } from 'react';
import api from '../api';
import Swal from 'sweetalert2';
import '../components/SweetAlertCustom.css';

function SongDetailView({ song, onClose, eventName, reloadSongs }) {

  const [songName, setSongName] = useState(song.songName);
  const [singerName, setSingerName] = useState(song.singerName);
  const [sessions, setSessions] = useState(song.sessions);

  // 세션 종류 옵션
  const SESSION_TYPES = ["V", "G", "B", "D", "P", "POS."];

  // 세션 정보 변경 (드롭다운 or 이름 입력 시)
  const handleSessionChange = (index, field, value) => {
    const newSessions = [...sessions];
    newSessions[index][field] = value;
    setSessions(newSessions);
  };

  // 세션 추가 (+)
  const handleAddSession = () => {
    setSessions([...sessions, { sessionType: "V", playerName: "" }]);
  };

  // 세션 삭제 (X)
  const handleRemoveSession = (idx) => {
    setSessions(sessions.filter((_, i) => i !== idx));
  };

  // 수정 완료
  const handleUpdate = () => {
    api.put(`/songs/update/${song.id}`, {
      eventName,
      songName,
      singerName,
      sessions
    })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: '수정 완료',
          text: '수정이 완료되었습니다.',
          confirmButtonText: '확인',
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            confirmButton: 'my-swal-confirm'
          },
          buttonsStyling: false
        });
        reloadSongs();
        onClose();
        // window.location.reload(); // 리로드 없이 바로 반영되도록 주석 처리 (선택사항)
      })
      .catch(err => {
        console.error("수정 실패:", err);
        Swal.fire({
          icon: 'error',
          title: '수정 실패',
          text: err.response?.data?.message || '수정 중 오류가 발생했습니다.',
          confirmButtonText: '확인',
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            confirmButton: 'my-swal-confirm'
          },
          buttonsStyling: false
        });
      });
  };

  // 삭제
  const handleDelete = () => {
    Swal.fire({
      title: '삭제 확인',
      text: '정말 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        confirmButton: 'my-swal-confirm',
        cancelButton: 'my-swal-cancel'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        api.delete(`/songs/delete/${song.id}`)
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: '삭제 완료',
              text: '곡이 삭제되었습니다.',
              confirmButtonText: '확인',
              customClass: {
                popup: 'my-swal-popup',
                title: 'my-swal-title',
                confirmButton: 'my-swal-confirm'
              },
              buttonsStyling: false
            });
            onClose();
            reloadSongs(); // 리로드 추가
            // window.location.reload(); 
          })
          .catch(err => {
            console.error("삭제 실패:", err);
            Swal.fire({
              icon: 'error',
              title: '삭제 실패',
              text: err.response?.data?.message || '삭제 중 오류가 발생했습니다.',
              confirmButtonText: '확인',
              customClass: {
                popup: 'my-swal-popup',
                title: 'my-swal-title',
                confirmButton: 'my-swal-confirm'
              },
              buttonsStyling: false
            });
          });
      }
    });
  };

  return (
    <div className="songDetail-container">

      <div className="songDetail-box">

        <div className="songDetail-header">
          <div>
            <span className="songDetail-title">
              {song.songName}
            </span>
            <span className="songDetail-singer">{song.singerName}</span>
          </div>
          <button className="songDetail-close" onClick={onClose}>X</button>
        </div>

        <div className="songDetail-body">
          {/* 1. 곡 제목 세트 */}
          <div className="input-row">
            <label>곡 제목 변경</label>
            <input
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              className="detail-input"
            />
          </div>

          {/* 2. 가수 변경 세트 */}
          <div className="input-row">
            <label>가수 변경</label>
            <input
              value={singerName}
              onChange={(e) => setSingerName(e.target.value)}
              className="detail-input"
            />
          </div>

          {/* 3. 포지션 변경 세트 */}
          <div className="input-row" style={{ alignItems: 'flex-start' }}>
            <label>포지션 변경</label>
            <div className="session-list">
              {sessions.map((s, idx) => (
                <div key={idx} className="session-item">
                  {/* 세션 타입 선택 (Dropdown) */}
                  <select
                    className="session-select"
                    value={s.sessionType}
                    onChange={(e) => handleSessionChange(idx, 'sessionType', e.target.value)}
                  >
                    {SESSION_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  {/* 플레이어 이름 입력 (Input) */}
                  <input
                    className="session-input"
                    value={s.playerName}
                    onChange={(e) => handleSessionChange(idx, 'playerName', e.target.value)}
                    placeholder="이름"
                  />

                  {/* 삭제 버튼 */}
                  <button className="session-remove" onClick={() => handleRemoveSession(idx)}>X</button>
                </div>
              ))}
              
              {/* 추가 버튼 (+) */}
              <button className="add-session-btn" onClick={handleAddSession}>+</button>
            </div>
          </div>
        </div>

        <div className="songDetail-footer">
          <button className="delete-btn" onClick={handleDelete}>삭 제 하 기</button>
          <button className="update-btn" onClick={handleUpdate}>수 정 완 료</button>
        </div>

      </div>

    </div>
  );
}

export default SongDetailView;