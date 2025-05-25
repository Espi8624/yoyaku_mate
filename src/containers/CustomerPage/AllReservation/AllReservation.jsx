import './AllReservation.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function AllReservation() {
    const [frequentPlaces, setFrequentPlaces] = useState([]);
    const [timeLineData, setTimeLineData] = useState([]);

    useEffect(() => {
        // TimeLine データ呼出
        fetch('http://localhost:8080/timeline?user_id=1')
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
                <Link to={`/`} >
                    <button className="view-all-btn">
                        戻る &gt;&gt;
                    </button>
                </Link>
                <div className="title-container">
                    <h1 className="title">タイムライン</h1>

                </div>
                <div className="main-time-line-wrap">
                    <ul>
                        {timeLineData.length > 0 ? (
                            [...timeLineData]
                                .sort((a, b) => {
                                    const dateTimeA = new Date(`${a.reserved_date}T${a.reserved_time}`);
                                    const dateTimeB = new Date(`${b.reserved_date}T${b.reserved_time}`);
                                    return dateTimeB - dateTimeA;
                                })
                                .map((res, index) => (
                                    <li key={index} className="timeline-item">
                                        <Link to={`/past-reservation/${res.reservation_id}`} className="place-link">
                                            <div className="timeline-content">
                                                <div className="place-name">{res.store_name}</div>
                                                <div className="time-stamp">
                                                    {res.reserved_date} {res.reserved_time}
                                                </div>
                                                {/* 今後、<icon> に変更する予定　*/}
                                                <span className="move-icon">&gt;</span>
                                            </div>
                                        </Link>
                                    </li>
                                ))
                        ) : (
                            <li>Loading...</li>
                        )}
                    </ul>
                </div>
                <Link to={`/`} >
                    <button className="view-all-btn">
                        戻る &gt;&gt;
                    </button>
                </Link>
                <div className="title-container"></div>
            </div>
        </div>
    );
}

export default AllReservation;