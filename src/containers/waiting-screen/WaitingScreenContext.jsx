import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import nationalitiesData from '../../data/nationalities.json';
import useTranslation from '../../hook/useTranslation';
import { getWaitingStatus, submitWaiting as apiSubmitWaiting, cancelWaiting, getQRToken, getWaitingDetails } from '../../api/waitingService';
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
    // 1. Try to determine by Region Code first (more accurate)
    const parts = language.split('-');
    if (parts.length > 1) {
      const regionCode = parts[1].toUpperCase();
      try {
        // Get country name in English (to match nationalities.json)
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const countryName = regionNames.of(regionCode);

        if (countryName) {
          // Find exact match first
          let match = nationalitiesData.nationalities.find(n => n.name.toLowerCase() === countryName.toLowerCase());

          // Handle known discrepancies if exact match fails
          if (!match) {
            // e.g. "Republic of Korea" -> "South Korea"
            if (countryName === "South Korea" || countryName.includes("Korea")) {
              match = nationalitiesData.nationalities.find(n => n.name === "South Korea");
            } else if (countryName === "United States" || countryName.includes("United States")) {
              match = nationalitiesData.nationalities.find(n => n.name === "United States");
            } else if (countryName === "United Kingdom" || countryName.includes("United Kingdom")) {
              match = nationalitiesData.nationalities.find(n => n.name === "United Kingdom");
            }
          }

          if (match) return match;
        }
      } catch (e) {
        console.warn("Intl.DisplayNames not supported or invalid code", e);
      }
    }

    // 2. Fallback to existing Language Code logic
    const langCode = parts[0]; // 'ko-KR' -> 'ko'
    const match = nationalitiesData.nationalities.find(n => n.languageCode === langCode);
    // 一致する言語がない場合基本値返却
    return match || nationalitiesData.nationalities.find(n => n.languageCode === 'ja');
  };



  // URLパラメータパース
  const initialParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const lang = searchParams.get("lang") || navigator.language || navigator.userLanguage;
    const initialNationality = getNationalityFromLanguage(lang);

    // [DEV] 開発環境用の自動注入ロジック
    // URLにstore_idがない場合、デフォルトのテスト用IDを注入する
    let storeId = searchParams.get("store_id");
    let vToken = searchParams.get("v_token");

    if (process.env.NODE_ENV === 'development' && !storeId) {
      console.warn('⚠️ Development Mode: Injecting default store credentials for local testing.');
      storeId = "68fb806164b55ff6c06a917f"; // ユーザー指定の実店舗ID
      // vTokenはここでは注入せず、後続のuseEffectで動的に取得する
    }

    return {
      storeId: storeId || "",
      vToken: vToken || "",
      waitingId: searchParams.get("waiting_id") || "", // Add waiting_id parsing
      nationality: initialNationality.name,
      languageCode: initialNationality.languageCode,
    };
  }, [location.search]);

  useEffect(() => {
    console.log('[Context] Initial Params:', initialParams);
    console.log('[Context] v_token:', initialParams.vToken);
  }, [initialParams]);

  // [DEV] Development mode: Fetch valid v_token if missing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && initialParams.storeId && !initialParams.vToken) {
      console.log('[Dev] Valid v_token missing. Fetching from server...');
      getQRToken(initialParams.storeId)
        .then(data => {
          if (data && data.v_token) {
            console.log('[Dev] Dynamic v_token fetched:', data.v_token);
            setVToken(data.v_token);
          }
        })
        .catch(err => {
          console.error('[Dev] Failed to fetch dynamic v_token:', err);
        });
    }
  }, [initialParams.storeId, initialParams.vToken]);

  // ★★ ここでローカルストレージからstep初期値を判定 ★★
  const initialStep = (() => {
    const storedStoreId = localStorage.getItem("store_id") || initialParams.storeId;
    const storedWaitingId = localStorage.getItem("waiting_id") || initialParams.waitingId;
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
  const [waitingId, setWaitingId] = useState(initialParams.waitingId || localStorage.getItem("waiting_id") || "");
  const [vToken, setVToken] = useState(initialParams.vToken || "");
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancellationReason, setCancellationReason] = useState(null); // 'user', 'store', 'absence'

  // ポップアップステータス管理
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [popupInfo, setPopupInfo] = useState({ message: "", mode: "congestion" });
  const [pendingPayload, setPendingPayload] = useState(null);

  // オフライン状態の管理を追加
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // チャットボット状態
  const [isChatOpen, setIsChatOpen] = useState(false);
  const toggleChat = () => setIsChatOpen(prev => !prev);

  // Map state
  const [isMapOpen, setIsMapOpen] = useState(false);

  // 現在のページ判定 (step 1,2: registration, step 3: status)
  const currentPage = step < 3 ? 'registration' : 'status';

  // メニュー選択機能の状態
  const [enableMenuSelection, setEnableMenuSelection] = useState(false);
  const [requireOneMenuPerPerson, setRequireOneMenuPerPerson] = useState(false);
  const [selectedMenus, setSelectedMenus] = useState([]); // Array of { menuId, name, quantity, price }

  // 店舗設定（メニュー選択機能有効化など）を取得
  useEffect(() => {
    if (storeId) {
      getWaitingStatus(storeId).then(status => {
        setEnableMenuSelection(status.enableMenuSelection);
        setRequireOneMenuPerPerson(status.requireOneMenuPerPerson);
      }).catch(err => {
        console.error("店舗設定取得エラー:", err);
      });
    }
  }, [storeId]);

  // 多国語Hook
  const t = useTranslation(selectedLanguageCode);

  // URLパラメータが変更される時、ステータスを更新
  useEffect(() => {
    setStoreId(initialParams.storeId);
    if (initialParams.vToken) {
      setVToken(initialParams.vToken);
    }
    if (initialParams.waitingId) {
      setWaitingId(initialParams.waitingId);
      localStorage.setItem("waiting_id", initialParams.waitingId);
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

        // サーバーから返却されたwaiting_idを取得して保存
        const serverWaitingId = res.data?.data?.waiting_id;
        if (serverWaitingId) {
          setWaitingId(serverWaitingId);
          localStorage.setItem("waiting_id", serverWaitingId);
          if (storeId) localStorage.setItem("store_id", storeId);
        }

        setPopupInfo({ message: selectedLanguageCode === 'ja' ? '登録が完了しました' : 'Registration complete!', mode: 'registration_complete' });
        setPopupVisible(true);
      } else {
        // 登録失敗時にローカルストレージから削除
        localStorage.removeItem("waiting_id");
        localStorage.removeItem("store_id");
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
    try {
      const { waitingPartySum, estimatedWaitingCount, maxWaitingCount } = await getWaitingStatus(storeId);
      const currentWaitingCount = waitingPartySum + Number(partySize);

      // Payloadからwaiting_idを除外
      const payload = {
        store_id: storeId,
        party_size: Number(partySize),
        nationality: selectedNationality,
        contact: contact.trim() === "" ? "-" : contact,
        notes: notes.trim() === "" ? "-" : notes,
        status: "waiting",
        menu_items: selectedMenus.map(m => ({
          menu_id: m.menuId,
          name: m.name,
          quantity: m.quantity
        }))
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

      // 初回登録時はまだwaitingIdがないため、localStorageへの保存は _performSubmit 内で行う

      await _performSubmit(payload);
    } catch (error) {
      console.error("待機状況確認エラー:", error);
      alert("通信エラーが発生しました。もう一度お試しください。");
    }
  };

  const handleCancel = async () => {
    try {
      // 1. キャンセル前に最新ステータスを確認
      // catchブロックでエラーハンドリングするため、ここで try-catch は不要(外側のcatchに任せる)
      // ただし、getWaitingDetailsは404でthrowするので注意
      let details;
      try {
        // getWaitingDetailsは内部でAPIを呼ぶ
        // storeId, waitingIdが必要
        if (!storeId || !waitingId) throw new Error("ID情報が不足しています");
        details = await getWaitingDetails(storeId, waitingId);
      } catch (checkErr) {
        // 404などが見つからない場合は、キャンセル処理に進むか、エラーにするか
        // ここでは「見つからない=既に削除orキャンセル」とみなして、そのままキャンセルAPIを呼ぶか、
        // ユーザーに通知する。
        // 安全のため、チェック失敗時はキャンセル処理を続行させる（サーバー側でハンドリング）
        // または、本当に存在しないならキャンセルAPIもエラーになるはず
        console.warn("キャンセル前のステータス確認失敗:", checkErr);
      }

      // 2. ステータスが completed (入店完了) の場合はキャンセルさせない
      if (details && details.status === 'completed') {
        console.log("既に入店完了済みのため、キャンセルを中断します");
        // 画面遷移せず、ポップアップで通知のみ行う
        // setIsCancelled(true); // Removed
        // setCancellationReason('completed'); // Removed

        // ポップアップを表示
        setPopupInfo({
          message: selectedLanguageCode === 'ja' ? "既に入店手続きが完了しています。" : "This visit has already been completed.",
          mode: "completed_notification"
        });
        setPopupVisible(true);
        return;
      }

      // 3. 通常のキャンセル処理
      const res = await cancelWaiting(storeId, waitingId);
      // axiosは成功時に例外をスローしないので、status codeで判定
      if (res.status >= 200 && res.status < 300) {
        // 成功時、isCancelled状態をtrueに変更
        setIsCancelled(true);
        setCancellationReason('user');
        // ローカルストレージからwaiting_idとstore_idを削除
        localStorage.removeItem("waiting_id");
        localStorage.removeItem("store_id");
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
    } else if (popupInfo.mode === "registration_complete") {
      setStep(3);
    } else if (popupInfo.mode === "max") {
      setStep(1);
    } else if (popupInfo.mode === "completed_notification") {
      // 何もしない（閉じるだけ）
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

  // アプリケーション初期化（ログアウト/リセット）
  const resetApp = () => {
    localStorage.removeItem("waiting_id");
    localStorage.removeItem("store_id");
    localStorage.removeItem("v_token");
    setWaitingId(null);
    setStep(1);
    setPartySize('');
    setSelectedNationality('その他');
    setContact('');
    setNotes('');
    setPopupVisible(false);
    setPopupInfo({ message: '', mode: '' });
  };

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

    // メニュー選択関連
    enableMenuSelection,
    selectedMenus,
    setSelectedMenus,

    // ステータス変更関数
    setSelectedNationality,
    setSelectedLanguageCode,
    setPartySize,
    setContact,
    setNotes,
    setStep,
    setCancellationReason: (reason) => {
      setIsCancelled(true);
      setCancellationReason(reason);
    },
    cancellationReason,
    requireOneMenuPerPerson, // expose new setting

    // Action/Page転換関数
    goToNextStep: () => setStep(prev => prev + 1),
    goToPrevStep: () => setStep(prev => prev - 1),
    handleSubmitWaiting,
    closePopupAndProceed,
    closePopupOnly,
    isChatOpen,
    toggleChat,
    isMapOpen, // Added
    toggleMap: () => setIsMapOpen(prev => !prev), // Added
    currentPage, // Added currentPage
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
    resetApp, // Expose resetApp
  };

  return (
    <WaitingScreenContext.Provider value={value}>
      <NetworkErrorPopup isOffline={isOffline} />
      {children}
    </WaitingScreenContext.Provider>
  );
}