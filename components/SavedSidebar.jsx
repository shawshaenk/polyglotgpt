"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import SavedItemLabel from "./SavedItemLabel";

import bookmark_icon from "@/assets/bookmark_icon.svg";

const assets = {
  bookmark_icon,
};

const SavedSidebar = ({ expand, setExpand }) => {
  const { savedItems, languageList } = useAppContext();
  const [langFilter, setLangFilter] = useState("all");

  const savedLanguages = useMemo(() => {
    const codes = [...new Set(savedItems.map((item) => item.targetLang))];
    return codes
      .map((code) => ({
        code,
        label: languageList.find((l) => l.code === code)?.label || code,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [savedItems, languageList]);

  useEffect(() => {
    if (langFilter !== "all" && !savedLanguages.some((l) => l.code === langFilter)) {
      setLangFilter("all");
    }
  }, [savedLanguages, langFilter]);

  const filteredItems =
    langFilter === "all"
      ? savedItems
      : savedItems.filter((item) => item.targetLang === langFilter);

  const words = filteredItems.filter((item) => item.type === "word");
  const phrases = filteredItems.filter((item) => item.type === "phrase");

  return (
    <div
      className={`flex flex-col bg-[#1e1e1e] pt-7 transition-all z-50 max-md:absolute max-md:right-0 max-md:h-screen ${
        expand ? "p-4 w-64" : "md:w-20 w-0 max-md:overflow-hidden"
      }`}
    >
      <div
        className={`flex ${
          expand ? "flex-row justify-start -ml-2" : "flex-col items-center"
        }`}
      >
        <div
          onClick={() => (expand ? setExpand(false) : setExpand(true))}
          className="group relative flex items-center justify-center hover:bg-gray-500 h-9 w-9 aspect-square rounded-lg cursor-pointer"
        >
          <Image
            src={assets.bookmark_icon}
            alt="Toggle"
            className="w-7 select-none"
          />
          <div
            className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap`}
          >
            {expand ? "Close Saved" : "Open Saved"}
            <div className="w-3 h-3 absolute bg-black rotate-45 right-1.5 translate-x-full top-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      </div>

      {expand && (
        <div className="flex-1 mt-4 text-white/25 text-sm overflow-y-auto min-h-0">
          {savedLanguages.length > 0 && (
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="bg-[#2e2e2e] text-white rounded-lg w-full mb-4 focus:outline-none focus:ring-0 focus:border-transparent p-3 cursor-pointer"
            >
              <option value="all">All Languages</option>
              {savedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          )}

          <p className="my-1 mb-2 select-none">Words</p>
          {words.length === 0 ? (
            <p className="text-white/20 text-xs mb-4 select-none">
              No saved words yet
            </p>
          ) : (
            <div className="mb-4">
              {words.map((item) => (
                <SavedItemLabel
                  key={item._id}
                  item={item}
                  showLanguage={langFilter === "all"}
                />
              ))}
            </div>
          )}

          <p className="my-1 mb-2 select-none">Phrases</p>
          {phrases.length === 0 ? (
            <p className="text-white/20 text-xs select-none">
              No saved phrases yet
            </p>
          ) : (
            <div>
              {phrases.map((item) => (
                <SavedItemLabel
                  key={item._id}
                  item={item}
                  showLanguage={langFilter === "all"}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedSidebar;
