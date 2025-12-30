import axios from 'axios';
import Swal from 'sweetalert2';

export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// 1. 기본 URL로 Axios 인스턴스 생성
const api = axios.create({
  baseURL: BASE_URL,
});

// 2. 요청 인터셉터 (Request Interceptor)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor)
api.interceptors.response.use(
  (response) => {
    // 요청이 성공하면 그대로 응답을 반환
    return response;
  },
  (error) => {
    // 서버에서 에러가 왔을 때
    if (error.response) {
      const { status } = error.response;

      // 401(인증 실패) 또는 403(권한 없음 - 토큰 만료 포함) 에러가 발생했을 때
      if (status === 401 || status === 403) {
        
        // 현재 토큰이 남아있다면 (로그인 된 줄 알고 있다면)
        if (localStorage.getItem('token')) {
          
          // 1. 정보 삭제
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');

          Swal.fire({
            icon: 'warning',
            title: '세션 만료',
            text: '로그인 시간이 만료되었습니다. 다시 로그인해주세요.',
            confirmButtonText: '확인',
            buttonsStyling: false,
            customClass: {
              popup: 'my-swal-popup',
              title: 'my-swal-title',
              confirmButton: 'my-swal-confirm'
            }
          }).then(() => {
            window.location.href = '/scops/login';
          });
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;