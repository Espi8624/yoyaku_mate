import './MainPage.css';

const frequentPlaces = [
    "Central park",
    "Times Square",
    "Empire State Building",
    "Statue of Liberty",
    "Brooklyn Bridge",
];

function MainPage() {
    return (
        <div className="main-page">
            <div className='main-calendar'></div>

            <div className='main-frequent-places'>
                <div className='main-frequent-places-wrap'>
                    <h1 className='title'>Frequent Places</h1>
                    <ul>
                        {frequentPlaces.map((place, index) => (
                            <li key={index}>
                                {place}
                                <icon className="move-icon"> &gt;</icon>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className='main-time-line'></div>
        </div>
    );
}

export default MainPage;