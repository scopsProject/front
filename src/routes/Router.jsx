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
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/scops/login" element={<LoginPage />} />
          <Route path="/scops/main" element={<MainPage />} />
          <Route path="/scops/reservation" element={<ReservationPage />} />
          <Route path="/scops/songRegister" element={<SongRegisterPage />} />
          <Route path="/scops/calender" element={<CalenderPage />} />
          <Route path="/scops/timeTable" element={<TimeTablePage />} />
          <Route path="/scops/songAdd" element={<SongAddPage />} />
          <Route path="/scops/register" element={<UserRegisterPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;
