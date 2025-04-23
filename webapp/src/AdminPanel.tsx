// src/AdminPanel.tsx
import React, { useEffect, useState, useRef } from "react";
import { Button } from "./components/ui/button.tsx";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Input } from "./components/ui/input.tsx";
import { io } from "socket.io-client";

const AUDIO_CUES = ["intro", "scene1", "scene2", "finale"];
const LANGUAGES = ["orig", "de", "en", "fr", "es", "it"];
const socket = io(globalThis.env?.ENVVAR_SOCKET_URL || "http://localhost:3001");
const ADMIN_PASSWORD = globalThis.env?.ENVVAR_ADMIN_PASSWORD || "";

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [customCue, setCustomCue] = useState("");
  const [currentCue, setCurrentCue] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const transcriptCache = useRef<Record<string, Record<string, string>>>({});
  
  const handleLogin = () => {
    const password = prompt("Admin-Passwort eingeben:");
    if (password === ADMIN_PASSWORD) setAuthenticated(true);
  };

  const sendCue = (cue: string) => {
    socket.emit("cue-update", cue);
  };

  const handlePrevCue = () => {
    const index = AUDIO_CUES.indexOf(currentCue);
    if (index > 0) sendCue(AUDIO_CUES[index - 1]);
  };

  const handleNextCue = () => {
    const index = AUDIO_CUES.indexOf(currentCue);
    if (index < AUDIO_CUES.length - 1) sendCue(AUDIO_CUES[index + 1]);
  };

  const fetchAllTranscripts = async () => {
    const allTranscripts: Record<string, Record<string, string>> = {};
    
    // Lade alle Transkripte für alle Cues und Sprachen
    await Promise.all(
      AUDIO_CUES.map(async (cue) => {
        const newTranscripts: Record<string, string> = {};
        await Promise.all(
          LANGUAGES.map(async (lang) => {
            try {
              const res = await fetch(`/transcripts/${lang}/${cue}.txt`);
              const text = await res.text();
              newTranscripts[lang] = text;
            } catch {
              newTranscripts[lang] = "[Nicht verfügbar]";
            }
          })
        );
        allTranscripts[cue] = newTranscripts;
      })
    );

    // Speichere alle Transkripte im Cache
    transcriptCache.current = allTranscripts;
    setTranscripts(allTranscripts);
  };

  useEffect(() => {
    fetchAllTranscripts(); // Lade alle Transkripte bei der Initialisierung
    socket.on("cue-update", (cue: string) => {
      setCurrentCue(cue);
    });
    return () => {
      socket.off("cue-update");
    };
  }, []);

  if (!authenticated) return <Button onClick={handleLogin}>Als Admin einloggen</Button>;

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-bold">Steuerung (Admin)</h2>
          <div className="grid grid-cols-2 gap-2">
            {AUDIO_CUES.map(cue => (
              <Button key={cue} onClick={() => sendCue(cue)}>{cue}</Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrevCue}>Zurück</Button>
            <Button onClick={handleNextCue}>Vor</Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Benutzerdefinierte Zeile"
              value={customCue}
              onChange={e => setCustomCue(e.target.value)}
            />
            <Button onClick={() => sendCue(customCue)}>Abspielen</Button>
          </div>
        </CardContent>
      </Card>

      {currentCue && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Transkripte für: {currentCue}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {LANGUAGES.map((lang) => (
                <div key={lang}>
                  <strong>{lang.toUpperCase()}</strong>
                  <pre className="bg-gray-100 p-2 whitespace-pre-wrap rounded">
                    {transcripts[currentCue]?.[lang] || "[Lade...]"}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
