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
  nativeLang,
  targetLang,
  clerk,
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

    let isLocal = false

    const payload = {
      chatId:    selectedChat._id,
      prompt,
      nativeLang,
      targetLang,
      isLocal
    };
    // if this is a local chat, send the full history
    if (!user) {
      payload.messages = [...selectedChat.messages, userPrompt]; // ✅ include the latest message
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
