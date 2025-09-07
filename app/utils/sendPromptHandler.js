import axios from 'axios';
import { toast } from 'react-hot-toast';

let isProcessing = false;

export const sendPromptHandler = async ({
  e,
  prompt,
  setPrompt = () => {},
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
  regenerate=false,
  relevantUserMessage,
  editingMessage=false,
  messageIndex
}) => {
  if (isProcessing) {
    toast.error("Another Message in Progress");
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

    if (!prompt && !regenerate) return toast.error('Enter a Prompt');

    setIsLoading(true);
    setPrompt('');
    
    const userPrompt = {
      role: 'user',
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
          userPrompt
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
      messageIndex
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

    const { data } = await axios.post('/api/chat/ai', payload);

    if (data.success) {
      const fullAssistantMessage = {
        role: 'model',
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
    } else {
      toast.error(data.message);
      setPrompt(promptCopy);
    }
  } catch (error) {
    toast.error(error.message);
    setPrompt(promptCopy);
  } finally {
    setIsLoading(false);
    isProcessing = false;
  }
};
