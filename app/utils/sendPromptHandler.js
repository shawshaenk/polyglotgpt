import axios from "axios";
import { toast } from "react-hot-toast";

let isProcessing = false;
let needToNameChat = false;

export const sendPromptHandler = async ({
  e,
  prompt,
  setPrompt = () => { },
  setIsLoading,
  setChats,
  setSelectedChat,
  selectedChat,
  user,
  setPrevNativeLang,
  prevNativeLang,
  prevTargetLang,
  nativeLang,
  setPrevTargetLang,
  targetLang,
  fetchUsersChats,
  regenerate = false,
  relevantUserMessage,
  editingMessage = false,
  messageIndex,
  startResponse,
  stopResponse,
  addPopupMessage = false,
  AIpopupMessage = null,
  preventMessageSendRef
}) => {
  if (preventMessageSendRef.current) {
    toast.error("Wait For Operation To Complete");
    return;
  }

  if (addPopupMessage) {
    const userPrompt = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat._id === selectedChat._id
          ? { ...chat, messages: [...chat.messages, userPrompt] }
          : chat
      )
    );

    setSelectedChat((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), userPrompt],
    }));

    const fullAssistantMessage = {
      role: "model",
      content: AIpopupMessage,
      timestamp: Date.now(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat._id === selectedChat._id
          ? { ...chat, messages: [...chat.messages, fullAssistantMessage] }
          : chat
      )
    );

    setSelectedChat((prev) => ({
      ...prev,
      messages: [...prev.messages, fullAssistantMessage],
    }));

    if (user) {
      const payload = {
        chatId: selectedChat._id,
        userPrompt,
        fullAssistantMessage
      };
      const { data } = await axios.post("/api/chat/addPopupMessage", payload);
      if (data.success) {
        fetchUsersChats();
      }
    }

    return;
  }

  if (!prompt && !regenerate) return toast.error("Enter a Prompt");

  if (selectedChat.messages.length === 0) {
    needToNameChat = true;
  }

  if (isProcessing) {
    toast.error("Another Message In Progress");
    return;
  }
  isProcessing = true;

  let promptCopy = prompt;

  try {
    e.preventDefault();

    if (regenerate) {
      prompt = relevantUserMessage;
      promptCopy = relevantUserMessage;
    }

    setIsLoading(true);
    setPrompt("");

    const userPrompt = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    if (!regenerate) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: [...chat.messages, userPrompt] }
            : chat
        )
      );

      setSelectedChat((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), userPrompt],
      }));
    }

    let isLocal = false;
    let languagesUpdated = false;

    if (prevNativeLang !== nativeLang || prevTargetLang !== targetLang) {
      languagesUpdated = true;
      setPrevNativeLang(nativeLang);
      setPrevTargetLang(targetLang);
    }

    let updatedMessages = selectedChat.messages;
    if (regenerate || editingMessage) {
      if (regenerate) {
        updatedMessages = selectedChat.messages.slice(0, messageIndex);
      } else if (editingMessage) {
        updatedMessages = [
          ...selectedChat.messages.slice(0, messageIndex),
          userPrompt,
        ];
      }

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: updatedMessages }
            : chat
        )
      );

      setSelectedChat((prev) => ({
        ...prev,
        messages: updatedMessages,
      }));
    }

    const payload = {
      chatId: selectedChat._id,
      prompt,
      nativeLang,
      targetLang,
      isLocal,
      languagesUpdated,
      regenerate,
      editingMessage,
      messageIndex,
    };

    // Local (not logged in) chat sends full history
    if (!user) {
      if (!regenerate) {
        payload.messages = [...selectedChat.messages, userPrompt];
      } else {
        payload.messages = updatedMessages;
      }
      payload.isLocal = true;
    }

    // If provided, start response generation and get abort signal
    let signal;
    try {
      signal = startResponse ? startResponse() : undefined;
    } catch (err) {
      // ignore
    }
    const axiosConfig = signal ? { signal } : {};
    const { data } = await axios.post("/api/chat/ai", payload, axiosConfig);

    if (data.success) {
      const fullAssistantMessage = {
        role: "model",
        content: data.response,
        timestamp: Date.now(),
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: [...chat.messages, fullAssistantMessage] }
            : chat
        )
      );

      setSelectedChat((prev) => ({
        ...prev,
        messages: [...prev.messages, fullAssistantMessage],
      }));

      if (user) {
        fetchUsersChats();
      }

      stopResponse();
      setIsLoading(false);
      isProcessing = false;

      if (needToNameChat) {
        needToNameChat = false;
        let { data: nameData } = await axios.post("/api/chat/autoNameChat", {
          prompt: promptCopy,
        });
        if (nameData.success) {
          let newChatName = nameData.response
          setSelectedChat((prev) => ({ ...prev, name: newChatName }));
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat._id === selectedChat._id
                ? { ...chat, name: newChatName }
                : chat
            )
          );
          if (user) {
            const { data: renameData } = await axios.post("/api/chat/rename", {
              chatId: selectedChat._id,
              name: newChatName,
            });

            if (renameData.success) {
              fetchUsersChats(false);
            }
          }
        }
      }
    } else {
      toast.error(data.message);
      setPrompt(promptCopy);
    }
  } catch (error) {
    // If request was cancelled, axios throws a CanceledError with code 'ERR_CANCELED'
    const isCanceled =
      error?.code === "ERR_CANCELED" ||
      error?.name === "CanceledError" ||
      error?.message === "canceled";

    if (isCanceled) {
      // Add "You cancelled this response." message to the chat
      const abortMessage = {
        role: "model",
        content: "*You cancelled this response.*",
        timestamp: Date.now(),
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: [...chat.messages, abortMessage] }
            : chat
        )
      );

      setSelectedChat((prev) => ({
        ...prev,
        messages: [...prev.messages, abortMessage],
      }));

      // Sync server DB: Check if the server had already saved the full reply before
      // detecting abort. If it did, replace it with "*You cancelled this response.*" so the next
      // fetch doesn't bring the old reply back.
      if (user && selectedChat._id && selectedChat._id !== "temp-local-chat") {
        try {
          setIsLoading(false);
          await axios.post("/api/chat/markLastMessageAborted", {
            chatId: selectedChat._id,
          });
        } catch (syncErr) {
          // Non-blocking; local UI is already correct
        }
      }
    } else {
      toast.error(error.message);
      setPrompt(promptCopy);
    }
  } finally {
    setIsLoading(false);
    try {
      stopResponse();
    } catch (e) { }
    isProcessing = false;
  }
};
