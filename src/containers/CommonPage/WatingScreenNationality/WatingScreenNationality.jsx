import React, { useEffect } from "react";
import "./WatingScreenNationality.css";
const nationalitiesData = require('../../../data/nationalities.json');

function getNationalityFromLanguage(language, nationalities) {
    const lang = language.split('-')[0];
    const match = nationalities.find(n => n.languageCode === lang);
    if (match) return match.name;
    return "";
}

function WatingScreenNationality({
    selectedNationality,
    setSelectedNationality,
    selectedLanguageCode,
    setSelectedLanguageCode,
    storeId,
    onNext
}) {
    const [inputValue, setInputValue] = React.useState("");
    const [showDropdown, setShowDropdown] = React.useState(false);
    // デバイス言語から国籍候補を自動選択
    useEffect(() => {
        const deviceLang = navigator.language || navigator.userLanguage;
        const autoNationality = getNationalityFromLanguage(deviceLang, nationalitiesData.nationalities);
        if (autoNationality && !selectedNationality) {
            setSelectedNationality(autoNationality);
            const selected = nationalitiesData.nationalities.find(n => n.name === autoNationality);
            setSelectedLanguageCode(selected ? selected.languageCode : "");
            setInputValue(autoNationality);
            console.log('[国籍自動選択]', {
                deviceLang,
                autoNationality,
                languageCode: selected ? selected.languageCode : "",
            });
            // デバイス言語から国籍が自動選択された場合、STEP2へ自動遷移
            if (selected && selected.languageCode) {
                onNext();
            }
        }
    }, []);

    // 入力値でフィルタ
    const filteredNationalities = nationalitiesData.nationalities.filter(n =>
        n.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    // 選択時の処理
    const handleSelect = (name) => {
        setInputValue(name);
        setSelectedNationality(name);
        const selected = nationalitiesData.nationalities.find(n => n.name === name);
        setSelectedLanguageCode(selected ? selected.languageCode : "");
        setShowDropdown(false);
    };

    return (
        <div className="waiting-section">
            <div className="preview-label">いらっしゃいませ！</div>
            <form className="preview-form" autoComplete="off">
                <div className="nationality-title">
                    国籍を選択<br />
                    <span className="nationality-title-en">select your nationality</span>
                </div>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        className="nationality-search"
                        placeholder="国籍を検索..."
                        value={inputValue}
                        onChange={e => {
                            setInputValue(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    />
                    {showDropdown && filteredNationalities.length > 0 && (
                        <ul className="nationality-dropdown">
                            {filteredNationalities.map((n, idx) => (
                                <li
                                    key={idx}
                                    className="nationality-dropdown-item"
                                    onMouseDown={() => handleSelect(n.name)}
                                >
                                    {n.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
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