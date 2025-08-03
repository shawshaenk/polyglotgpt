"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, useClerk, useUser } from '@clerk/nextjs';
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
    const [isLocalMode, setIsLocalMode] = useState(false);

    const languageList = [
      { code: 'ar', label: 'Arabic' },
      { code: 'bn', label: 'Bengali' },
      { code: 'bg', label: 'Bulgarian' },
      { code: 'zh-CN', label: 'Chinese (Simplified)' },
      { code: 'zh-TW', label: 'Chinese (Traditional)' },
      { code: 'hr', label: 'Croatian' },
      { code: 'cs', label: 'Czech' },
      { code: 'da', label: 'Danish' },
      { code: 'nl', label: 'Dutch' },
      { code: 'en', label: 'English' },
      { code: 'et', label: 'Estonian' },
      { code: 'fi', label: 'Finnish' },
      { code: 'fr', label: 'French' },
      { code: 'de', label: 'German' },
      { code: 'el', label: 'Greek' },
      { code: 'gu', label: 'Gujarati' },
      { code: 'he', label: 'Hebrew' },
      { code: 'hi', label: 'Hindi' },
      { code: 'hu', label: 'Hungarian' },
      { code: 'id', label: 'Indonesian' },
      { code: 'it', label: 'Italian' },
      { code: 'ja', label: 'Japanese' },
      { code: 'kn', label: 'Kannada' },
      { code: 'ko', label: 'Korean' },
      { code: 'lv', label: 'Latvian' },
      { code: 'lt', label: 'Lithuanian' },
      { code: 'ml', label: 'Malayalam' },
      { code: 'mr', label: 'Marathi' },
      { code: 'no', label: 'Norwegian' },
      { code: 'pl', label: 'Polish' },
      { code: 'pt', label: 'Portuguese' },
      { code: 'ro', label: 'Romanian' },
      { code: 'ru', label: 'Russian' },
      { code: 'sr', label: 'Serbian' },
      { code: 'sk', label: 'Slovak' },
      { code: 'sl', label: 'Slovenian' },
      { code: 'es', label: 'Spanish' },
      { code: 'sw', label: 'Swahili' },
      { code: 'sv', label: 'Swedish' },
      { code: 'ta', label: 'Tamil' },
      { code: 'te', label: 'Telugu' },
      { code: 'th', label: 'Thai' },
      { code: 'tr', label: 'Turkish' },
      { code: 'uk', label: 'Ukrainian' },
      { code: 'ur', label: 'Urdu' },
      { code: 'vi', label: 'Vietnamese' },
    ];

    const { isSignedIn } = useAuth();
    const clerk = useClerk();

    const createNewChat = async () => {
        if (!isSignedIn) {
          // GUEST / LOCAL chat
          const tempChat = {
            _id: `temp-local-chat`,
            name: 'New Chat',
            messages: [],
            nativeLang,
            targetLang,
            isLocal: true
          };
          setChats(prev => [...prev, tempChat]);
          setSelectedChat(tempChat);
          return;
        }

        const toastId = toast.loading("Creating new chat...");
        try {

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

            await fetchUsersChats();
            toast.success('New chat created!', { id: toastId })
        } catch (error) {
            toast.error(error.message);
        }
    };

    const fetchUsersChats = async () => {
        const toastId = toast.loading("Fetching chats...");

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
                toast.success('Chats fetched!', { id: toastId })
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (!isSignedIn) {
          setIsLocalMode(true);
          if (chats.length === 0) {
            const temp = {
              _id:       'temp-local-chat',
              name:      'New Chat',
              messages:  [],
              nativeLang,
              targetLang,
              isLocal:   true
            };
            setChats([temp]);
            setSelectedChat(temp);
          }
        } else {
          setIsLocalMode(false);
        }
    }, [isSignedIn]);

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
        setTargetLang, 
        languageList,
        isLocalMode
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}