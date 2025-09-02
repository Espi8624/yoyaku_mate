import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import WatingScreenNationality from "./WatingScreenNationality/WatingScreenNationality";
import WatingScreenInput from "./WatingScreenInput/WatingScreenInput";
import WatingScreenPreview from "./WatingScreenPreview/WatingScreenPreview";
import WatingScreen from "./WatingScreen/WatingScreen";

function WatingScreenFlow() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    // URLパラメータから初期値を取得
    const initialStep = 1;
    const initialNationality = searchParams.get("nationality") || "";
    const initialLang = searchParams.get("lang") || "";
    const initialStoreId = searchParams.get("storeid") || "";

    const [step, setStep] = useState(initialStep);
    const [selectedNationality, setSelectedNationality] = useState("");
    const [selectedLanguageCode, setSelectedLanguageCode] = useState("");
    const [customer_name, setCustomerName] = useState("");
    const [party_size, setPartySize] = useState("");
    const [contact, setContact] = useState("");
    const [notes, setNotes] = useState("");
    const [waitingId, setWaitingId] = useState("");
    const [storeId, setStoreId] = useState(initialStoreId);

    const nationalitiesData = require("../../data/nationalities.json");
    function getNationalityFromLanguage(language, nationalities) {
        const lang = language.split('-')[0];
        const match = nationalities.find(n => n.languageCode === lang);
        if (match) return match.name;
        return "";
    }

    useEffect(() => {
        // デバイス言語から国籍・言語コードを自動判定
        const deviceLang = navigator.language || navigator.userLanguage;
        const autoNationality = getNationalityFromLanguage(deviceLang, nationalitiesData.nationalities);
        if (autoNationality) {
            setSelectedNationality(autoNationality);
            const selected = nationalitiesData.nationalities.find(n => n.name === autoNationality);
            setSelectedLanguageCode(selected ? selected.languageCode : "");
        } else {
            setSelectedNationality(initialNationality);
            setSelectedLanguageCode(initialLang);
        }
        setStep(initialStep);
        setStoreId(initialStoreId);
    }, [location.search]);

    // stepごとに表示するコンポーネントを切り替え
    if (step === 1) {
        return (
            <WatingScreenInput
                selectedNationality={selectedNationality}
                selectedLanguageCode={selectedLanguageCode}
                customer_name={customer_name}
                setCustomerName={setCustomerName}
                party_size={party_size}
                setPartySize={setPartySize}
                contact={contact}
                setContact={setContact}
                notes={notes}
                setNotes={setNotes}
                storeId={storeId}
                onNext={() => setStep(2)}
            />
        );
    }
    if (step === 2) {
        return (
            <WatingScreenPreview
                selectedNationality={selectedNationality}
                selectedLanguageCode={selectedLanguageCode}
                customer_name={customer_name}
                party_size={party_size}
                contact={contact}
                notes={notes}
                storeId={storeId}
                onBack={() => setStep(1)}
                onNext={(inputInfo) => {
                    if (inputInfo) {
                        // 入力情報を復元してstep=1へ
                        setCustomerName(inputInfo.customer_name ?? "");
                        setPartySize(inputInfo.party_size ?? "");
                        setContact(inputInfo.contact ?? "");
                        setNotes(inputInfo.notes ?? "");
                        setSelectedNationality(inputInfo.selectedNationality ?? "");
                        setSelectedLanguageCode(inputInfo.selectedLanguageCode ?? "");
                        setStep(1);
                    } else {
                        setStep(3);
                    }
                }}
                setWaitingId={setWaitingId} // 追加
            />
        );
    }
    if (step === 3) {
        return (
            <WatingScreen
                selectedNationality={selectedNationality}
                selectedLanguageCode={selectedLanguageCode}
                customer_name={customer_name}
                party_size={party_size}
                notes={notes}
                waitingId={waitingId} // 追加
                storeId={storeId}
                onBack={(info) => {
                    if (info && info.step === 1) {
                        setStep(1);
                    } else {
                        setStep(2);
                    }
                }}
            />
        );
    }
    return null;
}

export default WatingScreenFlow;
