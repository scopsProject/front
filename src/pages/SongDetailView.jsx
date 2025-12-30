import './SongDetailView.css';
import { useState } from 'react';
import api from '../api';
import Swal from 'sweetalert2';
import '../components/SweetAlertCustom.css';

function SongDetailView({ song, onClose, eventName, reloadSongs }) {

  const [songName, setSongName] = useState(song.songName);
  const [singerName, setSingerName] = useState(song.singerName);
  const [sessions, setSessions] = useState(song.sessions);

  // 세션 삭제
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
      window.location.reload();
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
            window.location.reload();
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
          <div className="songDetail-title">
            {song.songName}
            <span className="songDetail-singer">{song.singerName}</span>
          </div>
          <button className="songDetail-close" onClick={onClose}>✕</button>
        </div>

        <div className="songDetail-body">
          <label>곡 제목 변경</label>
          <input
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
          />

          <label>가수 변경</label>
          <input
            value={singerName}
            onChange={(e) => setSingerName(e.target.value)}
          />

          <label>포지션 변경</label>
          <div className="session-list">
            {sessions.map((s, idx) => (
              <div key={idx} className="session-item">
                <span className="session-type">{s.sessionType}</span>
                <span className="session-player">{s.playerName}</span>
                <button className="session-remove" onClick={() => handleRemoveSession(idx)}>X</button>
              </div>
            ))}
          </div>
        </div>

        <div className="songDetail-footer">
          <button className="delete-btn" onClick={handleDelete}>삭제하기</button>
          <button className="update-btn" onClick={handleUpdate}>수정 완료</button>
        </div>

      </div>

    </div>
  );
}

export default SongDetailView;
