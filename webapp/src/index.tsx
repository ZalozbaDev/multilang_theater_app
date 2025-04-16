import React, { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/select";
import { Input } from "./components/ui/input";
import { io } from "socket.io-client";

const LANGUAGES = ["de", "en", "fr", "es", "it", "ru"];
const AUDIO_CUES = ["intro", "scene1", "scene2", "finale"];
const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:3001");

const audioCache = {};

export default function TheaterTranslationApp() {
  const [language, setLanguage] = useState("de");
  const [currentCue, setCurrentCue] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customCue, setCustomCue] = useState("");

  // Preload audio files for selected language
  useEffect(() => {
    setLoaded(false);
    const promises = AUDIO_CUES.map(cue => {
      const audio = new Audio(`/audio/${language}/${cue}.mp3`);
      audioCache[`${language}-${cue}`] = audio;
      return new Promise(resolve => {
        audio.oncanplaythrough = resolve;
        audio.onerror = resolve;
      });
    });
    Promise.all(promises).then(() => setLoaded(true));
  }, [language]);

  // Receive cue updates from server
  useEffect(() => {
    socket.on("cue-update", cue => {
      setCurrentCue(cue);
    });
    return () => socket.off("cue-update");
  }, []);

  // Play audio when cue changes
  useEffect(() => {
    if (!currentCue || !loaded) return;
    const audio = audioCache[`${language}-${currentCue}`];
    if (audio) audio.play();
  }, [currentCue, language, loaded]);

  const handleAdminLogin = () => {
    const password = prompt("Admin-Passwort eingeben:");
    if (password === process.env.REACT_APP_ADMIN_PASSWORD) setIsAdmin(true);
  };

  const sendCue = cue => {
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

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-xl font-bold">Wähle deine Sprache</h2>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Sprache wählen" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!isAdmin && (
        <Button onClick={handleAdminLogin}>Als Admin einloggen</Button>
      )}

      {isAdmin && (
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
      )}
    </div>
  );
}
