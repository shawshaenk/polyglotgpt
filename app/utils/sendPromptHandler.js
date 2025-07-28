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
}) => {
  const promptCopy = prompt;

  try {
    e.preventDefault();

    if (!user) {
      toast.error('Login to send message');
      clerk.openSignIn();
      return;
    }

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

    const { data } = await axios.post('/api/chat/ai', {
      chatId: selectedChat._id,
      prompt,
      nativeLang,
      targetLang,
    });

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
