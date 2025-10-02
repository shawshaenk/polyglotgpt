'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useClerk, useAuth, UserButton } from "@clerk/nextjs";
import { useAppContext } from '@/context/AppContext';

import menu_icon from '@/assets/menu_icon.svg';
import sidebar_icon from '@/assets/sidebar_icon.svg';
import chat_icon from '@/assets/chat_icon.svg';
import profile_icon from '@/assets/profile_icon.svg';
import delete_icon from '@/assets/delete_icon.svg';
import ChatLabel from './ChatLabel';
import toast from 'react-hot-toast';
import axios from 'axios';

const assets = {
  menu_icon,
  sidebar_icon,
  chat_icon, 
  profile_icon,
  delete_icon
};

const Sidebar = ({ expand, setExpand }) => {
  const {openSignIn} = useClerk()
  const {user, chats, chatButtonAction, fetchUsersChats, allChatIds} = useAppContext()
  const [openMenu, setOpenMenu] = useState({id: 0, open: false})
  const sidebarRef = useRef(null)

  const deleteAllMessages = async () => {
    try {
      const confirm = window.confirm("Are you sure you want to delete ALL CHATS?");
      if (!confirm) return;

      if (!allChatIds.length) return toast.error("No Chats to Delete");

    const toastId = toast.loading("Deleting Chats...");
      for (const chatId of allChatIds) {
        await axios.post("/api/chat/delete", { chatId });
      }

      fetchUsersChats(false);
      setOpenMenu({ id: 0, open: false });
      toast.success("All Chats Deleted!", { id: toastId });
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Add click outside handler to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close menu if it's currently open and the click is outside the sidebar
      if (openMenu.open && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpenMenu({id: 0, open: false});
      }
    };

    // Add event listeners for both mouse and touch events
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    // Cleanup function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [openMenu.open]); // Only re-run when openMenu.open changes

  return (
    <div
      ref={sidebarRef}
      className={`flex flex-col justify-between bg-[#2a2a2a] pt-7 transition-all z-50 max-md:absolute max-md:h-screen ${
        expand ? 'p-4 w-64' : 'md:w-20 w-0 max-md:overflow-hidden'}`}>
      <div>
        <div className={`flex ${expand ? "flex-row justify-end px-4" : "flex-col items-center gap-8"}`}>
          {/* <Image className={expand ? "w-36" : "w-10"} src={expand ? assets.logo_text : assets.logo_icon} alt="Logo" /> */}

          <div onClick={()=> expand ? setExpand(false) : setExpand(true)}
          className="group relative flex items-center justify-center hover:bg-gray-500 transition-all duration-300 h-9 w-9 aspect-square rounded-lg cursor-pointer">
            <Image src={assets.menu_icon} alt="Menu" className="md:hidden select-none" />
            <Image
              src={assets.sidebar_icon}
              alt="Toggle"
              className="hidden md:block w-7 select-none"
            />
            <div className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none ${expand ? 'w-30' : 'w-29'}`}>
                {expand ? "Close Sidebar" : "Open Sidebar"}
                <div className="w-3 h-3 absolute bg-black rotate-45 left-1.5 -translate-x-full top-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>

        <button onClick={chatButtonAction} className={`${expand ? "absolute top-5.5 left-7 bg-primary hover:opacity-90 rounded-xl gap-2 p-2.5" : "mt-6 left-6 group relative flex items-center justify-center hover:bg-gray-500 transition-all duration-300 h-9 w-9 aspect-square rounded-lg cursor-pointer"} flex items-center cursor-pointer`}>
          <Image className={expand ? 'w-6 select-none' : 'w-7 select-none'} src={assets.chat_icon} alt=""/>
          <div className="absolute select-none left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none w-23">
            New Chat
            <div className="w-3 h-3 absolute bg-black rotate-45 left-1.5 -translate-x-full top-1/2 -translate-y-1/2"></div>
          </div>
          {expand && <p className="text-white text font-medium select-none">New Chat</p>}
        </button>
      </div>

      {/* Chat list section - takes up remaining space */}
      <div className={`flex-1 mt-4 text-white/25 text-sm ${expand ? "block" : "hidden"} overflow-y-auto min-h-0`}>
        <p className="my-1 mb-2">Chats</p>
        {chats.map((chat, index)=><ChatLabel key={index} name={chat.name} id={chat._id} openMenu={openMenu} setOpenMenu={setOpenMenu}/>)}
      </div>

      {/* Profile section - always visible at bottom */}
      <div className="flex-shrink-0 pb-4">
        <div onClick={user ? null : openSignIn}
        className={`flex items-center ${expand ? 'hover:bg-white/10 rounded-lg -mb-4' : 'justify-center w-full'} gap-3 text-white/60 text-sm p-2 cursor-pointer`}>
          {
            user ? <UserButton/> : <Image src={assets.profile_icon} alt="" className="w-7 select-none"/>
          }
          {expand && <span>{user ? "My Profile" : "Log In"}</span>}
          {user && expand && <Image onClick={deleteAllMessages} src={assets.delete_icon} alt="" title="Delete All Chats" className="w-5 select-none mb-0.5 ml-17"/>}
        </div>
      </div>

    </div>
  );
};

export default Sidebar;