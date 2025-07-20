import React, { useState, useRef } from 'react';
import Image from 'next/image'
import { useAppContext } from "@/context/AppContext";
import { toast } from 'react-hot-toast';
import axios from 'axios';

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

const LANGUAGES = [
  { code: 'ar', label: 'Arabic' },
  { code: 'bn', label: 'Bengali' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'zh', label: 'Chinese' },
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

const PromptBox = ({setIsLoading, isLoading}) => {
    const [prompt, setPrompt] = useState('');
    // const [nativeLang, setNativeLang] = useAppContext();
    // const [targetLang, setTargetLang] = useAppContext();
    const {user, chats, setChats, selectedChat, setSelectedChat, nativeLang, setNativeLang, targetLang, setTargetLang} = useAppContext();
    const textareaRef = useRef(null);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendPrompt(e);
        }
    }

    const sendPrompt = async (e)=> {
        const promptCopy = prompt;

        try {
            e.preventDefault();
            if (!user) return toast.error('Login to Send Message');
            if (isLoading) return toast.error('Wait for the previous prompt response');
            if (prompt === "") {
                return toast.error('Enter a Prompt');
            }

            setIsLoading(true)
            setPrompt("")

            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.rows = 2;
            }

            const userPrompt = {
                role: "user",
                content: prompt,
                timestamp: Date.now()
            }

            setChats((prevChats)=> prevChats.map((chat)=> chat._id === selectedChat._id ? {
                ...chat,
                messages: [...chat.messages, userPrompt]
            }: chat
        ))

        setSelectedChat((prev)=> ({
            ...prev,
            messages: [...(prev?.messages || []), userPrompt]
        }))

        const {data} = await axios.post('/api/chat/ai', {
            chatId: selectedChat._id,
            prompt,
            nativeLang,
            targetLang
        })

        if (data.success) {
            const aiReplyString = data.response;

            // Create the FULL assistant message for persistent storage
            const fullAssistantMessage = {
                role: 'model',
                content: aiReplyString, // This holds the complete response
                timestamp: Date.now()
            };

            // Update the 'chats' state with the FULL message (for saving/history)
            setChats((prevChats) => prevChats.map((chat) => chat._id === selectedChat._id ? {
                ...chat,
                messages: [...chat.messages, fullAssistantMessage]
            } : chat));

            // Add the empty typing message to selectedChat for immediate display
            setSelectedChat((prev) => ({
                ...prev,
                messages: [...prev.messages, fullAssistantMessage],
            }));
            
        } else {
            toast.error(data.message)
            setPrompt(promptCopy);
        }

        } catch (error) {
            toast.error(error.message)
            setPrompt(promptCopy);
        } finally {
            setIsLoading(false);
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
            break-words bg-transparent text-white placeholder-white/30 text-base max-h-[20vh] mb-3"
            rows={2}
            placeholder="Message PolyglotGPT"
            required
            onChange={(e) => {
                setPrompt(e.target.value);

                // Auto-resize logic
                e.target.style.height = 'auto'; // Reset height
                e.target.style.height = `${e.target.scrollHeight}px`; // Set to actual content height
            }}
            value={prompt}
        />

        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <div className="flex gap-4 mb-3">
                    <select
                    value={nativeLang}
                    onChange={e => setNativeLang(e.target.value)}
                    className="bg-[#3a3a3a] text-white p-3 rounded-lg p-2 -mb-1"
                    >
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                    </select>
                    <select
                    value={targetLang}
                    onChange={e => setTargetLang(e.target.value)}
                    className="bg-[#3a3a3a] text-white p-3 rounded-lg -mb-1"
                    >
                    {LANGUAGES.map(l => (
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
