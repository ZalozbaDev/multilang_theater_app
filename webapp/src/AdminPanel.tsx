// src/AdminPanel.tsx
import React, { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { io } from "socket.io-client";

const AUDIO_CUES = ["intro", "scene1", "scene2", "finale"];
const socket = io(globalThis.env?.SOCKET_URL || "http://localhost:3001");
const ADMIN_PASSWORD = globalThis.env?.ADMIN_PASSWORD || "";

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [customCue, setCustomCue] = useState("");

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

  const [currentCue, setCurrentCue] = useState<string | null>(null);

  useEffect(() => {
    socket.on("cue-update", setCurrentCue);
    return () => socket.off("cue-update", setCurrentCue);
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
    </div>
  );
}
