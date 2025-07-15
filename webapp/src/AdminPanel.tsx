// src/AdminPanel.tsx
import React, { useEffect, useState, useRef } from "react";
import { Button } from "./components/ui/button.tsx";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Input } from "./components/ui/input.tsx";
import { io } from "socket.io-client";

const TOTAL_CUES = globalThis.env?.ENVVAR_TOTAL_CUES;
const LANGUAGES = ["orig", "de", "en", "fr", "es", "it", "cs", "pl"];
const socket = io(globalThis.env?.ENVVAR_SOCKET_URL || "http://localhost:3001");
const ADMIN_PASSWORD = globalThis.env?.ENVVAR_ADMIN_PASSWORD || "";

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentCue, setCurrentCue] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [customCueInput, setCustomCueInput] = useState("");
  const transcriptCache = useRef<Record<string, Record<string, string>>>({});

  const [autoPlay, setAutoPlay] = useState(false);

  const handleLogin = () => {
    const password = prompt("Prošu hesło za administratora:");
    if (password === ADMIN_PASSWORD) setAuthenticated(true);
  };

  const sendCue = (cue: number) => {
    if (autoPlay) {
      socket.emit("cue-update", cue);
    } else {
      // Do NOT emit cue-update if autoPlay is off.
      // Optionally, update local currentCue state:
      setCurrentCue(cue);
    }
  };

  const handlePrevCue = () => {
    if (currentCue > 0) sendCue(currentCue - 1);
  };

  const handleNextCue = () => {
    if (currentCue < TOTAL_CUES - 1) sendCue(currentCue + 1);
  };

  const handlePlayCurrent = () => {
    if (!autoPlay) {
      socket.emit("play-current", { cue: currentCue });
    }
  };

  const handleStopPlayback = () => {
    socket.emit("stop-playback", {});
  };

  const fetchAllResources = async () => {
    const newTranscripts: Record<number, Record<string, string>> = {};
    for (let cue = 0; cue < TOTAL_CUES; cue++) {
      newTranscripts[cue] = {};
      await Promise.all(
        LANGUAGES.map(async (lang) => {
          try {
            const res = await fetch(`/transcripts/${lang}/${cue}.txt`);
            const text = await res.text();
            newTranscripts[cue][lang] = text;
          } catch {
            newTranscripts[cue][lang] = "[žadyn transkript za tutu linku]";
          }
        })
      );
    }
    transcriptCache.current = newTranscripts;
    setTranscripts(newTranscripts);
  };

  useEffect(() => {
    fetchAllResources();
    socket.on("cue-update", (cue: string) => {
      const num = parseInt(cue, 10);
      if (!isNaN(num)) setCurrentCue(num);
    });
    return () => {
      socket.off("cue-update");
    };
  }, []);

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight") {
        handleNextCue();
      } else if (e.code === "ArrowLeft") {
        handlePrevCue();
      } else if (e.code === "Space") {
        e.preventDefault();
        if (!autoPlay) {
          handlePlayCurrent();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [autoPlay, currentCue]);

  if (!authenticated)
    return <Button onClick={handleLogin}>Jako administrator přizjewić</Button>;

  return (
    <div className="p-6 space-y-6 text-black">
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-bold">Posłužowanje</h2>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handlePrevCue}>Wróćo (←)</Button>
            <Button onClick={handleNextCue}>Doprědka (→)</Button>

            {/* Input + controls container */}
            <div className="flex items-center gap-2 flex-grow min-w-[250px] max-w-[400px]">
              <Input
                placeholder="Ličba linki"
                value={customCueInput}
                onChange={(e) => setCustomCueInput(e.target.value)}
                className="flex-grow max-w-[150px]"
              />

              <Button
                onClick={() => {
                  const num = parseInt(customCueInput, 10);
                  if (!isNaN(num) && num >= 0 && num < TOTAL_CUES) {
                    sendCue(num);
                    setCustomCueInput(""); // Clear input after pressing the button
                  }
                }}
              >
                Na tutu linku skočić
              </Button>

              <label className="flex items-center space-x-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                />
                <span>Automatisce wothrać</span>
              </label>
            </div>

            <Button
              onClick={handlePlayCurrent}
              disabled={autoPlay}
              className={`ml-auto ${autoPlay ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Wothrać (SPACE)
            </Button>

            <Button
              onClick={handleStopPlayback}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              STOP
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Linka čisło: -- {currentCue} --</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {/* ✅ ORIG spans all columns */}
            <div className="col-span-2 md:col-span-3 border p-4 rounded bg-yellow-50 border-yellow-600 shadow-lg ring-2 ring-yellow-500 text-center">
              {currentCue > 0 && (
                <div className="text-sm text-gray-600 mb-2">
                  ← {transcripts[currentCue - 1]?.["orig"] || "..."}
                </div>
              )}
              <div className="text-4xl font-bold text-red-600 whitespace-pre-wrap">
                {transcripts[currentCue]?.["orig"] || "[Lade...]"}
              </div>
              {currentCue < TOTAL_CUES - 1 && (
                <div className="text-sm text-gray-600 mt-2">
                  → {transcripts[currentCue + 1]?.["orig"] || "..."}
                </div>
              )}
            </div>

            {/* ✅ Other languages */}
            {LANGUAGES.filter((lang) => lang !== "orig").map((lang) => (
              <div key={lang} className="border p-3 rounded bg-white">
                <h2 className="font-semibold mb-2">{lang.toUpperCase()}</h2>
                <div className="whitespace-pre-wrap font-mono">
                  {transcripts[currentCue]?.[lang] || "[Lade...]"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
