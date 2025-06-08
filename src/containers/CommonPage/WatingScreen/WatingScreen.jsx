import React, { useState } from "react";
import { Link } from 'react-router-dom';

import "./WatingScreen.css";

function WatingScreen({ setUserRole }) {
    const [customer_name, setCuseromer_name] = useState("");
    const [party_size, setParty_size] = useState();
    const [contact, setContact] = useState("");
    const [notes, setNotes] = useState("");

    return (
        <div className="log-in-page">
            <div className="form-wrap"> {/* h1과 form을 감싸는 컨테이너 추가 */}
                <h1>Yoyaku Mate</h1>
                <form>
                    <label htmlFor="customer_name">名前</label>
                    <input
                        type="text"
                        id="customer_name"
                        name="customer_name"
                        value={customer_name}
                        onChange={(e) => setCuseromer_name(e.target.value)}
                        required
                    />

                    <label htmlFor="party_size">人数</label>
                    <input
                        type="text"
                        id="party_size"
                        name="party_size"
                        value={party_size}
                        onChange={(e) => setParty_size(e.target.value)}
                        required
                    />

                    <label htmlFor="contact">電話番号</label>
                    <input
                        type="text"
                        id="contact"
                        name="contact"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        required
                    />

                    <label htmlFor="notes">備考</label>
                    <input
                        type="text"
                        id="notes"
                        name="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        required
                    />
                    
                </form>
                <Link to={`/wating-user-info`} state={{ customer_name, party_size, contact, notes }}>
                    <button className="confirmation-btn">
                        確認画面へ
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default WatingScreen;