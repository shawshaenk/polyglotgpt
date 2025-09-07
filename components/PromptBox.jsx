import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image'
import { useAppContext } from "@/context/AppContext";
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { sendPromptHandler } from '@/app/utils/sendPromptHandler';

import arrow_icon from '@/assets/arrow_icon.svg';

const assets = {
  arrow_icon,
};

const PromptBox = ({setIsLoading}) => {
    const {user, setChats, selectedChat, setSelectedChat, prevNativeLang, setPrevNativeLang, nativeLang, setNativeLang, prevTargetLang, setPrevTargetLang, targetLang, setTargetLang, languageList, fetchUsersChats, prompt, setPrompt, editingMessage, setEditingMessage, editingMessageIndex, setEditingMessageIndex} = useAppContext();
    const textareaRef = useRef(null);

    const handleKeyDown = async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (nativeLang === targetLang) {
                toast.error('Languages Must Be Different')
                return;
            }
            await sendPrompt(e);
        }
    }

    useEffect(() => {
        if (prompt === '' && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [prompt]);

    const sendPrompt = (e) => {
        sendPromptHandler({
            e,
            prompt,
            setPrompt,
            setIsLoading,
            setChats,
            setSelectedChat,
            selectedChat,
            user,
            prevNativeLang,
            prevTargetLang,
            setPrevNativeLang,
            setPrevTargetLang,
            nativeLang,
            targetLang,
            fetchUsersChats,
            editingMessage,
            userMessageIndex: editingMessageIndex
        });

        setEditingMessage(false);
        setEditingMessageIndex(null);
    };

    useEffect(() => {
        if (textareaRef.current) {
        textareaRef.current.focus();
        }
    }, [prompt]);

    async function updateChatLanguages({ 
    langType,
    value,
    selectedChat,
    setPrevNativeLang,
    setPrevTargetLang,
    nativeLang,
    targetLang,
    setNativeLang,
    setTargetLang,
    setSelectedChat,
    setChats
    }) {
        // if (selectedChat.messages.length > 0 && user) {
        //     toast.error('Create new chat to change languages')
        //     return;
        // }

        if (langType === "nativeLang") {
            setPrevNativeLang(nativeLang);
            setNativeLang(value);
        } else if (langType === "targetLang") {
            setPrevTargetLang(targetLang);
            setTargetLang(value);
        }
        toast.success('Languages Updated!')

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
        if (user) {
            try {
                await axios.patch('/api/chat/update-langs', {
                    chatId: selectedChat._id,
                    nativeLang: langType === "nativeLang" ? value : nativeLang,
                    targetLang: langType === "targetLang" ? value : targetLang
                });
            } catch (error) {
                toast.error("Failed to Update Languages in Database");
                console.error(`Failed to Update ${langType}:`, error);
            }
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
            break-words bg-transparent text-white placeholder-white/30 text-base max-h-[20vh] mb-3 overflow-y-auto"
            placeholder="Start a conversation, or ask me what I can do"
            title=""
            required
            onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            value={prompt}
            rows={1}
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
                        setPrevNativeLang,
                        setPrevTargetLang,
                        nativeLang,
                        targetLang,
                        setNativeLang,
                        setTargetLang,
                        setSelectedChat,
                        setChats
                    })}
                    className="bg-[#3a3a3a] text-white rounded-lg -mb-1 w-32 sm:w-48 focus:outline-none focus:ring-0 focus:border-transparent p-3"
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
                        setPrevNativeLang,
                        setPrevTargetLang,
                        nativeLang,
                        targetLang,
                        setNativeLang,
                        setTargetLang,
                        setSelectedChat,
                        setChats
                    })}
                    className="bg-[#3a3a3a] text-white rounded-lg -mb-1 w-32 sm:w-48 focus:outline-none focus:ring-0 focus:border-transparent p-3"
                    >
                    {languageList.map(l => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                    </select>
                </div>
            </div>

            <button className={` ${prompt ? "bg-primary" : "bg-[#3a3a3a]"}
                rounded-full p-2 cursor-pointer`}>
                    <Image className="w-3.5 aspect-square select-none" src={assets.arrow_icon} alt=''/>
            </button>
        </div>
    </form>
  )
}

export default PromptBox
