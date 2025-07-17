import React, { useEffect } from "react";
import Image from 'next/image';
import Markdown from "react-markdown";
import Prism from "prismjs";

import copy_icon from '@/assets/copy_icon.svg';
import pencil_icon from '@/assets/pencil_icon.svg';
import regenerate_icon from '@/assets/regenerate_icon.svg';
import like_icon from '@/assets/like_icon.svg';
import dislike_icon from '@/assets/dislike_icon.svg';
import logo_icon from '@/assets/logo_icon.svg';
import toast from "react-hot-toast";

const assets = {
  copy_icon,
  pencil_icon,
  regenerate_icon,
  like_icon,
  dislike_icon,
  logo_icon
};

const Message = ({role, content}) => {

  useEffect(()=>{
    Prism.highlightAll()
  }, [content])

  const copyMessage = ()=> {
    navigator.clipboard.writeText(content)
    toast.success("Message Copied to Clipboard")
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl text-base">
      <div className={`flex flex-col w-full mb-8 ${role === 'user' && 'items-end'}`}>
        <div className={`group relative flex max-w-2xl py-3 rounded-xl ${role === 'user' ? 'bg-[#2a2a2a] px-5' : 'gap-3'}`}>
            <div className={`absolute ${role === 'user' ? '-left-7 top-1/2 -translate-y-1/2' : 'left-12.5 -bottom-4'} transition-all`}>
                <div className="flex items-center gap-2 opacity-70">
                    {
                        role === 'user' ? (
                            <>
                            <Image onClick={copyMessage} src={assets.copy_icon} alt="" className="w-4 cursor-pointer"/>
                            {/* <Image src={assets.pencil_icon} alt="" className="w-4.5 cursor-pointer"/> */}
                            </>
                        ):(
                            <>
                            <Image onClick={copyMessage} src={assets.copy_icon} alt="" className="w-4.5 cursor-pointer"/>
                            <Image src={assets.regenerate_icon} alt="" className="w-4 cursor-pointer"/>
                            </>
                        )
                    }
                </div>
            </div>
            {
                role === 'user' ? 
                (
                    <span className="text-white/90">{content}</span>
                )
                :
                (
                    <>
                    <Image src={assets.logo_icon} alt="" className="h-9 w-9 p-1 border border-white/15 rounded-full"/>
                    <div className="space-y-4 w-full overflow-scroll">
                      <Markdown>{content}</Markdown>
                    </div>
                    </>
                )
            }
        </div>
      </div>
    </div>
  )
}

export default Message
