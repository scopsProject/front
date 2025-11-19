import axios from 'axios';
export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// 1. 기본 URL로 Axios 인스턴스 생성
const api = axios.create({
  baseURL: BASE_URL,
});

// 2. 🚀 요청 인터셉터 (Request Interceptor) - 마법의 시작
//    'api' 인스턴스로 보내는 *모든* 요청은 전송되기 전에 이 코드를 거칩니다.
api.interceptors.request.use(
  (config) => {
    // 3. localStorage에서 'token'을 가져옵니다.
    const token = localStorage.getItem('token');

    // 4. 토큰이 있으면, HTTP 헤더에 'Authorization'을 추가합니다.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 요청 오류가 있는 경우
    return Promise.reject(error);
  }
);

export default api;