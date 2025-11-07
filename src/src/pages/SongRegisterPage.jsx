import './SongRegisterPage.css';
import Headers from '../components/Headers';
import  '../components/Headers.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';


function SongRegisterPage(){
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  const closeMenu = () => {
    setMenuOpen(false);
  };
  const handleNavigation = (path) => {
    navigate(path);
  };
  const [dropDownEvent, setDropDownEvent] = useState("행사이름")
  const [eventNameData, setData] = useState(['2025 겨울 정기공연', '2025 한강 버스킹', '2025 호수공원 버스킹', '학교축제'])
  const eventSongs = {
    "2025 겨울 정기공연": [
      { 곡: "사랑하긴 했었나요 스쳐가는 인연이었나요", 가수: "김유빈", 세션: "보컬" },
      { 곡: "겨울 바람", 가수: "상연", 세션: "기타" },
      { 곡: "하얀 설원", 가수: "유빈밴드", 세션: "드럼" },
    ],
    "2025 한강 버스킹": [
      { 곡: "강변의 추억", 가수: "송민지", 세션: "보컬" },
      { 곡: "서울 밤", 가수: "김유빈", 세션: "베이스" },
    ],
    "2025 호수공원 버스킹": [
      { 곡: "호수의 노래", 가수: "찬비", 세션: "피아노" },
    ],
    "학교축제": [
      { 곡: "청춘의 날개", 가수: "유빈밴드", 세션: "보컬" },
      { 곡: "축제의 밤", 가수: "김유빈", 세션: "기타" },
      { 곡: "별빛 아래", 가수: "박서영", 세션: "드럼" },
    ]
  };
  // useEffect(() => {
  //   axios.get('http://localhost:8080/api/')
  //     .then(res => {
  //       setData(res.data);
  //     })
  //     .catch(err => {
  //       console.error('요일 데이터를 불러오지 못했습니다.', err);
  //     });
  // }, []);

  const handleChange = (e) => {
    setDropDownEvent(e.target.value);
  };
    return (
      <div className="phone-frame">
        <div className="App"> 
          <Headers onMenuClick={toggleMenu} username="김유빈" isOpen={menuOpen} onClose={closeMenu}></Headers>
          <div className='songResister-mainContainer'>
            <div className='songResister-mainContainer-eventName'>
              <select value={dropDownEvent} onChange={handleChange}>
                  {eventNameData.map((data, idx) => (
                  <option key={idx} value={data}>
                      {data}
                  </option>
                  ))}
              </select>
            </div>
            <div className='songResister-mainContainer-songs'>
              <div className="song-list-header">
                <span>곡명</span>
                <span>가수</span>
                <span>세션</span>
              </div>

              {eventSongs[dropDownEvent]?.map((item, idx) => (
                <div key={idx} className="song-item">
                  <span>{item.곡}</span>
                  <span>{item.가수}</span>
                  <span>{item.세션}</span>
                </div>
              )) || <div>데이터가 없습니다.</div>}
            </div>
          </div>
          <div className='songResister-btnPlus'>
            <button className="plus-button" onClick={() => handleNavigation('/scops/songAdd')}>+</button>
          </div>
          </div>
      </div>
    );
}
export default SongRegisterPage;