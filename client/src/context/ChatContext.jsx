import { createContext, useState, useEffect, useContext } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState(() => {
        try {
            const savedMessages = localStorage.getItem("chat_history");
            return savedMessages ? JSON.parse(savedMessages) : [];
        } catch (e) {
            console.error("Error loading chat history:", e);
            return [];
        }
    });

    const [currentResumeId, setCurrentResumeId] = useState(() => {
        return localStorage.getItem("active_resume_id") || null;
    });

    // Save to localStorage whenever messages change
    useEffect(() => {
        localStorage.setItem("chat_history", JSON.stringify(messages));
    }, [messages]);

    // Save active resume id
    useEffect(() => {
        if (currentResumeId) {
            localStorage.setItem("active_resume_id", currentResumeId);
        } else {
            localStorage.removeItem("active_resume_id");
        }
    }, [currentResumeId]);

    const clearHistory = () => {
        setMessages([]);
        setCurrentResumeId(null);
        localStorage.removeItem("chat_history");
        localStorage.removeItem("active_resume_id");
    };

    return (
        <ChatContext.Provider value={{
            messages,
            setMessages,
            currentResumeId,
            setCurrentResumeId,
            clearHistory
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};
