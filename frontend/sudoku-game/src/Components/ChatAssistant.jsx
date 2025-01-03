import React, { useState } from 'react';

const ChatAssistant = ({ boardState }) => {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [showChat, setShowChat] = useState(true);

    const sendMessage = async () => {
        try {
            const res = await fetch('/check_board/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    board_state: boardState,
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            setResponse(data.response);
            setMessage('');
        } catch (error) {
            console.error('Error while fetching chat response:', error);
        }
    };

    return (
        <>
            {showChat && (
                <div className="chat-assistant">
                    <button
                        className="close-button"
                        onClick={() => setShowChat(false)}
                    >
                        ✕
                    </button>
                    <h3>Chat Assistant</h3>
                    <div className="chat-response">
                        {response ? <p>{response}</p> : <p>Ask me anything about Sudoku!</p>}
                    </div>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            )}

            {!showChat && (
                <button
                    className="chat-toggle-button"
                    onClick={() => setShowChat(true)}
                >
                    💬
                </button>
            )}
        </>
    );
};


export default ChatAssistant;
