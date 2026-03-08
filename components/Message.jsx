import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import Prism from "prismjs";
import { useAppContext } from "@/context/AppContext";
import { sendPromptHandler } from "@/app/utils/sendPromptHandler";

import copy_icon from "@/assets/copy_icon.svg";
import rename_icon from "@/assets/rename_icon.svg";
import polyglotgpt_chat_icon from "@/assets/polyglotgpt_logo.png";
import regenerate_icon from "@/assets/regenerate_icon.svg";
import toast from "react-hot-toast";
import axios from "axios";

const assets = {
  copy_icon,
  rename_icon,
  polyglotgpt_chat_icon,
  regenerate_icon,
};

const Message = ({
  role,
  content,
  setIsLoading,
  relevantUserMessage,
  messageIndex,
}) => {
  const [selectionText, setSelectionText] = useState("");
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [popupMode, setPopupMode] = useState("default"); 
  const [popupResult, setPopupResult] = useState("");
  const [popupAction, setPopupAction] = useState("translate");
  const [translatedText, setTranslatedText] = useState(null);
  const [transliteratedText, setRomanizedText] = useState(null);
  const [aiMessage, setAiMessage] = useState(content);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const popupRef = useRef(null);
  const containerRef = useRef(null);
  const messageWrapperRef = useRef(null);
  const selectionTextRef = useRef("");
  const isDismissingRef = useRef(false);

  const {
    user,
    setChats,
    selectedChat,
    setSelectedChat,
    nativeLang,
    targetLang,
    fetchUsersChats,
    setPrevNativeLang,
    setPrevTargetLang,
    prevNativeLang,
    prevTargetLang,
    setPrompt,
    setEditingMessage,
    setEditingMessageIndex,
    startResponse,
    stopResponse,
    setIsGenerating,
  } = useAppContext();

  useEffect(() => {
    selectionTextRef.current = selectionText;
  }, [selectionText]);

  useEffect(() => {
    Prism.highlightAll();

    const handleMouseDown = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        selectionTextRef.current
      ) {
        isDismissingRef.current = true;
        setSelectionText("");
        setPopupMode("default");
        setPopupResult("");
      }
    };

    const handleMouseUp = (event) => {
      if (popupRef.current && popupRef.current.contains(event.target)) return;

      if (isDismissingRef.current) {
        isDismissingRef.current = false;
        return;
      }

      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (
        selectedText.length > 0 &&
        containerRef.current?.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const parentRect = messageWrapperRef.current.getBoundingClientRect();

        let newX = rect.left - parentRect.left;
        let newY = rect.top - parentRect.top;

        if (popupRef.current) {
          const popupWidth = popupRef.current.offsetWidth;
          const popupHeight = popupRef.current.offsetHeight;

          newX += rect.width / 2 - popupWidth / 2;
          newY -= popupHeight + 10;
        } else {
          newX += rect.width / 2 - 75;
          newY -= 50;
        }

        setSelectionText(selectedText);
        setPopupPos({ x: newX, y: newY });
      } else {
        if (popupRef.current && !popupRef.current.contains(event.target)) {
          setSelectionText("");
          setPopupMode("default");
          setPopupResult("");
        }
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
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

  //Whenever content changes, reset translated and transliterated text
  useEffect(() => {
    setAiMessage(content);
    setTranslatedText(null);
    setRomanizedText(null);
  }, [content, nativeLang, targetLang]);

  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  const copyMessage = () => {
    navigator.clipboard.writeText(aiMessage);
    toast.success("Message Copied to Clipboard");
  };

  const copyPopup = () => {
    navigator.clipboard.writeText(popupResult);
    toast.success("Popup Copied to Clipboard");
  };

  const editMessage = () => {
    setPrompt(relevantUserMessage);
    setEditingMessage(true);
    setEditingMessageIndex(messageIndex);
  };

  const regenerateMessage = (e) => {
    let regenerate = true;
    sendPromptHandler({
      e,
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
      regenerate,
      messageIndex,
      startResponse,
      stopResponse,
      setIsGenerating,
    });
  };

  const translateText = async () => {
    if (translatedText) {
      setAiMessage(translatedText);
      toast.success("Translated!");
      return;
    }

    const toastId = toast.loading("Translating...");
    const translatedTextCopy = content;

    const { data } = await axios.post("/api/chat/translate", {
      translatedTextCopy,
      nativeLang,
      targetLang
    });

    if (data.success) {
      setTranslatedText(data.response);
      setAiMessage(data.response);
      toast.success("Translated!", { id: toastId });
    } else {
      toast.error(data.message);
    }
  };

  const translateTextPopup = async () => {
    Prism.highlightAll();
    setPopupMode("processing");
    setPopupAction("translate")

    const translatedTextCopy = "Taking this into context: " + content + "\n\nTranslate this: " + selectionText;

    const { data } = await axios.post("/api/chat/translate", {
      translatedTextCopy,
      nativeLang,
      targetLang
    });

    if (data.success) {
      setPopupResult(selectionText + " ➔ " + data.response);
      setPopupMode("result");
    } else {
      toast.error(data.message);
    }
  }

  const explainTextPopup = async () => {
    Prism.highlightAll();
    setPopupMode("processing");
    setPopupAction("explain")

    const translatedTextCopy = "Taking this into context: " + content + "\n\nExplain this: " + selectionText;

    const { data } = await axios.post("/api/chat/explain", {
      translatedTextCopy,
      nativeLang,
      targetLang
    });

    if (data.success) {
      setPopupResult(data.response);
      setPopupMode("result");
    } else {
      toast.error(data.message);
    }
  }

  const transliterateText = async () => {
    if (transliteratedText) {
      setAiMessage(transliteratedText);
      toast.success("Transliterated!");
      return;
    }

    const toastId = toast.loading("Transliterating...");
    const transliteratedTextCopy = content;

    const { data } = await axios.post("/api/chat/transliterate", {
      transliteratedTextCopy,
    });

    if (data.success) {
      setRomanizedText(data.response);
      setAiMessage(data.response);
      toast.success("Transliterated!", { id: toastId });
    } else {
      toast.error(data.message);
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
      toast.success("Stopped Speaking");
    }
  };

  const speakText = async () => {
    if (currentAudio) {
      stopSpeaking();
      return;
    }

    const toastId = toast.loading("Processing...");
    const speakTextCopy = content;

    try {
      const { data } = await axios.post("/api/chat/speak", {
        speakTextCopy,
        nativeLang,
        targetLang,
      });

      if (data.success) {
        const audioSrc = `data:${data.contentType};base64,${data.audioContent}`;
        const audio = new Audio(audioSrc);

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

  const speakTextHighlighted = async () => {
    if (currentAudio) {
      stopSpeaking();
      return;
    }

    const toastId = toast.loading("Processing...");
    const speakTextCopy = selectionText;

    try {
      const { data } = await axios.post("/api/chat/speak", {
        speakTextCopy,
        targetLang,
      });

      if (data.success) {
        const audioSrc = `data:${data.contentType};base64,${data.audioContent}`;
        const audio = new Audio(audioSrc);

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

  const showOriginalContent = () => {
    setAiMessage(content);
    toast.success("Original Message Restored");
  };

  const sendPrompt = (e) => {
    let promptToSend = "";
    if (popupAction === "translate") {
      promptToSend = `Translate "${selectionText}"`;
    } else if (popupAction === "explain") {
      promptToSend = `Explain "${selectionText}"`;
    }

    sendPromptHandler({
      e,
      prompt: promptToSend,
      setChats,
      selectedChat,
      setSelectedChat,
      fetchUsersChats,
      user,
      addPopupMessage: true,
      AIpopupMessage: popupResult,
    });
  };

  return (
    <div
      ref={messageWrapperRef}
      className={`relative flex flex-col items-center w-full max-w-3xl text-base ${
        role === "user" ? "mb-5 mt-5" : "mb-5 mt-5"
      }`}
    >
      <div
        className={`flex flex-col w-full mb-8 ${
          role === "user" && "items-end"
        }`}
      >
        <div
          className={`group relative flex max-w-2xl py-3 rounded-xl ${
            role === "user"
              ? "bg-[#1e1e1e] px-5 mt-2 max-w-[75vw] sm:max-w-[30vw]"
              : "-mt-6 gap-3"
          }`}
        >
          <div
            className={`absolute -left-12 ${
              role === "user"
                ? "top-1/2 -translate-y-1/2"
                : "left-12.5 -bottom-3.5"
            }`}
          >
            <div className="flex items-center gap-2 opacity-70">
              {role === "user" ? (
                <>
                  <Image
                    onClick={copyMessage}
                    src={assets.copy_icon}
                    alt=""
                    className="w-4 cursor-pointer select-none hover:opacity-60 transition-all duration-100"
                    title="Copy Message"
                  />
                  <Image
                    onClick={editMessage}
                    src={assets.rename_icon}
                    alt=""
                    className="w-4 cursor-pointer select-none hover:opacity-60 transition-all duration-100"
                    title="Edit Message"
                  />
                </>
              ) : (
                <>
                  <Image
                    onClick={copyMessage}
                    src={assets.copy_icon}
                    alt=""
                    className="w-4 cursor-pointer select-none hover:opacity-60 transition-all duration-100"
                    title="Copy Message"
                  />
                  <Image
                    onClick={regenerateMessage}
                    src={assets.regenerate_icon}
                    alt=""
                    className="w-4 cursor-pointer select-none hover:opacity-60 transition-all duration-100"
                    title="Regenerate Message"
                  />
                  <button
                    className="text-xs sm:text-sm cursor-pointer hover:underline select-none"
                    onClick={() => {
                      showOriginalContent();
                    }}
                  >
                    Show Original
                  </button>
                  <button
                    className="text-xs sm:text-sm cursor-pointer hover:underline select-none"
                    onClick={() => {
                      translateText();
                    }}
                  >
                    Translate
                  </button>
                  <button
                    className="text-xs sm:text-sm cursor-pointer hover:underline select-none"
                    onClick={() => {
                      transliterateText();
                    }}
                  >
                    Transliterate
                  </button>
                  <button
                    className={`text-xs sm:text-sm cursor-pointer hover:underline select-none ${
                      isPlaying ? "text-red-400" : ""
                    }`}
                    onClick={() => {
                      speakText();
                    }}
                  >
                    {isPlaying ? "Stop" : "Speak"}
                  </button>
                </>
              )}
            </div>
          </div>
          {role === "user" ? (
            <span className={`text-white/90 break-words overflow-hidden`}>
              {content}
            </span>
          ) : (
            <>
              <Image
                src={assets.polyglotgpt_chat_icon}
                alt=""
                className="h-9 w-9 p-1 border border-white/15 rounded-full select-none"
              />
              <div
                ref={containerRef}
                className="space-y-4 mt-2 w-full overflow-visible break-words max-w-[60vw]"
              >
                <Markdown>{aiMessage}</Markdown>
              </div>
            </>
          )}
        </div>
      </div>
      {selectionText && (
        <div
          ref={popupRef}
          className="absolute z-50 bg-[#1e1e1e] text-white text-sm px-3 py-2 rounded-lg shadow-lg flex gap-2"
          style={{ top: popupPos.y, left: popupPos.x, maxHeight: "250px", overflowY: "auto" }}
        >
        
        {popupMode === "default" && (
            <>
            <button
              onClick={translateTextPopup}
              className="hover:underline cursor-pointer"
            >
              Translate
            </button>
            <button
              onClick={explainTextPopup}
              className="hover:underline cursor-pointer"
            >
              Explain
            </button>
            <button
              onClick={() => speakTextHighlighted()}
              className="hover:underline cursor-pointer"
            >
              Speak
            </button>
            </>
        )}

        {popupMode === "processing" && (
          <div className="loader flex justify-center items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
          </div>
        )}

        {popupMode === "result" && (
          <div className="flex flex-col gap-2 max-w-[250px] overflow-y-auto">
            <Markdown>
              {popupResult}
            </Markdown>

            <hr className="border-t border-gray-300 my-0.5" />

            <div className="flex gap-3 justify-center">
              <button
                onClick={copyPopup}
                className="hover:underline cursor-pointer"
              >
                Copy
              </button>

              <button
                onClick={(e) => sendPrompt(e)}
                className="hover:underline cursor-pointer"
              >
                Add to Chat
              </button>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default Message;
