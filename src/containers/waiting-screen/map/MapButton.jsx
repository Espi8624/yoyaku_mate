import { useWaitingScreen } from '../WaitingScreenContext';
import { MAP_CHATBOT_ENABLED } from '../../../constants/featureFlags';
import styles from "./MapButton.module.css";

const MapButton = () => {
    const { storeId, toggleMap } = useWaitingScreen();

    // 機能フラグが無効な間は非表示 (正式導入まで一時的に隠す)
    if (!MAP_CHATBOT_ENABLED) {
        return null;
    }

    // storeIdがない場合（不正アクセスなど）は表示しない
    if (!storeId) {
        return null;
    }

    return (
        <button className={styles["map-button"]} onClick={toggleMap} aria-label="地図を開く">
            <svg className={styles["map-icon"]} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M20.5 3l-6 2.25L8.5 3 3.5 4.875v15.25l6-2.25 6 2.25 5-1.875V3zM15 19l-6-2.25L4.5 18.25V6l4.5-1.687L15 6.5l4.5-1.687v12.562L15 19z" />
                <path d="M0 0h24v24H0z" fill="none" />
            </svg>
        </button>
    );
};

export default MapButton;
