import React, { useState } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import { useAppContext } from "@/context/AppContext";

import delete_icon from "@/assets/delete_icon.svg";

const assets = {
  delete_icon,
};

const SavedItemLabel = ({ item, showLanguage }) => {
  const { deleteSavedItem, languageList } = useAppContext();
  const [expanded, setExpanded] = useState(false);

  const langLabel =
    languageList.find((l) => l.code === item.targetLang)?.label ||
    item.targetLang;

  return (
    <div className="mb-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-100">
      <div
        onClick={() => setExpanded((prev) => !prev)}
        className="group flex items-center justify-between p-2 text-white/80 text-sm cursor-pointer"
      >
        <div className="flex items-center min-w-0 flex-1" title={item.text}>
          <span className="truncate select-none">{item.text}</span>
          {showLanguage && (
            <span className="text-white/30 ml-1.5 flex-shrink-0 select-none">
              ({langLabel})
            </span>
          )}
        </div>
        <Image
          onClick={(e) => {
            e.stopPropagation();
            deleteSavedItem(item._id);
          }}
          src={assets.delete_icon}
          alt=""
          title="Remove"
          className="w-3.5 select-none opacity-0 group-hover:opacity-70 hover:opacity-100 transition-all duration-100 flex-shrink-0 ml-2"
        />
      </div>
      {expanded && (
        <div className="px-3 pb-3 -mt-1 text-white/70 text-xs space-y-2 [&_strong]:text-white/90">
          <Markdown>{item.overview}</Markdown>
        </div>
      )}
    </div>
  );
};

export default SavedItemLabel;
