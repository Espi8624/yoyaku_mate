import './AllVisitedPlaces.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function AllVisitedPlaces() {
    const [frequentPlaces, setFrequentPlaces] = useState([]);

    useEffect(() => {
         // Frequent Places データ呼出
        fetch('http://localhost:8080/frequent-store?user_id=1')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch frequent places data');
                }
                return response.json();
            })
            .then((data) => setFrequentPlaces(data))
            .catch((error) => console.error('Error fetching frequent places: ', error));
    }, []);

    return (
        <div className="main-page">
            <div className="main-frequent-places">
                <Link to={`/`} >
                    <button className="view-all-btn">
                        戻る &gt;&gt;
                    </button>
                </Link>
                <div className="title-container">
                    <h1 className="title">よく訪問する場所</h1>
                </div>
                <div className="main-frequent-places-wrap">
                    <ul>
                        {frequentPlaces && frequentPlaces.length > 0 ? (
                            frequentPlaces.map((res, index) => (
                                <li key={index} className="frequent-place-item">
                                    <Link to={`/store/${res.store_id}`} className="place-link">
                                        <span className="rank">{index + 1}.</span>
                                        <div className="place-info">
                                            <span className="store-name">{res.store_name}</span>
                                            <span className="last-visited">最終訪問日: {res.last_visited} / 訪問回数: {res.visit_count}</span>
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
                <Link to={`/`} >
                    <button className="view-all-btn">
                        戻る &gt;&gt;
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default AllVisitedPlaces;