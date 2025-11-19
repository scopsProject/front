import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from "../context/AuthContext";

// 페이지들 import
import LoginPage from '../pages/LoginPage';
import MainPage from '../pages/MainPage';
import ReservationPage from '../pages/ReservationPage';
import SongRegisterPage from '../pages/SongRegisterPage';
import CalenderPage from '../pages/CalenderPage';
import TimeTablePage from '../pages/TimeTablePage';
import SongAddPage from '../pages/SongAddPage';
import UserRegisterPage from '../pages/UserRegisterPage';

// ⬇️ 방금 만든 PrivateRoute를 import 하세요 (경로 확인 필수)
import PrivateRoute from '../components/PrivateRoute'; 

function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* =================================================== */}
          {/* 🟢 1. 누구나 접속 가능한 페이지 (Public) */}
          {/* =================================================== */}
          <Route path="/scops/login" element={<LoginPage />} />
          <Route path="/scops/register" element={<UserRegisterPage />} />


          {/* =================================================== */}
          {/* 🔒 2. 로그인이 필요한 페이지들 (Private) */}
          {/* 이 안쪽에 있는 페이지들은 토큰 없으면 접근 불가! */}
          {/* =================================================== */}
          <Route element={<PrivateRoute />}>
            <Route path="/scops/main" element={<MainPage />} />
            <Route path="/scops/reservation" element={<ReservationPage />} />
            <Route path="/scops/songRegister" element={<SongRegisterPage />} />
            <Route path="/scops/calender" element={<CalenderPage />} />
            <Route path="/scops/timeTable" element={<TimeTablePage />} />
            <Route path="/scops/songAdd" element={<SongAddPage />} />
          </Route>

          {/* (선택사항) 이상한 주소로 오거나 루트(/)로 오면 로그인 페이지로 보냄 */}
          {/* <Route path="*" element={<Navigate to="/scops/login" replace />} /> */}
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;