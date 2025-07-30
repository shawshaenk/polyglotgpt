import dotenv from "dotenv";
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

const googleTTSLanguageMap = {
  ar: "ar-XA",
  bn: "bn-IN",
  bg: "bg-BG",
  "zh-CN": "cmn-CN",      // Mandarin Simplified
  "zh-TW": "cmn-TW",      // Mandarin Traditional
  hr: "hr-HR",
  cs: "cs-CZ",
  da: "da-DK",
  nl: "nl-NL",
  en: "en-US",
  et: "et-EE",
  fi: "fi-FI",
  fr: "fr-FR",
  de: "de-DE",
  el: "el-GR",
  gu: "gu-IN",
  he: "he-IL",
  hi: "hi-IN",
  hu: "hu-HU",
  id: "id-ID",
  it: "it-IT",
  ja: "ja-JP",
  kn: "kn-IN",
  ko: "ko-KR",
  lv: "lv-LV",
  lt: "lt-LT",
  ml: "ml-IN",
  mr: "mr-IN",
  no: "nb-NO",
  pl: "pl-PL",
  pt: "pt-PT",
  ro: "ro-RO",
  ru: "ru-RU",
  sr: "sr-RS",
  sk: "sk-SK",
  sl: "sl-SI",
  es: "es-ES",
  sw: "sw-KE",
  sv: "sv-SE",
  ta: "ta-IN",
  te: "te-IN",
  th: "th-TH",
  tr: "tr-TR",
  uk: "uk-UA",
  ur: "ur-IN",
  vi: "vi-VN",
};

export function getTTSLanguageCode(code) {
  return googleTTSLanguageMap[code] || "en-US"; // fallback
}

export async function POST(req) {
    const { speakTextCopy, nativeLang, targetLang } = await req.json();

    const systemPrompt = `
    You are a language filter AI.
    Your task:
    - Look at the given text input.
    - Remove all segments written in ${nativeLang}.
    - Keep and output only the segments written in ${targetLang}.
    - Do not translate, summarize, or modify the ${targetLang} text.
    - If no text in ${targetLang} is found, output an empty string.`

    const result = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: speakTextCopy,
          config: {
            thinkingConfig: {
              thinkingBudget: 0,
            },
            systemInstruction: systemPrompt,
          }
        });
    console.dir(result, { depth: null });

    const aiReply = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiReply) throw new Error("No reply from Gemini");

    const client = new TextToSpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const text = aiReply
    const languageCode = getTTSLanguageCode(targetLang);

    const request = {
      input: { text },
      voice: {
        languageCode,
        ssmlGender: 'NEUTRAL',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0,
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    
    // Convert audio content to base64
    const audioBase64 = response.audioContent.toString('base64');
    
    return NextResponse.json({
      success: true,
      audioContent: audioBase64,
      contentType: 'audio/mp3'
    });
}