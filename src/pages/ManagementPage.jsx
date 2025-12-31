import './ManagementPage.css';
import Headers from '../components/Headers';
import '../components/Headers.css';
import { useState } from 'react';
import api from '../api';
import Swal from 'sweetalert2';
import '../components/SweetAlertCustom.css';

function ManagementPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // --- 기존: 가입 승인 모달 상태 ---
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);

  // --- 🔥 신규: 직위 변경 모달 상태 ---
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]); // 전체 유저 목록
  const [searchTerm, setSearchTerm] = useState(''); // 검색어

  // 1. 가입 승인 모달 열기
  const handleOpenApproveModal = () => {
    setShowApproveModal(true);
    fetchPendingUsers();
  };

  // 2. 🔥 직위 변경 모달 열기
  const handleOpenRoleModal = () => {
    setShowRoleModal(true);
    setSearchTerm(''); // 검색어 초기화
    fetchActiveUsers();
  };

  const handleCloseModal = () => {
    setShowApproveModal(false);
    setShowRoleModal(false);
  };

  // --- API: 대기중인 회원 목록 ---
  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/scops/admin/pending-users');
      setJoinRequests(response.data);
    } catch (error) {
      console.error('대기 목록 로드 실패:', error);
    }
  };

  // --- 🔥 API: 승인된(활성) 회원 목록 (직위 변경용) ---
  const fetchActiveUsers = async () => {
    try {
      const response = await api.get('/scops/admin/active-users');
      setActiveUsers(response.data);
    } catch (error) {
      console.error('유저 목록 로드 실패:', error);
    }
  };

  // 승인 처리
  const handleApprove = async (userID) => {
    try {
      await api.post(`/scops/admin/approve/${userID}`);

      Swal.fire({
        icon: 'success',
        title: '승인 완료',
        text: '회원가입이 승인되었습니다.',
        confirmButtonText: '확인',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm'
        },
        buttonsStyling: false
      });

      setJoinRequests((prev) => prev.filter((req) => req.userID !== userID));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: '승인 처리 중 오류가 발생했습니다.',
        confirmButtonText: '확인',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm'
        },
        buttonsStyling: false
      });
    }
  };

  // 거절 처리
  const handleReject = async (userID) => {
    const result = await Swal.fire({
      title: '거절 확인',
      text: '정말 거절(삭제)하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '거절',
      cancelButtonText: '취소',
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        confirmButton: 'my-swal-confirm',
        cancelButton: 'my-swal-cancel'
      },
      buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/scops/admin/reject/${userID}`);

      Swal.fire({
        icon: 'success',
        title: '처리 완료',
        text: '가입 요청이 거절되었습니다.',
        confirmButtonText: '확인',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm'
        },
        buttonsStyling: false
      });

      setJoinRequests((prev) => prev.filter((req) => req.userID !== userID));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: '거절 처리 중 오류가 발생했습니다.',
        confirmButtonText: '확인',
        customClass: {
          popup: 'my-swal-popup',
          title: 'my-swal-title',
          confirmButton: 'my-swal-confirm'
        },
        buttonsStyling: false
      });
    }
  };

  const handleChangeRole = async (user) => {
    // 현재 권한의 반대로 설정 로직
    const currentRole = user.role;
    const newRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    const roleName = newRole === 'ROLE_ADMIN' ? '관리자' : '일반 유저';

    // 1. 변경 확인 모달
    const result = await Swal.fire({
      title: '직위 변경',
      html: `${user.userName}님을 ${roleName === '관리자'
          ? `<span style="color:#4A90E2;">[${roleName}]</span>`
          : `<span style="color:#F39C12;">[${roleName}]</span>`
        }로 변경하시겠습니까?`,

      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '변경',
      cancelButtonText: '취소',
      customClass: {
        popup: 'my-swal-popup',
        title: 'my-swal-title',
        confirmButton: 'my-swal-confirm',
        cancelButton: 'my-swal-cancel'
      },
      buttonsStyling: false
    });

    // 사용자가 '변경' 버튼을 눌렀을 때만 실행
    if (result.isConfirmed) {
      try {
        // API 요청
        await api.patch(`/scops/admin/update-role/${user.userID}`, { role: newRole });

        // 2. 성공 알림 모달 (alert 대체)
        Swal.fire({
          title: '변경 완료!',
          text: `${user.userName}님의 직위가 변경되었습니다.`,
          icon: 'success',
          confirmButtonText: '확인',
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            confirmButton: 'my-swal-confirm'
          },
          buttonsStyling: false
        });

        // 로컬 상태 업데이트 (화면 즉시 반영)
        setActiveUsers((prev) =>
          prev.map((u) =>
            u.userID === user.userID ? { ...u, role: newRole } : u
          )
        );
      } catch (error) {
        console.error('직위 변경 실패:', error);

        // 3. 실패 알림 모달
        Swal.fire({
          title: '변경 실패',
          text: '직위 변경 중 오류가 발생했습니다.',
          icon: 'error',
          confirmButtonText: '확인',
          customClass: {
            popup: 'my-swal-popup',
            title: 'my-swal-title',
            confirmButton: 'my-swal-confirm'
          },
          buttonsStyling: false
        });
      }
    }
  };

  // 🔥 검색 필터링 로직
  const filteredUsers = activeUsers.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="App">
      <div className="app-container">
        <Headers onMenuClick={toggleMenu} isOpen={menuOpen} onClose={closeMenu} />

        <div className='management-page-container'>
          <button className="manage-btn" onClick={handleOpenApproveModal}>
            회원가입 <br /><br />승인하기
          </button>
          {/* 🔥 신규 버튼 추가 */}
          <button className="manage-role-btn" onClick={handleOpenRoleModal}>
            직위 <br /><br />변경하기
          </button>
        </div>

        {/* 1. 가입 승인 모달 */}
        {showApproveModal && (
          <div className="managemodal-overlay">
            <div className="managemodal-content">
              <div className="managemodal-header">
                <span className='managemodal-header-name'>가입 요청 목록</span>
                <button className="manageclose-btn" onClick={handleCloseModal}>✖</button>
              </div>
              <div className="request-list">
                {joinRequests.length === 0 ? (
                  <p className="no-data">대기 중인 요청이 없습니다.</p>
                ) : (
                  joinRequests.map((req) => (
                    <div key={req.userID} className="request-item">
                      <div className="user-info">
                        <span className="name">{req.userName}</span>
                        <span className="generation">{req.userYear}th</span>
                      </div>
                      <div className="action-buttons">
                        <button className="btn-approve" onClick={() => handleApprove(req.userID)}>승인</button>
                        <button className="btn-reject" onClick={() => handleReject(req.userID)}>거절</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. 직위 변경 모달 */}
        {showRoleModal && (
          <div className="managemodal-overlay">
            <div className="managemodal-content">
              <div className="managemodal-header">
                <span className='managemodal-header-name'>직위 변경</span>
                <button className="manageclose-btn" onClick={handleCloseModal}>✖</button>
              </div>

              {/* 검색창 */}
              <div className="search-box">
                <input
                  type="text"
                  placeholder="이름 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="modal-search-input"
                />
              </div>

              <div className="request-list">
                {filteredUsers.length === 0 ? (
                  <p className="no-data">검색 결과가 없습니다.</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.userID} className="request-item">
                      <div className="user-info">
                        <span className={`role-badge ${user.role === 'ROLE_ADMIN' ? 'admin' : 'user'}`}>
                          {user.role === 'ROLE_ADMIN' ? '관리자' : '유저'}
                        </span>
                        <span className="name-role">{user.userName}</span>
                        <span className="generation-role">{user.userYear}기</span>
                      </div>

                      {/* 변경 버튼 */}
                      <button
                        className={`btn-change-role ${user.role === 'ROLE_ADMIN' ? 'to-user' : 'to-admin'}`}
                        onClick={() => handleChangeRole(user)}
                      >
                        {user.role === 'ROLE_ADMIN' ? '유저로 변경' : '관리자로 변경'}
                      </button>
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