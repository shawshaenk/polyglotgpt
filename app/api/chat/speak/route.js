import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

dotenv.config();

const googleTTSLanguageMap = {
  af: "af-ZA", // Afrikaans
  ar: "ar-XA", // Arabic
  eu: "eu-ES", // Basque
  bn: "bn-IN", // Bengali
  bg: "bg-BG", // Bulgarian
  ca: "ca-ES", // Catalan
  "zh-CN": "cmn-CN", // Chinese (Mandarin Simplified)
  "zh-TW": "cmn-TW", // Chinese (Mandarin Traditional)
  hr: "hr-HR", // Croatian
  cs: "cs-CZ", // Czech
  da: "da-DK", // Danish
  nl: "nl-NL", // Dutch
  en: "en-US", // English
  fi: "fi-FI", // Finnish
  fr: "fr-FR", // French
  gl: "gl-ES", // Galician
  de: "de-DE", // German
  el: "el-GR", // Greek
  gu: "gu-IN", // Gujarati
  he: "he-IL", // Hebrew
  hi: "hi-IN", // Hindi
  hu: "hu-HU", // Hungarian
  is: "is-IS", // Icelandic
  id: "id-ID", // Indonesian
  it: "it-IT", // Italian
  ja: "ja-JP", // Japanese
  kn: "kn-IN", // Kannada
  ko: "ko-KR", // Korean
  lv: "lv-LV", // Latvian
  lt: "lt-LT", // Lithuanian
  ms: "ms-MY", // Malay
  ml: "ml-IN", // Malayalam
  mr: "mr-IN", // Marathi
  no: "nb-NO", // Norwegian
  pl: "pl-PL", // Polish
  pt: "pt-PT", // Portuguese
  ro: "ro-RO", // Romanian
  ru: "ru-RU", // Russian
  sr: "sr-RS", // Serbian
  sk: "sk-SK", // Slovak
  sl: "sl-SI", // Slovenian
  es: "es-ES", // Spanish
  sv: "sv-SE", // Swedish
  ta: "ta-IN", // Tamil
  te: "te-IN", // Telugu
  th: "th-TH", // Thai
  tr: "tr-TR", // Turkish
  uk: "uk-UA", // Ukrainian
  vi: "vi-VN", // Vietnamese
  yue: "yue-HK", // Cantonese
  fil: "fil-PH", // Filipino
  pa: "pa-IN" // Punjabi
};

export function getTTSLanguageCode(code) {
  return googleTTSLanguageMap[code] || "en-US"; // fallback
}

function getGoogleCredentials() {
  const base64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  if (!base64) {
    throw new Error(
      "Missing GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable."
    );
  }

  try {
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error parsing Google credentials from base64:", error);
    throw new Error("Invalid GOOGLE_APPLICATION_CREDENTIALS_BASE64 format.");
  }
}

export async function POST(req) {
  const { speakTextCopy, targetLang } = await req.json();

  const credentials = getGoogleCredentials();

  const client = new TextToSpeechClient({
    credentials: credentials, // Pass the credentials object directly
  });

  const text = speakTextCopy.replace(/[*_~`#>[\]()→-]/g, "");
  const languageCode = getTTSLanguageCode(targetLang);

  const request = {
    input: { text },
    voice: {
      languageCode,
      ssmlGender: "NEUTRAL",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.8,
      pitch: 0,
      volumeGainDb: 0,
    },
  };

  const [response] = await client.synthesizeSpeech(request);

  // Convert audio content to base64
  const audioBase64 = response.audioContent.toString("base64");

  return NextResponse.json({
    success: true,
    audioContent: audioBase64,
    contentType: "audio/mp3",
  });
}
