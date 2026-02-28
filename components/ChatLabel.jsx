import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

import three_dots from "@/assets/three_dots.svg";
import rename_icon from "@/assets/rename_icon.svg";
import delete_icon from "@/assets/delete_icon.svg";
import toast from "react-hot-toast";

const assets = {
  three_dots,
  rename_icon,
  delete_icon,
};

const ChatLabel = ({ openMenu, setOpenMenu, id, name }) => {
  const menuRef = useRef(null);
  const { user } = useUser();

  useEffect(() => {
    if (!(openMenu.id === id && openMenu.open)) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu({ id: 0, open: false });
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenu.id, openMenu.open, id, setOpenMenu]);
  const { fetchUsersChats, chats, setSelectedChat, selectedChat } =
    useAppContext();

  const selectChat = () => {
    const chatData = chats.find((chat) => chat._id === id);
    setSelectedChat(chatData);
    console.log(chatData);
  };

  const renameHandler = async () => {
    try {
      const newName = prompt("Enter New Name");
      if (!newName) return;
      const { data } = await axios.post("/api/chat/rename", {
        chatId: id,
        name: newName,
      });
      if (data.success) {
        fetchUsersChats(false);
        setOpenMenu({ id: 0, open: false });
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteHandler = async () => {
    try {
      const confirm = window.confirm(
        "Are you sure you want to delete this chat?"
      );
      if (!confirm) return;
      const { data } = await axios.post("/api/chat/delete", { chatId: id });
      if (data.success) {
        fetchUsersChats(false);
        setOpenMenu({ id: 0, open: false });
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div
      onClick={selectChat}
      className={`flex items-center justify-between p-2 text-white/80 hover:bg-white/10 rounded-lg text-sm cursor-pointer mb-2 transition-colors duration-100 ${
        (openMenu.id === id && openMenu.open) || selectedChat?._id === id
          ? "bg-white/10"
          : ""
      }`}
    >
      <p className="group-hover:max-w-5/6 truncate cursor-pointer transition-colors duration-100">{name}</p>
      {user && (
        <div
          ref={menuRef}
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenu({ id: id, open: !openMenu.open });
          }}
          className={`group relative flex items-center justify-center h-6 w-6 aspect-square hover:bg-black/30 rounded-lg transition-colors duration-100 ${
            openMenu.id === id && openMenu.open ? "bg-black/30" : ""
          }`}
        >
          <Image
            src={assets.three_dots}
            alt=""
            className="w-4 cursor-pointer select-none transition-colors duration-100"
          />

          <div
            className={`absolute -right-0 top-6 bg-[#252525] rounded-xl w-max p-2 z-10 transition-opacity duration-100 ${
              openMenu.id === id && openMenu.open
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div
              onClick={renameHandler}
              className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer transition-all duration-100"
            >
              <Image
                src={assets.rename_icon}
                alt=""
                className="w-4 select-none"
              />
              <p>Rename</p>
            </div>
            <div
              onClick={deleteHandler}
              className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
            >
              <Image
                src={assets.delete_icon}
                alt=""
                className="w-4 select-none"
              />
              <p>Delete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLabel;
