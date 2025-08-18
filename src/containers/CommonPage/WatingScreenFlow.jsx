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
    const initialStep = Number(searchParams.get("step")) || 1;
    const initialNationality = searchParams.get("nationality") || "";
    const initialLang = searchParams.get("lang") || "";

    const [step, setStep] = useState(initialStep);
    const [selectedNationality, setSelectedNationality] = useState(initialNationality);
    const [selectedLanguageCode, setSelectedLanguageCode] = useState(initialLang);
    const [customer_name, setCustomerName] = useState("");
    const [party_size, setPartySize] = useState("");
    const [contact, setContact] = useState("");
    const [notes, setNotes] = useState("");
    const [waitingId, setWaitingId] = useState("");

    useEffect(() => {
        // URLパラメータ変更時に初期値を再セット
        setStep(initialStep);
        setSelectedNationality(initialNationality);
        setSelectedLanguageCode(initialLang);
    }, [location.search]);

    // stepごとに表示するコンポーネントを切り替え
    if (step === 1) {
        return (
            <WatingScreenNationality
                selectedNationality={selectedNationality}
                setSelectedNationality={setSelectedNationality}
                selectedLanguageCode={selectedLanguageCode}
                setSelectedLanguageCode={setSelectedLanguageCode}
                onNext={() => setStep(2)}
            />
        );
    }
    if (step === 2) {
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
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
            />
        );
    }
    if (step === 3) {
        return (
            <WatingScreenPreview
                selectedNationality={selectedNationality}
                selectedLanguageCode={selectedLanguageCode}
                customer_name={customer_name}
                party_size={party_size}
                contact={contact}
                notes={notes}
                onBack={() => setStep(2)}
                onNext={(inputInfo) => {
                    if (inputInfo) {
                        // 入力情報を復元してstep=2へ
                        setCustomerName(inputInfo.customer_name ?? "");
                        setPartySize(inputInfo.party_size ?? "");
                        setContact(inputInfo.contact ?? "");
                        setNotes(inputInfo.notes ?? "");
                        setSelectedNationality(inputInfo.selectedNationality ?? "");
                        setSelectedLanguageCode(inputInfo.selectedLanguageCode ?? "");
                        setStep(2);
                    } else {
                        setStep(4);
                    }
                }}
                setWaitingId={setWaitingId} // 追加
            />
        );
    }
    if (step === 4) {
        return (
            <WatingScreen
                selectedNationality={selectedNationality}
                selectedLanguageCode={selectedLanguageCode}
                customer_name={customer_name}
                party_size={party_size}
                notes={notes}
                waitingId={waitingId} // 追加
                onBack={(info) => {
                    if (info && info.step === 1) {
                        setStep(1);
                    } else {
                        setStep(3);
                    }
                }}
            />
        );
    }
    return null;
}

export default WatingScreenFlow;
