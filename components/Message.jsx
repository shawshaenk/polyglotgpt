import React, { useEffect, useState, useRef } from "react";
import Image from 'next/image';
import Markdown from "react-markdown";
import Prism from "prismjs";
import { useAppContext } from "@/context/AppContext";
import { sendPromptHandler } from '@/app/utils/sendPromptHandler';

import copy_icon from '@/assets/copy_icon.svg';
import pencil_icon from '@/assets/pencil_icon.svg';
import regenerate_icon from '@/assets/regenerate_icon.svg';
import like_icon from '@/assets/like_icon.svg';
import dislike_icon from '@/assets/dislike_icon.svg';
import logo_icon from '@/assets/logo_icon.svg';
import translate_icon from '@/assets/translate_icon.svg';
import toast from "react-hot-toast";
import axios from 'axios';

const assets = {
  copy_icon,
  pencil_icon,
  regenerate_icon,
  like_icon,
  dislike_icon,
  logo_icon,
  translate_icon
};

const Message = ({role, content, setIsLoading}) => {

  const [selectionText, setSelectionText] = useState("");
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const messageWrapperRef = useRef(null);
  const popupRef = useRef(null);
  const [translatedText, setTranslatedText] = useState(null);
  const [romanizedText, setRomanizedText] = useState(null);
  const [aiMessage, setAiMessage] = useState(content);
  const {user, setChats, selectedChat, setSelectedChat, nativeLang, targetLang, languageList} = useAppContext();

  useEffect(() => {
    Prism.highlightAll();

    const handleMouseUp = (e) => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText.length > 0 && containerRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const parentRect = messageWrapperRef.current.getBoundingClientRect();

        let newX = rect.left - parentRect.left;
        let newY = rect.top - parentRect.top;

        if (popupRef.current) {
          const popupWidth = popupRef.current.offsetWidth;
          const popupHeight = popupRef.current.offsetHeight;

          newX += (rect.width / 2) - (popupWidth / 2);
          newY -= (popupHeight + 10);
        } else {
            newX += (rect.width / 2) - 75;
            newY -= 50;
        }

        setSelectionText(selectedText);
        setPopupPos({ x: newX, y: newY });

      } else {
        setSelectionText("");
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  //Whenever content changes, reset translated and romanized text
  useEffect(() => {
    setAiMessage(content);
    setTranslatedText(null);
    setRomanizedText(null);
  }, [content, nativeLang, targetLang]);

  useEffect(()=>{
    Prism.highlightAll()
  }, [content])

  const copyMessage = ()=> {
    navigator.clipboard.writeText(aiMessage)
    toast.success("Message Copied to Clipboard")
  }

  const translateText = async (e)=> {
    if (translatedText) {
      setAiMessage(translatedText);
      toast.success("Translated!")
      return;
    }

    const toastId = toast.loading("Translating...");
    const translatedTextCopy = content;

    const {data} = await axios.post('/api/chat/translate', {
        translatedTextCopy,
        nativeLang,
    })

    if (data.success) {
      setTranslatedText(data.response);
      setAiMessage(data.response);
      toast.success("Translated!", { id: toastId });

    } else {
        toast.error(data.message)
    }
  }

  const romanizeText = async (e)=> {
    if (romanizedText) {
      setAiMessage(romanizedText);
      toast.success("Romanized!")
      return;
    }

    const toastId = toast.loading("Romanizing...");
    const romanizedTextCopy = content;

    const {data} = await axios.post('/api/chat/romanize', {
        romanizedTextCopy
    })

    if (data.success) {
      setRomanizedText(data.response);
      setAiMessage(data.response);
      toast.success("Romanized!", { id: toastId });

    } else {
        toast.error(data.message)
    }
  }

  const showOriginalContent = ()=> {
    setAiMessage(content);
    toast.success("Original Message Restored")
  }

  const sendPrompt = (e) => {
    const languageToExplainIn = languageList.find(lang => lang.code === nativeLang)?.label

    sendPromptHandler({
      e,
      prompt: `Explain "${selectionText}" in ${languageToExplainIn}, word by word`,
      setIsLoading,
      setChats,
      setSelectedChat,
      selectedChat,
      user,
      nativeLang,
      targetLang,
    });
  };

  return (
    <div ref={messageWrapperRef} className="relative flex flex-col items-center w-full max-w-3xl text-base">
      <div className={`flex flex-col w-full mb-8 ${role === 'user' && 'items-end'}`}>
        <div className={`group relative flex max-w-2xl py-3 rounded-xl ${role === 'user' ? 'bg-[#2a2a2a] px-5 mt-2 max-w-[30vw]' : '-mt-6 gap-3'}`}>
            <div className={`absolute ${role === 'user' ? '-left-6 top-1/2 -translate-y-1/2' : 'left-12.5 -bottom-3.5'} transition-all`}>
                <div className="flex items-center gap-2 opacity-70">
                    {
                        role === 'user' ? (
                            <>
                            <Image onClick={copyMessage} src={assets.copy_icon} alt="" className="w-4 cursor-pointer"/>
                            </>
                        ):(
                            <>
                            <Image onClick={copyMessage} src={assets.copy_icon} alt="" className="w-4.5 cursor-pointer"/>
                            {/* <Image src={assets.regenerate_icon} alt="" className="w-4 cursor-pointer"/> */}
                            <button className="text-sm cursor-pointer hover:underline" onClick={() => {showOriginalContent();}}>Show Original</button>
                            <button className="text-sm cursor-pointer hover:underline" onClick={() => {translateText();}}>Translate</button>
                            <button className="text-sm cursor-pointer hover:underline" onClick={() => {romanizeText();}}>Romanize</button>
                            {/* <button className="text-sm cursor-pointer hover:underline">Speak</button> */}
                            </>
                        )
                    }
                </div>
            </div>
            {
                role === 'user' ?
                (
                    <span className={`text-white/90 break-words overflow-hidden`}>{content}</span>
                )
                :
                (
                    <>
                    <Image src={assets.translate_icon} alt="" className="h-9 w-9 p-1 border border-white/15 rounded-full"/>
                    <div ref={containerRef} className="space-y-4 mt-2 w-full overflow-visible break-words max-w-[60vw]">
                      <Markdown>{aiMessage}</Markdown>
                    </div>
                    </>
                )
            }
        </div>
      </div>
      {selectionText && (
        <div
          ref={popupRef}
          className="absolute z-50 bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg shadow-lg flex gap-2"
          style={{ top: popupPos.y, left: popupPos.x }}
        >
          <button
            onClick={(e) => sendPrompt(e)}
            className="hover:underline cursor-pointer"
          >
            Translate and Explain
          </button>
        </div>
      )}
    </div>
  )
}

export default Message;