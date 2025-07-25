"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const AppContext = createContext();

export const useAppContext = ()=> {
    return useContext(AppContext)
}

export const AppContextProvider = ({children})=>{
    const {user} = useUser()
    const {getToken} = useAuth()

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');

    const createNewChat = async () => {
        try {
            if (!user) return;

            const token = await getToken();

            const { data } = await axios.post('/api/chat/create',
            { nativeLang, targetLang },
            {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            }
            );

            console.log("Chat created:", data);

            // 🧠 Instead of triggering fetch again here,
            // let the outer useEffect or caller decide
            // OR trigger it manually from the button/menu
            await fetchUsersChats();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchUsersChats = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/chat/get', {
            headers: {
                Authorization: `Bearer ${token}`
            }
            });

            if (data.success) {
            if (data.data.length === 0) {
                console.log("No chats found. Creating one...");
                await createNewChat();  // Do not recursively call fetch again here
                return;
            }

            const sorted = data.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setChats(sorted);
            setSelectedChat(sorted[0]);
            console.log("Chats loaded:", sorted[0]);
            } else {
            toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    useEffect(()=> {
        if (user) {
            fetchUsersChats();
        }
    }, [user])

    useEffect(() => {
    if (selectedChat) {
        setNativeLang(selectedChat.nativeLang);
        setTargetLang(selectedChat.targetLang);
        console.log("language changed")
    }
    }, [selectedChat]);

    const value = {
        user,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        fetchUsersChats,
        createNewChat, 
        nativeLang, 
        setNativeLang, 
        targetLang, 
        setTargetLang
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}