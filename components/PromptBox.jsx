import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image'
import { useAppContext } from "@/context/AppContext";
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { sendPromptHandler } from '@/app/utils/sendPromptHandler';
import { useAuth, useClerk } from "@clerk/nextjs";

import deepthink_icon from '@/assets/deepthink_icon.svg';
import search_icon from '@/assets/search_icon.svg';
import pin_icon from '@/assets/pin_icon.svg';
import arrow_icon from '@/assets/arrow_icon.svg';
import arrow_icon_dull from '@/assets/arrow_icon_dull.svg';

const assets = {
  deepthink_icon,
  search_icon,
  pin_icon,
  arrow_icon,
  arrow_icon_dull
};

const PromptBox = ({setIsLoading, isLoading}) => {
    const [prompt, setPrompt] = useState('');
    const {user, setChats, selectedChat, setSelectedChat, nativeLang, setNativeLang, targetLang, setTargetLang, languageList} = useAppContext();
    const textareaRef = useRef(null);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (nativeLang === targetLang) {
                toast.error('Languages must be different.')
                return;
            }
            sendPrompt(e);
            setPrompt('');
            if (textareaRef.current) {
                textareaRef.current.style.height = '5vh';
            }
        }
    }

    const { isSignedIn } = useAuth();
    const clerk = useClerk();

    const sendPrompt = (e) =>
        sendPromptHandler({
            e,
            prompt,
            setPrompt,
            setIsLoading,
            setChats,
            setSelectedChat,
            selectedChat,
            user,
            nativeLang,
            targetLang,
            clerk,
    });

    async function updateChatLanguages({ 
    langType,
    value,
    selectedChat,
    nativeLang,
    targetLang,
    setNativeLang,
    setTargetLang,
    setSelectedChat,
    setChats
    }) {
        if (!isSignedIn && clerk) {
            toast.error('Login to change language.');
            clerk.openSignIn();
            return;
        }

        if (langType === "nativeLang") {
            setNativeLang(value);
        } else if (langType === "targetLang") {
            setTargetLang(value);
        }
        toast.success('Languages updated!')

        setSelectedChat(prev => ({
            ...prev,
            [langType]: value
        }));

        setChats(prev =>
            prev.map(chat =>
            chat._id === selectedChat._id
                ? { ...chat, [langType]: value }
                : chat
            )
        );

        // Persist to backend
        try {
            if (user) {
                await axios.patch('/api/chat/update-langs', {
                chatId: selectedChat._id,
                nativeLang: langType === "nativeLang" ? value : nativeLang,
                targetLang: langType === "targetLang" ? value : targetLang
            });
            } else {
                toast.error("Login to send message. Click the profile icon in the bottom left.")
            }
        } catch (error) {
            toast.error("Login to send message. Click the profile icon in the bottom left.")
            console.error(`Failed to update ${langType}:`, error);
        }
    }

  return (
    <form onSubmit={sendPrompt}
    className={`fixed w-full z-10 bottom-7 max-w-2xl
    bg-[#2a2a2a] p-4 pb-2 rounded-3xl mt-4 transition-all shadow-2xl`}>
        <textarea 
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            className="outline-none w-full resize-none overflow-hidden
            break-words bg-transparent text-white placeholder-white/30 text-base max-h-[20vh] min-h-[5vh] mb-3 overflow-y-auto"
            placeholder="Start a conversation, or ask me what I can do"
            required
            onChange={(e) => {
                setPrompt(e.target.value);

                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            value={prompt}
        />

        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <div className="flex gap-4 mb-3">
                    <select
                    value={nativeLang}
                    onChange={e => updateChatLanguages({
                        langType: "nativeLang",
                        value: e.target.value,
                        selectedChat,
                        nativeLang,
                        targetLang,
                        setNativeLang,
                        setTargetLang,
                        setSelectedChat,
                        setChats
                    })}
                    className="bg-[#3a3a3a] text-white p-3 rounded-lg p-2 -mb-1 focus:outline-none focus:ring-0 focus:border-transparent"
                    >
                    {languageList.map(l => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                    </select>

                    <span className="text-white text-xl mt-2 -ml-1 -mr-1">→</span>

                    <select
                    value={targetLang}
                    onChange={e => updateChatLanguages({
                        langType: "targetLang",
                        value: e.target.value,
                        selectedChat,
                        nativeLang,
                        targetLang,
                        setNativeLang,
                        setTargetLang,
                        setSelectedChat,
                        setChats
                    })}
                    className="bg-[#3a3a3a] text-white p-3 rounded-lg -mb-1 focus:outline-none focus:ring-0 focus:border-transparent"
                    >
                    {languageList.map(l => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                    </select>
                </div>
            </div>

            <button className={` ${prompt ? "bg-primary" : "bg-[#3a3a3a]"}
                rounded-full p-2 cursor-pointer`}>
                    <Image className="w-3.5 aspect-square" src={prompt ? assets.arrow_icon : assets.arrow_icon_dull} alt=''/>
            </button>
        </div>
    </form>
  )
}

export default PromptBox
