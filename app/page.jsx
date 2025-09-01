'use client';
import Sidebar from "@/components/sidebar";
import PromptBox from "@/components/PromptBox";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import Message from "@/components/Message";
import { useAppContext } from "@/context/AppContext";
import { Analytics } from '@vercel/analytics/next';
import { useAuth, useClerk } from "@clerk/nextjs";

import menu_icon from '@/assets/menu_icon.svg';
import chat_icon from '@/assets/chat_icon.svg';
import translate_icon from '@/assets/translate_icon.svg';
import polyglotgpt_logo from '@/assets/polyglotgpt_logo.png';

const assets = {
  menu_icon,
  chat_icon,
  translate_icon,
  polyglotgpt_logo
};

export default function Home() {
  const [expand, setExpand] = useState(true)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const {selectedChat, chatButtonAction} = useAppContext()
  const containerRef = useRef(null)

  const { isSignedIn, isLoaded } = useAuth();
  const prevSignedInRef = useRef(null);
  const clerk = useClerk();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setExpand(true);
      } else {
        setExpand(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn === false && clerk) {
      clerk.openSignIn();
    }
  }, [isSignedIn, isLoaded, clerk]);

  // Handle sign-out detection and page reload
  useEffect(() => {
    // Only start tracking after auth has loaded
    if (!isLoaded) return;

    // If we have a previous state and user just signed out
    if (prevSignedInRef.current === true && isSignedIn === false) {
      window.location.reload();
      return;
    }

    // Update the ref only after auth is loaded
    prevSignedInRef.current = isSignedIn;
  }, [isSignedIn, isLoaded]);

  useEffect(()=>{
    if (selectedChat) {
      setMessages(selectedChat.messages)
    }
  },[selectedChat])

  useEffect(()=>{
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  },[messages])

  return (
    <div>
      <Analytics/>
      <div className="flex h-screen">
        <Sidebar expand={expand} setExpand={setExpand}/>
        {/* background color for website */}
        <div className={`flex-1 flex flex-col items-center ${messages.length === 0 ? "justify-center" : "justify-start"} px-4 pb-8 bg-[#1e1e1e] text-white relative`}>
          <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full">
            <Image onClick={()=> (expand ? setExpand(false): setExpand(true))}
              className="rotate-180 select-none" src={assets.menu_icon} alt=""/>
            <Image onClick={chatButtonAction} className="opacity-70 select-none" src={assets.chat_icon} alt=""/>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3">
                <Image src={assets.polyglotgpt_logo} alt="" className="h-19 w-19 pb-1 -mr-2 -mb-2 select-none"/>
                <p className="text-3xl font-medium">PolyglotGPT</p>
              </div>
              <p className="text-lg mt-2">What language do you want to learn today?</p>
              <a href="https://www.loom.com/share/fe7c88ef0cd24bcabd40f41c09e11e36?sid=4ef5308a-fb07-47e0-961f-ed62e7e69d1d" target="_blank" rel="noopener noreferrer" className="text-base text-blue-500 mt-2 underline mt-1">Click for a Demo Video</a>
            </div>
          ):
          (
          <div className="relative flex flex-col items-center justify-start w-full mt-20 max-h-screen overflow-y-auto pb-35" ref={containerRef}>
          <p className="fixed top-8 border border-transparent hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold mb-6">{selectedChat.name}</p>
          {messages.map((msg, index)=> {
            const lastUserMessage = messages.filter(message => message.role === 'user').pop()?.content;
            return (
              <Message key={index} role={msg.role} content={msg.content} setIsLoading={setIsLoading} isLastAIMessage={index === messages.length - 1} isLastUserMessage={index === messages.length - 1 || index === messages.length - 2} lastUserMessage={lastUserMessage}/>
            )
          })}
          {
            isLoading && (
              <div className="flex gap-4 max-w-3xl w-full py-3">
                <Image className="h-9 w-9 p-1 border border-white/15 rounded-full select-none" src={assets.translate_icon} alt="Logo"/>
                <div className="loader flex justify-center items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-white animate-bounce">
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white animate-bounce">
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white animate-bounce">
                  </div>
                </div>
              </div>
            )
          }
          </div>
        )
        }
        <PromptBox isLoading={isLoading} setIsLoading={setIsLoading}/>
        <p className="text-xs absolute bottom-1 text-gray-500">Powered by Gemini 2.5 Flash</p>

        </div>
      </div>
    </div>
  );
}
