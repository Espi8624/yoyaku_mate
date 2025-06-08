import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom";

import "./WatingUserInfo.css";



function WatingUserInfo({ setUserRole }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { customer_name, party_size, contact, notes } = location.state || {};
    // const [ID, setID] = useState("");
    // const [StoreID, setStoreID] = useState("");
    // const [QueueNumber, setQueueNumber] = useState("");
    // const [Nationality, setNationality] = useState("");
    // const [RegistrationTime, setRegistrationTime] = useState("");
    // const [Status, setStatus] = useState("");
    // const [CalledTime, setCalledTime] = useState("");
    // const [EntryTime, setEntryTime] = useState("");

    const handleSubmit = () => {
        createWaitingListItem({
            customerName: customer_name,
            partySize: Number(party_size),
            contact: contact,
            nationality: "Japan",
            notes: notes
        });

        navigate("/wating-store-info");
    };

    // 登録関数例
    const createWaitingListItem = async ({
        customerName,
        partySize,
        contact,
        nationality,
        notes,
        storeId = 'store-001',
        baseUrl = 'http://localhost:8080'
    }) => {
        try {
            const requestBody = {
                store_id: storeId,
                customer_name: customerName,
                party_size: partySize,
                nationality: nationality,
                contact: contact,
                notes: notes,
                status: 'waiting'
            };

            const response = await fetch(`${baseUrl}/api/waiting-list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.status === 201) {
                const responseData = await response.json();
                return responseData;
            }
            navigate("/wating-store-info");

            const errorData = await response.json();
            throw new Error(`Failed to create waiting list item: ${response.status}\nResponse: ${JSON.stringify(errorData)}`);
        } catch (error) {
            console.error('Error creating waiting list item:', error);
            throw error;
        }
    };

    return (
        <div className="log-in-page">
            <div className="form-wrap"> {/* h1과 form을 감싸는 컨테이너 추가 */}
                <h1>Yoyaku Mate</h1>
                <form>
                    <label htmlFor="customer_name">名前：{customer_name}</label>

                    <label htmlFor="party_size">人数：{party_size}</label>

                    <label htmlFor="contact">電話番号：{contact}</label>

                    <label htmlFor="notes">備考：{notes}</label>

                </form>
                <Link to={`/wating-screen`} >
                    <button className="confirmation-btn">
                        戻る
                    </button>
                </Link>
                <button className="confirmation-btn" onClick={handleSubmit}>
                    確定
                </button>
            </div>
        </div>
    );
}

export default WatingUserInfo;