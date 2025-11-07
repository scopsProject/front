import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from "../context/AuthContext";
import LoginPage from '../pages/LoginPage';
import MainPage from '../pages/MainPage';
import ReservationPage from '../pages/ReservationPage';
import SongRegisterPage from '../pages/SongRegisterPage';
import CalenderPage from '../pages/CalenderPage';
import TimeTablePage from '../pages/TimeTablePage';
import SongAddPage from '../pages/SongAddpage';
import UserRegisterPage from '../pages/UserRegisterPage';

function Router() {
  return (
    <BrowserRouter basename="/scops">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/songRegister" element={<SongRegisterPage />} />
          <Route path="/calender" element={<CalenderPage />} />
          <Route path="/timeTable" element={<TimeTablePage />} />
          <Route path="/songAdd" element={<SongAddPage />} />
          <Route path="/register" element={<UserRegisterPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;
