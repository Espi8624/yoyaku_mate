import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import nationalitiesData from '../../data/nationalities.json';
import useTranslation from '../../hook/useTranslation';
import { getWaitingStatus, submitWaiting as apiSubmitWaiting } from '../../api/waitingService';

// Context Object生成
const WaitingScreenContext = createContext(null);

export function useWaitingScreen() {
  const context = useContext(WaitingScreenContext);
  if (!context) {
    throw new Error('useWaitingScreen must be used within a WaitingScreenProvider');
  }
  return context;
}

export function WaitingScreenProvider({ children }) {
  const location = useLocation();

  // --- Helper Functions ---
  const getNationalityFromLanguage = (language) => {
    const langCode = language.split('-')[0]; // 'ko-KR' -> 'ko'
    const match = nationalitiesData.nationalities.find(n => n.languageCode === langCode);
    // 一致する言語がない場合基本値返却
    return match || nationalitiesData.nationalities.find(n => n.languageCode === 'ja');
  };

  const generateWaitingId = () => {
    const now = new Date();
    return (
        now.getFullYear().toString() +
        ("0" + (now.getMonth() + 1)).slice(-2) +
        ("0" + now.getDate()).slice(-2) + "-" +
        ("0" + now.getHours()).slice(-2) +
        ("0" + now.getMinutes()).slice(-2) +
        ("0" + now.getSeconds()).slice(-2) +
        '-' + Math.random().toString(36).substring(2, 8)
    );
  };

  // URLパラメータパース
  const initialParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const lang = searchParams.get("lang") || navigator.language || navigator.userLanguage;
    const initialNationality = getNationalityFromLanguage(lang);

    return {
      storeId: searchParams.get("storeid") || "",
      nationality: initialNationality.name,
      languageCode: initialNationality.languageCode,
    };
  }, [location.search]);

  // ステータス管理
  const [step, setStep] = useState(1);
  const [storeId, setStoreId] = useState(initialParams.storeId);
  const [selectedNationality, setSelectedNationality] = useState(initialParams.nationality);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(initialParams.languageCode);
  const [partySize, setPartySize] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [waitingId, setWaitingId] = useState("");

  // ポップアップステータス管理
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [popupInfo, setPopupInfo] = useState({ message: "", mode: "congestion" });
  const [pendingPayload, setPendingPayload] = useState(null);
  
  // 多国語Hook
  const t = useTranslation(selectedLanguageCode);


  // URLパラメータが変更される時、ステータスを更新
  useEffect(() => {
    setStoreId(initialParams.storeId);
    setSelectedNationality(initialParams.nationality);
    setSelectedLanguageCode(initialParams.languageCode);
    setStep(1);
    // 入力フィルド初期化
    setPartySize("");
    setContact("");
    setNotes("");
    setWaitingId("");
  }, [initialParams]);

  // ページ転換ロジック
  const goToNextStep = () => setStep(prev => prev + 1);
  const goToPrevStep = () => setStep(prev => prev - 1);
  const goBackToInputStep = (inputInfo) => {
    if (inputInfo) {
      setPartySize(inputInfo.partySize ?? "");
      setContact(inputInfo.contact ?? "");
      setNotes(inputInfo.notes ?? "");
      setSelectedNationality(inputInfo.selectedNationality ?? "");
      setSelectedLanguageCode(inputInfo.selectedLanguageCode ?? "");
    }
    setStep(1);
  };

  // サーバー通信関係
  const _performSubmit = async (payload) => {
    try {
      const res = await apiSubmitWaiting(payload);
      if (res.ok) {
        alert("登録が完了しました");
        goToNextStep(); // step 3へ移動
      } else {
        const err = await res.text();
        alert("登録に失敗しました: " + err);
      }
    } catch (err) {
      alert("通信エラー: " + err);
    }
  };

  const handleSubmitWaiting = async () => {
    const { waitingPartySum, estimatedWaitingCount, maxWaitingCount } = await getWaitingStatus(storeId);
    const currentWaitingCount = waitingPartySum + Number(partySize);
    
    const newWaitingId = generateWaitingId();
    setWaitingId(newWaitingId);
    localStorage.setItem("waiting_id", newWaitingId);

    const payload = {
      store_id: storeId,
      waiting_id: newWaitingId,
      party_size: Number(partySize),
      nationality: selectedNationality,
      contact: contact.trim() === "" ? "なし" : contact,
      notes: notes.trim() === "" ? "なし" : notes,
      status: "waiting"
    };

    if (maxWaitingCount !== null && Number(partySize) > maxWaitingCount) {
      setPopupInfo({ message: "大変申し訳ございません。\n当店の最大収容人数を超えているため、予約できません。", mode: "max" });
      setPopupVisible(true);
      return;
    }
    
    if (estimatedWaitingCount !== null && currentWaitingCount >= estimatedWaitingCount) {
      setPendingPayload(payload);
      setPopupInfo({ message: "現在大変混雑しており、ご案内までにお時間をいただく可能性がございます。\n予めご了承お願いします。", mode: "congestion" });
      setPopupVisible(true);
      return;
    }

    await _performSubmit(payload);
  };

  const closePopupAndProceed = async () => {
    setPopupVisible(false);
    if (popupInfo.mode === "congestion" && pendingPayload) {
      await _performSubmit(pendingPayload);
    } else if (popupInfo.mode === "max") {
      setStep(1); 
    }
    setPendingPayload(null);
  };
  
  const closePopupOnly = () => {
      setPopupVisible(false);
      setPendingPayload(null);
  };

  
  // Providerかchildに伝達する値
  const value = {
    // ステータス値
    step,
    storeId,
    selectedNationality,
    selectedLanguageCode,
    partySize,
    contact,
    notes,
    waitingId,
    isPopupVisible,
    popupInfo,
    t, // 多国語データ
    
    // ステータス変更関数
    setSelectedNationality,
    setSelectedLanguageCode,
    setPartySize,
    setContact,
    setNotes,

    // Action/Page転換関数
    goToNextStep,
    goToPrevStep,
    handleSubmitWaiting,
    closePopupAndProceed,
    closePopupOnly,
  };

  return (
    <WaitingScreenContext.Provider value={value}>
      {children}
    </WaitingScreenContext.Provider>
  );
}