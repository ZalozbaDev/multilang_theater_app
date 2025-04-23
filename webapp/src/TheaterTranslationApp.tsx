import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/select.tsx";
import { io } from "socket.io-client";

const LANGUAGES = ["de", "en", "fr", "es", "it"];
const TOTAL_CUES = 10;
const socket = io(globalThis.env?.ENVVAR_SOCKET_URL || "http://localhost:3001");

export default function TheaterTranslationApp() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("de");
  const setCurrentCue = useState<number>(0);
  const [transcript, setTranscript] = useState("");
  const transcriptCache = useRef<Record<number, Record<string, string>>>({});
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const loadAllResources = async () => {
    for (let cue = 0; cue < TOTAL_CUES; cue++) {
      if (!transcriptCache.current[cue]) transcriptCache.current[cue] = {};

      for (const lang of LANGUAGES) {
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
    }
  };

  // Preload audio files for selected language
  useEffect(() => {
    loadAllResources();

    socket.on("cue-update", (cue: string) => {
      const cueNum = parseInt(cue, 10);
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

  return (
    <div className="p-4 max-w-2xl mx-auto">
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

      <div className="bg-gray-100 rounded p-4 whitespace-pre-wrap">
        {transcript}
      </div>
    </div>
  );
}
