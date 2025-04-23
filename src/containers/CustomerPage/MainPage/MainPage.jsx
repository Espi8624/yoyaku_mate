import { useEffect, useState } from 'react';
import MainCalendar from './MainCalendar';
import './MainPage.css';
import { Link } from 'react-router-dom';

function MainPage() {
    const [frequentPlaces, setFrequentPlaces] = useState([]);
    const [timeLineData, setTimeLineData] = useState([]);

    useEffect(() => {
        // Frequent Places データ呼出
        fetch('http://localhost:8080/frequent-places')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch frequent places data');
                }
                return response.json();
            })
            .then((data) => setFrequentPlaces(data))
            .catch((error) => console.error('Error fetching frequent places: ', error));

        // TimeLine データ呼出
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
                    <button className="view-all-btn">すべて &gt;&gt;</button>
                </div>
                <div className="main-time-line-wrap">
                    <ul>
                        {timeLineData.length > 0 ? (
                            [...timeLineData]
                                .sort((a, b) => new Date(b.time_stamp) - new Date(a.time_stamp))
                                .map((res, index) => (
                                    <li key={index} className="timeline-item">
                                        <Link to={`/past-reservation/${res.reservation_id}`} className="place-link">
                                            <div className="timeline-content">
                                                <div className="place-name">{res.store_name}</div>
                                                <div className="time-stamp">
                                                    {new Date(res.time_stamp).toLocaleString('ja-JP', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                                {/* 今後、<icon> に変更する予定　*/}
                                                <span className="move-icon">&gt;</span>
                                            </div>
                                        </Link>

                                        {/* <Link to={`/store/${res.store_id}`} className="place-link">
                                        <span className="rank">{index + 1}.</span>
                                        <div className="place-info">
                                            <span className="store-name">{res.store_name}</span>
                                            <span className="last-visited">最終訪問日: {res.last_visited}</span>
                                        </div>
                                        <span className="move-icon">&gt;</span>
                                    </Link> */}
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
                    <h1 className="title">よく訪問する場所</h1>
                    <button className="view-all-btn">すべて &gt;&gt;</button>
                </div>
                <div className="main-frequent-places-wrap">
                    <ul>
                        {frequentPlaces.length > 0 ? (
                            frequentPlaces.map((res, index) => (
                                <li key={index} className="frequent-place-item">
                                    <Link to={`/store/${res.store_id}`} className="place-link">
                                        <span className="rank">{index + 1}.</span>
                                        <div className="place-info">
                                            <span className="store-name">{res.store_name}</span>
                                            <span className="last-visited">最終訪問日: {res.last_visited}</span>
                                        </div>
                                        <span className="move-icon">&gt;</span>
                                    </Link>
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