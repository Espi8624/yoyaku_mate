import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';

import "./WatingScreen.css";

function WatingScreen({ setUserRole }) {
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    // ダミーユーザーデータ
    const dummyUsers = {
        "customer1": { password: "1234", role: "customer" },
        "provider1": { password: "1234", role: "provider" },
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const user = dummyUsers[account];

        if (user && user.password === password) {
            setUserRole(user.role);
            console.log(`Logged in as ${user.role}`);

            navigate("/"); // ログイン後、メインページへリダイレクト
        } else {
            alert("Invalid username or password");
        }
    };

    return (
        <div className="log-in-page">
            <div className="form-wrap"> {/* h1과 form을 감싸는 컨테이너 추가 */}
                <h1>Yoyaku Mate</h1>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="username">名前</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        required
                    />

                    <label htmlFor="password">連絡先</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    
                </form>
                <Link to={`/wating-user-info`} >
                    <button className="confirmation-btn">
                        確認画面へ
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default WatingScreen;