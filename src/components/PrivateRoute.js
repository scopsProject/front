import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // 1. 로컬 스토리지에서 토큰이 있는지 확인
  const token = localStorage.getItem('token');

  // 2. 토큰이 있으면? -> 자식 컴포넌트(Outlet) 보여줌
  // 3. 토큰이 없으면? -> 로그인 페이지로 강제 이동 (Navigate)
  return token ? <Outlet /> : <Navigate to="/scops/login" replace />;
};

export default PrivateRoute;