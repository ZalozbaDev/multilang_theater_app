// src/AdminPanel.tsx
import React, { useEffect, useState, useRef } from "react";
import { Button } from "./components/ui/button.tsx";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Input } from "./components/ui/input.tsx";
import { io } from "socket.io-client";

const TOTAL_CUES = globalThis.env?.ENVVAR_TOTAL_CUES;
const LANGUAGES = ["orig", "de", "en", "fr", "es", "it"];
const socket = io(globalThis.env?.ENVVAR_SOCKET_URL || "http://localhost:3001");
const ADMIN_PASSWORD = globalThis.env?.ENVVAR_ADMIN_PASSWORD || "";

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentCue, setCurrentCue] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [customCueInput, setCustomCueInput] = useState("");
  const transcriptCache = useRef<Record<string, Record<string, string>>>({});
  
  const handleLogin = () => {
    const password = prompt("Admin-Passwort eingeben:");
    if (password === ADMIN_PASSWORD) setAuthenticated(true);
  };

  const sendCue = (cue: number) => {
    socket.emit("cue-update", cue);
  };

  const handlePrevCue = () => {
    if (currentCue > 0) sendCue(currentCue - 1);
  };

  const handleNextCue = () => {
    if (currentCue < TOTAL_CUES - 1) sendCue(currentCue + 1);
  };

  const fetchAllResources = async () => {
    const newTranscripts: Record<number, Record<string, string>> = {};

    for (let cue = 0; cue < TOTAL_CUES; cue++) {
      newTranscripts[cue] = {};

      await Promise.all(
        LANGUAGES.map(async (lang) => {
          // Transkripte laden
          try {
            const res = await fetch(`/transcripts/${lang}/${cue}.txt`);
            const text = await res.text();
            newTranscripts[cue][lang] = text;
          } catch {
            newTranscripts[cue][lang] = "[Nicht verfügbar]";
          }

        })
      );
    }

    transcriptCache.current = newTranscripts;
    setTranscripts(newTranscripts);
  };
      
  useEffect(() => {
    fetchAllResources(); // Lade alle Transkripte bei der Initialisierung

    socket.on("cue-update", (cue: string) => {
        const num = parseInt(cue, 10);
        if (!isNaN(num)) setCurrentCue(num);
      });

    return () => {
      socket.off("cue-update");
    };
  }, []);

  if (!authenticated) return <Button onClick={handleLogin}>Als Admin einloggen</Button>;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-bold">Steuerung (Admin)</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrevCue}>Zurück</Button>
            <Button onClick={handleNextCue}>Vor</Button>
            <Input
              placeholder="Cue-Nummer"
              value={customCueInput}
              onChange={(e) => setCustomCueInput(e.target.value)}
            />
            <Button
              onClick={() => {
                const num = parseInt(customCueInput, 10);
                if (!isNaN(num) && num >= 0 && num < TOTAL_CUES) {
                  sendCue(num);
                }
              }}
            >
              Abspielen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Transkripte für Cue {currentCue}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {LANGUAGES.map((lang) => (
          <div
            key={lang}
            className={`border p-3 rounded ${lang === "orig" ? "bg-yellow-100 border-yellow-400" : "bg-white"}`}
          >
            <h2 className="font-semibold mb-2">{lang.toUpperCase()}</h2>
            {lang === "orig" && currentCue > 0 && (
              <div className="text-sm text-gray-600 mb-1">← {transcripts[currentCue - 1]?.["orig"] || "..."}</div>
            )}
            <div className="whitespace-pre-wrap font-mono">
              {transcripts[currentCue]?.[lang] || "[Lade...]"}
            </div>
            {lang === "orig" && currentCue < TOTAL_CUES - 1 && (
              <div className="text-sm text-gray-600 mt-1">→ {transcripts[currentCue + 1]?.["orig"] || "..."}</div>
            )}
          </div>
        ))}
      </div>
        </CardContent>
      </Card>
    </div>
  );
}
