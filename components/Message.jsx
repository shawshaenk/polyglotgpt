import React, { useEffect, useState, useRef } from "react";
import Image from 'next/image';
import Markdown from "react-markdown";
import Prism from "prismjs";
import { useAppContext } from "@/context/AppContext";
import { sendPromptHandler } from '@/app/utils/sendPromptHandler';

import copy_icon from '@/assets/copy_icon.svg';
import rename_icon from '@/assets/rename_icon.svg';
import translate_icon from '@/assets/translate_icon.svg';
import toast from "react-hot-toast";
import axios from 'axios';

const assets = {
  copy_icon,
  rename_icon,
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
  
  // Audio control states
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const {user, setChats, selectedChat, setSelectedChat, nativeLang, targetLang, languageList, fetchUsersChats, setPrevNativeLang, setPrevTargetLang} = useAppContext();

  useEffect(() => {
    Prism.highlightAll();

    const handleMouseUp = (e) => {
      if (popupRef.current?.contains(e.target)) {
        return;
      }

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
    document.addEventListener("touchend", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setIsPlaying(false);
      }
    };
  }, [currentAudio]);

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

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
      toast.success("Stopped Speaking");
    }
  };

  const speakText = async (e) => {
    if (currentAudio) {
      stopSpeaking();
      return;
    }

    const toastId = toast.loading("Processing...");
    const speakTextCopy = content;

    try {
      const { data } = await axios.post('/api/chat/speak', {
        speakTextCopy,
        nativeLang,
        targetLang
      });

      if (data.success) {
        // Convert base64 to audio and play it
        const audioSrc = `data:${data.contentType};base64,${data.audioContent}`;
        const audio = new Audio(audioSrc);
        
        // Set up event listeners
        audio.onplay = () => {
          setIsPlaying(true);
          toast.success("Speaking!", { id: toastId });
        };
        
        audio.onended = () => {
          setCurrentAudio(null);
          setIsPlaying(false);
        };
        
        audio.onerror = () => {
          setCurrentAudio(null);
          setIsPlaying(false);
          toast.error("Audio Playback Failed", { id: toastId });
        };
        
        setCurrentAudio(audio);
        audio.play();
        
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch (err) {
      console.error("Speak error:", err);
      toast.error("Failed to Play Audio", { id: toastId });
    }
  };

  const speakTextHighlighted = async (e) => {
    if (currentAudio) {
      stopSpeaking();
      return;
    }

    const toastId = toast.loading("Processing...");
    const speakTextCopy = selectionText;

    try {
      const { data } = await axios.post('/api/chat/speak-on-highlight', {
        speakTextCopy,
        targetLang
      });

      if (data.success) {
        // Convert base64 to audio and play it
        const audioSrc = `data:${data.contentType};base64,${data.audioContent}`;
        const audio = new Audio(audioSrc);
        
        // Set up event listeners
        audio.onplay = () => {
          setIsPlaying(true);
          toast.success("Speaking!", { id: toastId });
        };
        
        audio.onended = () => {
          setCurrentAudio(null);
          setIsPlaying(false);
        };
        
        audio.onerror = () => {
          setCurrentAudio(null);
          setIsPlaying(false);
          toast.error("Audio Playback Failed", { id: toastId });
        };
        
        setCurrentAudio(audio);
        audio.play();
        
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch (err) {
      console.error("Speak error:", err);
      toast.error("Failed to Play Audio", { id: toastId });
    }
  };

  const showOriginalContent = ()=> {
    setAiMessage(content);
    toast.success("Original Message Restored")
  }

  const sendPrompt = (e, action) => {
    const languageToExplainIn = languageList.find(lang => lang.code === nativeLang)?.label
    let promptToSend = ''
    if (action === 'translate') {
      promptToSend = `Translate "${selectionText}"`
    } else {
      promptToSend = `Explain "${selectionText}"`
    }

    sendPromptHandler({
      e,
      prompt: promptToSend,
      setIsLoading,
      setChats,
      setSelectedChat,
      selectedChat,
      user,
      nativeLang,
      targetLang,
      fetchUsersChats,
      setPrevNativeLang,
      setPrevTargetLang
    });
  };

  return (
    <div ref={messageWrapperRef} className="relative flex flex-col items-center w-full max-w-3xl text-base">
      <div className={`flex flex-col w-full mb-8 ${role === 'user' && 'items-end'}`}>
        <div className={`group relative flex max-w-2xl py-3 rounded-xl ${role === 'user' ? 'bg-[#2a2a2a] px-5 mt-2 max-w-[80vw] sm:max-w-[30vw]' : '-mt-6 gap-3'}`}>
            <div className={`absolute ${role === 'user' ? '-left-6 top-1/2 -translate-y-1/2' : 'left-12.5 -bottom-3.5'} transition-all`}>
                <div className="flex items-center gap-2 opacity-70">
                    {
                        role === 'user' ? (
                            <>
                            <Image onClick={copyMessage} src={assets.copy_icon} alt="" className="w-4 cursor-pointer select-none"/>
                            </>
                        ):(
                            <>
                            <Image onClick={copyMessage} src={assets.copy_icon} alt="" className="w-4 cursor-pointer select-none"/>
                            {/* <Image src={assets.regenerate_icon} alt="" className="w-4 cursor-pointer"/> */}
                            <button className="text-xs sm:text-sm cursor-pointer hover:underline select-none" onClick={() => {showOriginalContent();}}>Show Original</button>
                            <button className="text-xs sm:text-sm cursor-pointer hover:underline select-none" onClick={() => {translateText();}}>Translate</button>
                            <button className="text-xs sm:text-sm cursor-pointer hover:underline select-none" onClick={() => {romanizeText();}}>Romanize</button>
                            <button 
                              className={`text-xs sm:text-sm cursor-pointer hover:underline select-none ${isPlaying ? 'text-red-400' : ''}`} 
                              onClick={() => {speakText();}}
                            >
                              {isPlaying ? 'Stop' : 'Speak'}
                            </button>
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
                    <Image src={assets.translate_icon} alt="" className="h-9 w-9 p-1 border border-white/15 rounded-full select-none"/>
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
            onClick={(e) => sendPrompt(e, 'translate')}
            className="hover:underline cursor-pointer select-none"
          >
            Translate
          </button>
          <button
            onClick={(e) => sendPrompt(e, 'explain')}
            className="hover:underline cursor-pointer select-none"
          >
            Explain
          </button>
          <button
            onClick={() => speakTextHighlighted()}
            className="hover:underline cursor-pointer select-none"
          >
            Speak
          </button>
        </div>
      )}
    </div>
  )
}

export default Message;