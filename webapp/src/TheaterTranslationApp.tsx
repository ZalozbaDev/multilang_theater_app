import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const LANGUAGES = ["de", "en", "fr", "es", "it", "cs", "pl"];
const TOTAL_CUES = globalThis.env?.ENVVAR_TOTAL_CUES;
const socket = io(globalThis.env?.ENVVAR_SOCKET_URL || "http://localhost:3001");

export default function TheaterTranslationApp() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(""); // ✅ Default: none
  const [enableAudio, setEnableAudio] = useState<boolean>(false); // ✅ Default: disabled
  const [currentCue, setCurrentCue] = useState<number>(0);
  const [transcript, setTranscript] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(16);

  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const transcriptCache = useRef<Record<number, Record<string, string>>>({});
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  const loadedTranscripts = useRef<Set<string>>(new Set());
  const loadedAudio = useRef<Set<string>>(new Set());
  const currentlyPlayingAudio = useRef<HTMLAudioElement | null>(null);

  /** ✅ Load transcripts ONCE per language */
  const loadTranscriptsForLanguage = async (lang: string) => {
    if (!lang || loadedTranscripts.current.has(lang)) return;
    loadedTranscripts.current.add(lang);

    for (let cue = 0; cue < TOTAL_CUES; cue++) {
      if (!transcriptCache.current[cue]) transcriptCache.current[cue] = {};

      try {
        const res = await fetch(`/transcripts/${lang}/${cue}.txt`);
        const text = await res.text();
        transcriptCache.current[cue][lang] = text;
      } catch {
        transcriptCache.current[cue][lang] = "[n/a]";
      }
    }
  };

  /** ✅ Load audio (can be called multiple times, e.g., after enabling audio) */
  const loadAudioForLanguage = async (lang: string) => {
    if (!lang || loadedAudio.current.has(lang)) return;
    loadedAudio.current.add(lang);

    setIsDownloadingAudio(true);
    setDownloadProgress(0);

    for (let cue = 0; cue < TOTAL_CUES; cue++) {
      const key = `${cue}.${lang}`;
      if (!audioCache.current[key]) {
        const audio = new Audio(`/audio/${lang}/${cue}.mp3`);
        audio.load();
        audioCache.current[key] = audio;
      }
      setDownloadProgress(Math.round(((cue + 1) / TOTAL_CUES) * 100));
    }

    setIsDownloadingAudio(false);
  };

  const stopCurrentAudio = () => {
    if (currentlyPlayingAudio.current) {
      currentlyPlayingAudio.current.pause();
      currentlyPlayingAudio.current.currentTime = 0;
      currentlyPlayingAudio.current = null;
    }
  };

  const playCue = (cueNum: number) => {
    setCurrentCue(cueNum);
    stopCurrentAudio();

    if (enableAudio && selectedLanguage) {
      const audioKey = `${cueNum}.${selectedLanguage}`;
      const audio = audioCache.current[audioKey];
      if (audio) {
        audio.currentTime = 0;
        audio.play();
        currentlyPlayingAudio.current = audio;
      }
    }

    setTranscript(
      transcriptCache.current[cueNum]?.[selectedLanguage] || "[...]"
    );
  };

  /** ✅ Handle language & audio changes */
  useEffect(() => {
    if (!selectedLanguage) return;

    loadTranscriptsForLanguage(selectedLanguage);

    if (enableAudio) {
      loadAudioForLanguage(selectedLanguage);
    }
  }, [selectedLanguage, enableAudio]);

  /** ✅ Socket listeners */
  useEffect(() => {
    socket.on("cue-update", (cue: string) => {
      const cueNum = parseInt(cue, 10);
      if (!isNaN(cueNum)) playCue(cueNum);
    });

    socket.on("play-current", (data: { cue: number }) => {
      playCue(data.cue);
    });

    socket.on("stop-playback", () => {
      stopCurrentAudio();
    });

    return () => {
      socket.off("cue-update");
      socket.off("play-current");
      socket.off("stop-playback");
    };
  }, [selectedLanguage, enableAudio]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const increaseFont = () => setFontSize((size) => size + 2);
  const decreaseFont = () => setFontSize((size) => Math.max(10, size - 2));

  return (
    <div
      className={`p-4 max-w-2xl mx-auto ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <h1 className="text-2xl font-semibold mb-4">Pasion 2025</h1>

      {/* ✅ Language Selector */}
      <div className="mb-4">
        <label htmlFor="language" className="mr-2 font-medium">
          Rěč / Sprache / Language
        </label>
        <select
          id="language"
          value={selectedLanguage}
          onChange={(e) => {
            setSelectedLanguage(e.target.value);
            setTranscript(""); // Clear transcript when changing language
          }}
          className={`border p-1 rounded ${
            darkMode
              ? "bg-gray-800 text-white border-gray-600"
              : "bg-white text-black border-gray-300"
          }`}
        >
          <option value="">-- Please select language --</option>
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Audio Playback Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableAudio}
            onChange={(e) => setEnableAudio(e.target.checked)}
            disabled={!selectedLanguage}
          />
          <span>Enable Audio Playback</span>
        </label>
      </div>

      {/* ✅ Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={toggleDarkMode}
          className="flex-1 text-2xl bg-blue-500 text-white px-2 py-1 rounded"
        >
          🌙
        </button>
        <button
          onClick={increaseFont}
          className="flex-1 text-2xl font-bold bg-green-500 text-white px-2 py-1 rounded"
        >
          +
        </button>
        <button
          onClick={decreaseFont}
          className="flex-1 text-2xl font-bold bg-red-500 text-white px-2 py-1 rounded"
        >
          -
        </button>
      </div>

      {/* Transcript */}
      <div
        className="rounded p-4 whitespace-pre-wrap"
        style={{
          fontSize: `${fontSize}px`,
          backgroundColor: darkMode ? "#1f2937" : "#f3f4f6",
        }}
      >
        {transcript}
      </div>

      {/* ✅ Modal Progress Bar */}
      {isDownloadingAudio && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-80 text-center">
            <h2 className="mb-4 font-bold text-lg">
              Downloading Audio Files...
            </h2>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm">{downloadProgress}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
