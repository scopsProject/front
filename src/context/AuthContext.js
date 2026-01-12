import { createContext, useContext, useState } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        return true; // 유효기간 지남
      }
      return false; // 유효함
    } catch (error) {
      return true; // 토큰 형식이 이상하면 만료된 것으로 취급
    }
  };

  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('userInfo');

      // 1. 토큰이나 유저 정보가 없으면 null
      if (!token || !savedUser) {
        return null;
      }

      // 2. 토큰이 있지만 만료되었다면? -> 청소하고 null 리턴
      if (isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        return null;
      }

      // 3. 유효하다면 로그인 유지
      return JSON.parse(savedUser);
    } catch (error) {
      return null;
    }
  });

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}