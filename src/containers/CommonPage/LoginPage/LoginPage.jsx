import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./LoginPage.css";

function LoginPage({ setUserRole }) {
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    // ダミーユーザーデータ
    const dummyUsers = {
        "client1": { password: "1234", role: "client" },
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
            <h1>ログイン</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="username">メール</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    required />

                <label htmlFor="password">パスワード</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">ログイン</button>
            </form>
        </div>
    );
}

export default LoginPage;