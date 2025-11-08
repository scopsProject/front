import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from "../context/AuthContext";
import LoginPage from '../src/pages/LoginPage';
import MainPage from '../src/pages/MainPage';
import ReservationPage from '../src/pages/ReservationPage';
import SongRegisterPage from '../src/pages/SongRegisterPage';
import CalenderPage from '../src/pages/CalenderPage';
import TimeTablePage from '../src/pages/TimeTablePage';
import SongAddPage from '../src/pages/SongAddpage';
import UserRegisterPage from '../src/pages/UserRegisterPage';

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