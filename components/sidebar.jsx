'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useClerk, useAuth, UserButton } from "@clerk/nextjs";
import { useAppContext } from '@/context/AppContext';
import { toast } from 'react-hot-toast';

import menu_icon from '@/assets/menu_icon.svg';
import sidebar_icon from '@/assets/sidebar_icon.svg';
import sidebar_close_icon from '@/assets/sidebar_close_icon.svg';
import chat_icon from '@/assets/chat_icon.svg';
import chat_icon_dull from '@/assets/chat_icon_dull.svg';
import profile_icon from '@/assets/profile_icon.svg';
import ChatLabel from './ChatLabel';

const assets = {
  menu_icon,
  sidebar_icon,
  sidebar_close_icon,
  chat_icon, 
  chat_icon_dull, 
  profile_icon
};

const Sidebar = ({ expand, setExpand }) => {
  
  const {openSignIn} = useClerk()
  const {user, chats, createNewChat} = useAppContext()
  const [openMenu, setOpenMenu] = useState({id: 0, open: false})

  const { isSignedIn } = useAuth();
  const clerk = useClerk();

  const chatButtonAction = () => {
    if (!isSignedIn && clerk) {
        toast.error('Login to create new chat')
        clerk.openSignIn();
        return;
    }
    createNewChat();
  }

  return (
    <div
      className={`flex flex-col justify-between bg-[#2a2a2a] pt-7 transition-all z-50 max-md:absolute max-md:h-screen ${
        expand ? 'p-4 w-64' : 'md:w-20 w-0 max-md:overflow-hidden'}`}>
      <div>
        <div className={`flex ${expand ? "flex-row justify-end px-4" : "flex-col items-center gap-8"}`}>
          {/* <Image className={expand ? "w-36" : "w-10"} src={expand ? assets.logo_text : assets.logo_icon} alt="Logo" /> */}

          <div onClick={()=> expand ? setExpand(false) : setExpand(true)}
          className="group relative flex items-center justify-center hover:bg-gray-500 transition-all duration-300 h-9 w-9 aspect-square rounded-lg cursor-pointer">
            <Image src={assets.menu_icon} alt="Menu" className="md:hidden" />
            <Image
              src={expand ? assets.sidebar_close_icon : assets.sidebar_icon}
              alt="Toggle"
              className="hidden md:block w-7"
            />
            <div className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none ${expand ? 'w-30' : 'w-29'}`}>
                {expand ? "Close Sidebar" : "Open Sidebar"}
                <div className="w-3 h-3 absolute bg-black rotate-45 left-1.5 -translate-x-full top-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>

        <button onClick={chatButtonAction} className={`${expand ? "absolute top-5.5 left-7 bg-primary hover:opacity-90 rounded-2xl gap-2 p-2.5" : "mt-6 left-6 group relative flex items-center justify-center hover:bg-gray-500 transition-all duration-300 h-9 w-9 aspect-square rounded-lg cursor-pointer"} flex items-center cursor-pointer`}>
          <Image className={expand ? 'w-6' : 'w-7'} src={expand ? assets.chat_icon : assets.chat_icon_dull} alt=""/>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none w-23">
            New Chat
            <div className="w-3 h-3 absolute bg-black rotate-45 left-1.5 -translate-x-full top-1/2 -translate-y-1/2"></div>
          </div>
          {expand && <p className="text-white text font-medium">New Chat</p>}
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
            user ? <UserButton/> : <Image src={assets.profile_icon} alt="" className="w-7"/>
          }
          {expand && <span className="mt-1">{user ? "My Profile" : "Log In"}</span>}
        </div>
      </div>

    </div>
  );
};

export default Sidebar;
