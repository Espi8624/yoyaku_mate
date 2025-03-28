import { useEffect, useState } from 'react';
import MainCalendar from './MainCalendar';
import './MainPage.css';

function MainPage() {
    const [frequentPlaces, setFrequentPlaces] = useState([]);
    const [timeLineData, setTimeLineData] = useState([]);

    useEffect(() => {
        // Frequent Places 데이터 호출
        fetch('http://localhost:8080/frequent-places')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch frequent places data');
                }
                return response.json();
            })
            .then((data) => setFrequentPlaces(data))
            .catch((error) => console.error('Error fetching frequent places: ', error));

        // TimeLine 데이터 호출
        fetch('http://localhost:8080/timeline')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch timeline data');
                }
                return response.json();
            })
            .then((data) => setTimeLineData(data))
            .catch((error) => console.error('Error fetching timeline: ', error));
    }, []);

    return (
        <div className="main-page">
            <div className="main-time-line">
                <div className="title-container">
                    <h1 className="title">タイムライン</h1>
                    <button className="view-all-btn">view all &gt;&gt;</button>
                </div>
                <div className="main-time-line-wrap">
                    <ul>
                        {timeLineData.length > 0 ? (
                            [...timeLineData]
                                .sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))
                                .map((timeLineData, index) => (
                                    <li key={index} className="timeline-item">
                                        <div className="timeline-content">
                                            <div className="place-name">{timeLineData.placeName}</div>
                                            <div className="timestamp">
                                                {new Date(timeLineData.timeStamp).toLocaleString('ja-JP', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                            {/* 추후 <icon>으로 변경 */}
                                            <span className="move-icon">&gt;</span>
                                        </div>
                                    </li>
                                ))
                        ) : (
                            <li>Loading...</li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="main-frequent-places">
                <div className="title-container">
                    <h1 className="title">前回訪問した場所</h1>
                    <button className="view-all-btn">view all &gt;&gt;</button>
                </div>
                <div className="main-frequent-places-wrap">
                    <ul>
                        {frequentPlaces.length > 0 ? (
                            frequentPlaces.map((place, index) => (
                                <li key={index}>
                                    {place}
                                    <span className="move-icon">&gt;</span>
                                </li>
                            ))
                        ) : (
                            <li>Loading...</li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="main-calendar">
                <div className="main-calendar-wrap">
                    <MainCalendar />
                </div>
            </div>
        </div>
    );
}

export default MainPage;