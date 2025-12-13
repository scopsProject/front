import './ManagementPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState } from 'react';
import api from '../api';

function ManagementPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // 모달 표시 여부 State
  const [showModal, setShowModal] = useState(false);

  // 회원가입 요청 데이터 State (백엔드 UserInfoDto 형식에 맞춤)
  const [joinRequests, setJoinRequests] = useState([]);

  // 모달 열릴 때 데이터 가져오기
  const handleOpenModal = () => {
    setShowModal(true);
    fetchPendingUsers();
  };

  const handleCloseModal = () => setShowModal(false);

  // 1. 대기중인 회원 목록 조회 API 호출
  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/scops/admin/pending-users');
      // 백엔드에서 List<UserInfoDto>가 반환됨
      setJoinRequests(response.data);
    } catch (error) {
      console.error('회원 목록 불러오기 실패:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    }
  };

  // 2. 승인 처리 함수
  const handleApprove = async (userID) => {
    try {
      // 백엔드: POST /scops/admin/approve/{userID}
      await api.post(`/scops/admin/approve/${userID}`);
      alert('승인되었습니다.');
      
      // 목록 갱신 (네트워크 요청 줄이기 위해 로컬 State에서 제거)
      setJoinRequests((prev) => prev.filter((req) => req.userID !== userID));
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인 처리에 실패했습니다.');
    }
  };

  // 3. 거절 처리 함수
  const handleReject = async (userID) => {
    if (!window.confirm('정말 거절하시겠습니까? (데이터가 삭제됩니다)')) return;

    try {
      // 백엔드: DELETE /scops/admin/reject/{userID}
      await api.delete(`/scops/admin/reject/${userID}`);
      alert('거절되었습니다.');

      // 목록 갱신
      setJoinRequests((prev) => prev.filter((req) => req.userID !== userID));
    } catch (error) {
      console.error('거절 실패:', error);
      alert('거절 처리에 실패했습니다.');
    }
  };

  return (
    <div className="App">
      <div className="app-container">
        <Headers onMenuClick={toggleMenu} isOpen={menuOpen} onClose={closeMenu} />

        <div className='management-page-container'>
          <button className="manage-btn" onClick={handleOpenModal}>
            회원가입 승인하기
          </button>
        </div>

        {/* 모달 창 */}
        {showModal && (
          <div className="managemodal-overlay">
            <div className="managemodal-content">
              <div className="managemodal-header">
                <h3>가입 요청 목록</h3>
                <button className="manageclose-btn" onClick={handleCloseModal}>✖</button>
              </div>

              <div className="request-list">
                {joinRequests.length === 0 ? (
                  <p className="no-data">대기 중인 요청이 없습니다.</p>
                ) : (
                  joinRequests.map((req) => (
                    // 백엔드의 UserInfoDto 필드를 사용 (userID, userName, userYear)
                    <div key={req.userID} className="request-item">
                      <div className="user-info">
                        <span className="generation">{req.userYear}기</span>
                        <span className="name">{req.userName}</span>
                      </div>
                      <div className="action-buttons">
                        <button 
                          className="btn-approve" 
                          onClick={() => handleApprove(req.userID)}
                        >
                          승인
                        </button>
                        <button 
                          className="btn-reject" 
                          onClick={() => handleReject(req.userID)}
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagementPage;