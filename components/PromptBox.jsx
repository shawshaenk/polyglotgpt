import React, { useState } from 'react';
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

const PromptBox = ({setIsLoading, isLoading}) => {
    const [prompt, setPrompt] = useState('');
    const {user, chats, setChats, selectedChat, setSelectedChat} = useAppContext();

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

            setIsLoading(true)
            setPrompt("")

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
            prompt
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
    className={`fixed w-full z-10 bottom-10 max-w-2xl
    bg-[#3d3846] p-4 rounded-3xl mt-4 transition-all`}>
        <textarea
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none overflow-hidden
        break-words bg-transparent"
        rows={2}
        placeholder="Message PolyglotGPT" required
        onChange={(e)=> setPrompt(e.target.value)} value={prompt}/>

        <div className="flex items-center justify-between text-sm">
            

            <div className="flex items-center gap-2">
            <button className={`${prompt ? "bg-primary" : "bg-[#77767b]"}
            rounded-full p-2 cursor-pointer`}>
                <Image className="w-3.5 aspect-square" src={prompt ? assets.arrow_icon : assets.arrow_icon_dull} alt=''/>
            </button>
            </div>
        </div>
    </form>
  )
}

export default PromptBox
