import React from "react";
import "./WatingScreenNationality.css";
const nationalitiesData = require('../../../data/nationalities.json');

function WatingScreenNationality({
    selectedNationality,
    setSelectedNationality,
    selectedLanguageCode,
    setSelectedLanguageCode,
    onNext
}) {
    const [searchText, setSearchText] = React.useState("");

    // 検索フィルタ適用
    const filteredNationalities = nationalitiesData.nationalities.filter(n =>
        n.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="waiting-section">
            <div className="preview-label">いらっしゃいませ！</div>
            <form className="preview-form">
                <div className="nationality-title">
                    国籍を選択<br />
                    <span className="nationality-title-en">select your nationality</span>
                </div>
                <input
                    type="text"
                    className="nationality-search"
                    placeholder="国籍を検索..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
                <select
                    value={selectedNationality}
                    onChange={e => {
                        setSelectedNationality(e.target.value);
                        const selected = nationalitiesData.nationalities.find(n => n.name === e.target.value);
                        setSelectedLanguageCode(selected ? selected.languageCode : "");
                    }}
                    size={8}
                    className="nationality-select"
                >
                    {filteredNationalities.map((n, idx) => (
                        <option key={idx} value={n.name}>{n.name}</option>
                    ))}
                </select>
            </form>
            <button
                className="confirmation-btn"
                onClick={e => {
                    e.preventDefault();
                    if (selectedNationality && selectedLanguageCode) {
                        onNext();
                    } else {
                        alert('国籍を選択してください');
                    }
                }}
            >
                次へ -next-
            </button>
        </div>
    );
}

export default WatingScreenNationality;