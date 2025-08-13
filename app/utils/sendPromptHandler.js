import axios from 'axios';
import { toast } from 'react-hot-toast';

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
  fetchUsersChats
}) => {
  const promptCopy = prompt;

  try {
    e.preventDefault();

    if (!prompt) return toast.error('Enter a Prompt');

    setIsLoading(true);
    setPrompt('');

    const userPrompt = {
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    // Add prompt to UI state immediately
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

    let isLocal = false;
    let languagesUpdated = false;

    if (prevNativeLang !== nativeLang || prevTargetLang !== targetLang) {
      languagesUpdated = true;
      setPrevNativeLang(nativeLang);
      setPrevTargetLang(targetLang);
    }

    const payload = {
      chatId: selectedChat._id,
      prompt,
      nativeLang,
      targetLang,
      isLocal,
      languagesUpdated
    };

    // Local (not logged in) chat sends full history
    if (!user) {
      payload.messages = [...selectedChat.messages, userPrompt];
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
  }
};
