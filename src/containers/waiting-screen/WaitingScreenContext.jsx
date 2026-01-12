import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import nationalitiesData from '../../data/nationalities.json';
import useTranslation from '../../hook/useTranslation';
import { getWaitingStatus, submitWaiting as apiSubmitWaiting, cancelWaiting } from '../../api/waitingService';
import './NetworkErrorPopup.css';  // CSSファイル名を変更

// NetworkErrorPopupをインラインコンポーネントとして定義
const NetworkErrorPopup = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div className="network-error-popup">
      <span className="network-error-message">
        インターネット接続が不安定です
      </span>
    </div>
  );
};

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
      storeId: searchParams.get("store_id") || "",
      vToken: searchParams.get("v_token") || "",
      nationality: initialNationality.name,
      languageCode: initialNationality.languageCode,
    };
  }, [location.search]);

  useEffect(() => {
    console.log('[Context] Initial Params:', initialParams);
    console.log('[Context] v_token:', initialParams.vToken);
  }, [initialParams]);

  // ★★ ここでローカルストレージからstep初期値を判定 ★★
  const initialStep = (() => {
    const storedStoreId = localStorage.getItem("store_id");
    const storedWaitingId = localStorage.getItem("waiting_id");
    if (storedStoreId && storedWaitingId) return 3;
    return 1;
  })();

  // ステータス管理
  const [step, setStep] = useState(initialStep);
  const [storeId, setStoreId] = useState(initialParams.storeId);
  const [selectedNationality, setSelectedNationality] = useState(initialParams.nationality);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(initialParams.languageCode);
  const [partySize, setPartySize] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [waitingId, setWaitingId] = useState(localStorage.getItem("waiting_id") || "");
  const [vToken, setVToken] = useState(initialParams.vToken || localStorage.getItem("v_token") || "");
  const [isCancelled, setIsCancelled] = useState(false);

  // ポップアップステータス管理
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [popupInfo, setPopupInfo] = useState({ message: "", mode: "congestion" });
  const [pendingPayload, setPendingPayload] = useState(null);

  // オフライン状態の管理を追加
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 多国語Hook
  const t = useTranslation(selectedLanguageCode);

  // URLパラメータが変更される時、ステータスを更新
  useEffect(() => {
    setStoreId(initialParams.storeId);
    if (initialParams.vToken) {
      setVToken(initialParams.vToken);
      localStorage.setItem("v_token", initialParams.vToken);
    }
    setSelectedNationality(initialParams.nationality);
    setSelectedLanguageCode(initialParams.languageCode);
    // stepはローカルストレージ優先で初期化されているのでここでは変更しない
    setPartySize("");
    setContact("");
    setNotes("");
    setWaitingId(localStorage.getItem("waiting_id") || "");
  }, [initialParams]);

  // サーバー通信関係
  const _performSubmit = async (payload) => {
    try {
      const res = await apiSubmitWaiting(payload, vToken);
      // axiosは成功時に200-299のstatusを返す
      if (res.status >= 200 && res.status < 300) {
        alert("登録が完了しました");
        setStep(3); // step 3へ移動
      } else {
        // 登録失敗時にローカルストレージから削除
        localStorage.removeItem("waiting_id");
        localStorage.removeItem("store_id");
        localStorage.removeItem("v_token");
        const errorMessage = res.data?.message || '登録に失敗しました';
        alert("登録に失敗しました: " + errorMessage);
      }
    } catch (err) {
      // エラー発生時もローカルストレージから削除
      localStorage.removeItem("waiting_id");
      localStorage.removeItem("store_id");
      localStorage.removeItem("v_token");
      console.error("登録エラー:", err);
      const errorMessage = err.response?.data?.message || err.message || '通信エラーが発生しました';
      alert("通信エラー: " + errorMessage);
    }
  };

  const handleSubmitWaiting = async () => {
    const { waitingPartySum, estimatedWaitingCount, maxWaitingCount } = await getWaitingStatus(storeId);
    const currentWaitingCount = waitingPartySum + Number(partySize);

    const newWaitingId = generateWaitingId();
    setWaitingId(newWaitingId);
    // waiting_id, store_idをローカルストレージに保存
    localStorage.setItem("waiting_id", newWaitingId);
    if (storeId) localStorage.setItem("store_id", storeId);

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

    // waitingId, storeIdをローカルストレージに保存
    if (waitingId) localStorage.setItem("waiting_id", waitingId);
    if (storeId) localStorage.setItem("store_id", storeId);

    await _performSubmit(payload);
  };

  const handleCancel = async () => {
    try {
      const res = await cancelWaiting(storeId, waitingId);
      // axiosは成功時に例外をスローしないので、status codeで判定
      if (res.status >= 200 && res.status < 300) {
        // 成功時、isCancelled状態をtrueに変更
        setIsCancelled(true);
        // ローカルストレージからwaiting_idとstore_idを削除
        localStorage.removeItem("waiting_id");
        localStorage.removeItem("store_id");
        localStorage.removeItem("v_token");
        // 初期状態に戻す
        setStep(1);
        setPartySize('');
        setSelectedNationality('その他');
        setContact('');
        setNotes('');
        setWaitingId(null);
        setPopupInfo({ message: '', mode: '' });
      } else {
        throw new Error(res.data?.message || 'サーバーエラーが発生しました。');
      }
    } catch (err) {
      console.error("キャンセルエラー:", err);
      const errorMessage = err.response?.data?.message || err.message || 'キャンセルに失敗しました。';
      alert("キャンセルエラー: " + errorMessage);
    }
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

  // 通信状態の監視
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Providerかchildに伝達する値
  const value = {
    // ステータス値
    step,
    isCancelled,
    handleCancel,
    storeId,
    setStoreId,
    selectedNationality,
    selectedLanguageCode,
    partySize,
    contact,
    notes,
    waitingId,
    setWaitingId,
    isPopupVisible,
    popupInfo,
    t, // 多国語データ
    isOffline, // コンテキストに追加

    // ステータス変更関数
    setSelectedNationality,
    setSelectedLanguageCode,
    setPartySize,
    setContact,
    setNotes,
    setStep,

    // Action/Page転換関数
    goToNextStep: () => setStep(prev => prev + 1),
    goToPrevStep: () => setStep(prev => prev - 1),
    handleSubmitWaiting,
    closePopupAndProceed,
    closePopupOnly,
    goBackToInputStep: (inputInfo) => {
      if (inputInfo) {
        setPartySize(inputInfo.partySize ?? "");
        setContact(inputInfo.contact ?? "");
        setNotes(inputInfo.notes ?? "");
        setSelectedNationality(inputInfo.selectedNationality ?? "");
        setSelectedLanguageCode(inputInfo.selectedLanguageCode ?? "");
      }
      setStep(1);
    },
  };

  return (
    <WaitingScreenContext.Provider value={value}>
      <NetworkErrorPopup isOffline={isOffline} />
      {children}
    </WaitingScreenContext.Provider>
  );
}