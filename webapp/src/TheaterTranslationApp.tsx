import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/select.tsx";
import { io } from "socket.io-client";

const LANGUAGES = ["de", "en", "fr", "es", "it"];
const TOTAL_CUES = globalThis.env?.ENVVAR_TOTAL_CUES;
const socket = io(globalThis.env?.ENVVAR_SOCKET_URL || "http://localhost:3001");

export default function TheaterTranslationApp() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("de");
  const [currentCue, setCurrentCue] = useState<number>(0);
  const [transcript, setTranscript] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const transcriptCache = useRef<Record<number, Record<string, string>>>({});
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  const loadedLanguages = useRef<Set<string>>(new Set());

  const loadResourcesForLanguage = async (lang: string) => {
    if (loadedLanguages.current.has(lang)) return;
    loadedLanguages.current.add(lang);
    
    for (let cue = 0; cue < TOTAL_CUES; cue++) {
      if (!transcriptCache.current[cue]) transcriptCache.current[cue] = {};

        // Transkript laden
        try {
          const res = await fetch(`/transcripts/${lang}/${cue}.txt`);
          const text = await res.text();
          transcriptCache.current[cue][lang] = text;
        } catch {
          transcriptCache.current[cue][lang] = "[n/a]";
        }

        // Audio vorladen
        const key = `${cue}.${lang}`;
        const audio = new Audio(`/audio/${lang}/${cue}.mp3`);
        audio.load();
        audioCache.current[key] = audio;
    }
  };

  // Preload audio files for selected language
  useEffect(() => {
    loadResourcesForLanguage(selectedLanguage);

    socket.on("cue-update", (cue: string) => {
      const cueNum = parseInt(cue, 10);
      console.log("Received cue:", cueNum);
      if (!isNaN(cueNum)) {
        setCurrentCue(cueNum);
        const audioKey = `${cueNum}.${selectedLanguage}`;
        const audio = audioCache.current[audioKey];
        if (audio) {
          audio.currentTime = 0;
          audio.play();
        }
        setTranscript(transcriptCache.current[cueNum]?.[selectedLanguage] || "[Lade...]");
      }
    });

    return () => {
      socket.off("cue-update");
    };
  }, [selectedLanguage]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const increaseFont = () => setFontSize((size) => size + 2);
  const decreaseFont = () => setFontSize((size) => Math.max(10, size - 2));

  return (
    <div className={`p-4 max-w-2xl mx-auto ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <h1 className="text-2xl font-semibold mb-4">Live-Übersetzung</h1>

      <div className="mb-4">
        <label htmlFor="language" className="mr-2 font-medium">Sprache wählen:</label>
        <select
          id="language"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="border p-1 rounded"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={toggleDarkMode} className="bg-blue-500 text-white px-2 py-1 rounded">Dark Mode umschalten</button>
        <button onClick={increaseFont} className="bg-green-500 text-white px-2 py-1 rounded">Text vergrößern</button>
        <button onClick={decreaseFont} className="bg-red-500 text-white px-2 py-1 rounded">Text verkleinern</button>
      </div>

      <div className="rounded p-4 whitespace-pre-wrap" style={{ fontSize: `${fontSize}px`, backgroundColor: darkMode ? '#1f2937' : '#f3f4f6' }}>
        {transcript}
      </div>
    </div>
  );
}
