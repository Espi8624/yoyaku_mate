import React, { useState } from "react";
import WatingScreenNationality from "./WatingScreenNationality/WatingScreenNationality";
import WatingScreenInput from "./WatingScreenInput/WatingScreenInput";
import WatingScreenPreview from "./WatingScreenPreview/WatingScreenPreview";
import WatingScreen from "./WatingScreen/WatingScreen";

function WatingScreenFlow() {
    const [step, setStep] = useState(1);
    // すべてのパラメータを親で管理
    const [selectedNationality, setSelectedNationality] = useState("");
    const [selectedLanguageCode, setSelectedLanguageCode] = useState("");
    const [customer_name, setCustomerName] = useState("");
    const [party_size, setPartySize] = useState("");
    const [contact, setContact] = useState("");
    const [notes, setNotes] = useState("");
    const [waitingId, setWaitingId] = useState(""); // 追加

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
                onNext={() => setStep(4)}
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
                onBack={() => setStep(3)}
            />
        );
    }
    return null;
}

export default WatingScreenFlow;
