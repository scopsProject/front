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

  // --- 직위 변경 모달 상태 ---
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // --- 회원 관리(강제 탈퇴) 모달 상태 ---
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  const [activeUsers, setActiveUsers] = useState([]); // 전체 유저 목록
  const [searchTerm, setSearchTerm] = useState(''); // 검색어

  // 1. 가입 승인 모달 열기
  const handleOpenApproveModal = () => {
    setShowApproveModal(true);
    fetchPendingUsers();
  };

  // 2. 직위 변경 모달 열기
  const handleOpenRoleModal = () => {
    setShowRoleModal(true);
    setSearchTerm(''); 
    fetchActiveUsers();
  };

  // 3. 회원 관리 모달 열기
  const handleOpenMemberModal = () => {
    setShowMemberModal(true);
    setSearchTerm(''); 
    fetchActiveUsers(); 
  };

  const handleCloseModal = () => {
    setShowApproveModal(false);
    setShowRoleModal(false);
    setShowMemberModal(false);
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

  // --- API: 승인된(활성) 회원 목록 ---
  const fetchActiveUsers = async () => {
    try {
      const response = await api.get('/scops/admin/active-users');
      setActiveUsers(response.data);
    } catch (error) {
      console.error('유저 목록 로드 실패:', error);
    }
  };

  // ✅ [공통 옵션] CSS에 정의된 클래스만 사용하도록 통일
  const swalCommonOptions = {
    buttonsStyling: false,
    customClass: {
      popup: 'my-swal-popup',
      title: 'my-swal-title',
      confirmButton: 'my-swal-confirm', // CSS에 정의된 유일한 확인 버튼
      cancelButton: 'my-swal-cancel'
    }
  };

  // 승인 처리
  const handleApprove = async (userID) => {
    try {
      await api.post(`/scops/admin/approve/${userID}`);

      Swal.fire({
        ...swalCommonOptions,
        icon: 'success',
        title: '승인 완료',
        text: '회원가입이 승인되었습니다.',
        confirmButtonText: '확인',
      });

      setJoinRequests((prev) => prev.filter((req) => req.userID !== userID));
    } catch (error) {
      Swal.fire({
        ...swalCommonOptions,
        icon: 'error',
        title: '오류',
        text: '승인 처리 중 오류가 발생했습니다.',
        confirmButtonText: '확인',
      });
    }
  };

  // 거절 처리
  const handleReject = async (userID) => {
    const result = await Swal.fire({
      ...swalCommonOptions, // 공통 옵션 적용
      title: '거절 확인',
      text: '정말 거절(삭제)하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '거절',
      cancelButtonText: '취소',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/scops/admin/reject/${userID}`);

      Swal.fire({
        ...swalCommonOptions,
        icon: 'success',
        title: '처리 완료',
        text: '가입 요청이 거절되었습니다.',
        confirmButtonText: '확인',
      });

      setJoinRequests((prev) => prev.filter((req) => req.userID !== userID));
    } catch (error) {
      Swal.fire({
        ...swalCommonOptions,
        icon: 'error',
        title: '오류',
        text: '거절 처리 중 오류가 발생했습니다.',
        confirmButtonText: '확인',
      });
    }
  };

  // 직위 변경 로직
  const handleChangeRole = async (user) => {
    const currentRole = user.role;
    const newRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    const roleName = newRole === 'ROLE_ADMIN' ? '관리자' : '일반 유저';

    // 1. 변경 확인 모달
    const result = await Swal.fire({
      ...swalCommonOptions, // 공통 옵션 적용
      title: '직위 변경',
      html: `${user.userName}님을 ${roleName === '관리자'
        ? `<span style="color:#4A90E2;">[${roleName}]</span>`
        : `<span style="color:#F39C12;">[${roleName}]</span>`
        }로 변경하시겠습니까?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '변경',
      cancelButtonText: '취소',
    });

    if (result.isConfirmed) {
      try {
        await api.patch(`/scops/admin/update-role/${user.userID}`, { role: newRole });

        // 2. 성공 알림
        Swal.fire({
          ...swalCommonOptions,
          title: '변경 완료!',
          text: `${user.userName}님의 직위가 변경되었습니다.`,
          icon: 'success',
          confirmButtonText: '확인',
        });

        // 로컬 상태 업데이트
        setActiveUsers((prev) =>
          prev.map((u) =>
            u.userID === user.userID ? { ...u, role: newRole } : u
          )
        );
      } catch (error) {
        console.error('직위 변경 실패:', error);
        Swal.fire({
          ...swalCommonOptions,
          title: '변경 실패',
          text: '직위 변경 중 오류가 발생했습니다.',
          icon: 'error',
          confirmButtonText: '확인',
        });
      }
    }
  };

  // 강제 탈퇴 로직
  const handleForceDelete = async (user) => {
    const result = await Swal.fire({
      ...swalCommonOptions,
      title: '강제 탈퇴',
      html: `<span style="color:#d33;">${user.userName}</span>님을 정말 탈퇴시키겠습니까?<br/><small>(이 작업은 되돌릴 수 없습니다)</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '탈퇴 처리',
      cancelButtonText: '취소',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/scops/admin/force-withdrawal/${user.userID}`);

        Swal.fire({
          ...swalCommonOptions,
          icon: 'success',
          title: '탈퇴 완료',
          text: `${user.userName}님이 강제 탈퇴 처리되었습니다.`,
          confirmButtonText: '확인',
        });

        // 리스트에서 제거
        setActiveUsers((prev) => prev.filter((u) => u.userID !== user.userID));

      } catch (error) {
        console.error('강제 탈퇴 실패:', error);
        Swal.fire({
          ...swalCommonOptions,
          icon: 'error',
          title: '오류',
          text: '탈퇴 처리 중 오류가 발생했습니다.',
          confirmButtonText: '확인',
        });
      }
    }
  };

  // 검색 필터링 로직
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
          <button className="manage-role-btn" onClick={handleOpenRoleModal}>
            직위 <br /><br />변경하기
          </button>
          <button className="manage-member-btn" onClick={handleOpenMemberModal}>
            회원 <br /><br />관리하기
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

              <div className="search-box">
                <input
                  type="text"
                  placeholder="이 름 검 색"
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
                        <span className="generation-role">{user.userYear}th</span>
                      </div>

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

        {/* 3. 회원 관리(강제 탈퇴) 모달 */}
        {showMemberModal && (
          <div className="managemodal-overlay">
            <div className="managemodal-content">
              <div className="managemodal-header">
                <span className='managemodal-header-name'>회원 관리</span>
                <button className="manageclose-btn" onClick={handleCloseModal}>✖</button>
              </div>

              <div className="search-box">
                <input
                  type="text"
                  placeholder="이 름 검 색"
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
                        <span className="name-role">{user.userName}</span>
                        <span className="generation-role">{user.userYear}th</span>
                      </div>

                      <button
                        className="btn-force-delete"
                        onClick={() => handleForceDelete(user)}
                      >
                        강제 탈퇴
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