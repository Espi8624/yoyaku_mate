import MainCalendar from './MainCalendar';
import './MainPage.css';

const frequentPlaces = [
    "Central park",
    "Times Square",
    "Empire State Building",
    "Statue of Liberty",
    "Brooklyn Bridge",
];

const timeLineData = [
    {
        placeName: "Central park",
        timestamp: "2025-03-20",
    },
    {
        placeName: "Times Square",
        timestamp: "2025-03-21",
    },
    {
        placeName: "Central park",
        timestamp: "2025-03-22",
    },
    {
        placeName: "Empire State Building",
        timestamp: "2025-03-23",
    },
    {
        placeName: "Empire State Building",
        timestamp: "2025-03-24",
    },
];

function MainPage() {
    return (
        <div className="main-page">
            <div className="main-time-line">
                <div className="title-container">
                    <h1 className="title">タイムライン</h1>
                    <button className="view-all-btn">view all &gt;&gt;</button>
                </div>
                <div className="main-time-line-wrap">
                    <ul>
                        {[...timeLineData]
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .map((timeLineData, index) => (
                                <li key={index} className="timeline-item">
                                    <div className="timeline-content">
                                        <div className="place-name">{timeLineData.placeName}</div>
                                        <div className="timestamp">
                                            {new Date(timeLineData.timestamp).toLocaleDateString('ja-JP')}
                                        </div>
                                        <span className="move-icon">&gt;</span> {/* <icon> 대신 <span> 사용 */}
                                    </div>
                                </li>
                            ))}
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
                        {frequentPlaces.map((place, index) => (
                            <li key={index}>
                                {place}
                                <span className="move-icon">&gt;</span>
                            </li>
                        ))}
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