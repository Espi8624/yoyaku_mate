import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';

import "./WatingStoreInfo.css";

function WatingStoreInfo({ setUserRole }) {
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    return (
        <div className="log-in-page">
            <div className="form-wrap"> {/* h1과 form을 감싸는 컨테이너 추가 */}
                <h1>Yoyaku Mate</h1>
                <form>
                    <label htmlFor="username">店名</label>
                    <label htmlFor="password">挨拶テキスト</label>
                </form>
            </div>
        </div>
    );
}

export default WatingStoreInfo;