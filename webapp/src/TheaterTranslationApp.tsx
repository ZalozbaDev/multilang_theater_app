import React, { useEffect, useState } from "react";
import { Button } from "./components/ui/button.tsx";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./components/ui/select.tsx";
import { Input } from "./components/ui/input.tsx";
import { io } from "socket.io-client";

const LANGUAGES = ["de", "en", "fr", "es", "it"];
const AUDIO_CUES = ["intro", "scene1", "scene2", "finale"];
const socket = io(globalThis.env?.ENVVAR_SOCKET_URL || "http://localhost:3001");

const audioCache = {};
const transcriptCache = {};

export default function TheaterTranslationApp() {
  const [language, setLanguage] = useState("de");
  const [currentCue, setCurrentCue] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customCue, setCustomCue] = useState("");
  const [transcript, setTranscript] = useState("");


  // Preload audio files for selected language
  useEffect(() => {
    setLoaded(false);

    const audioPromises = AUDIO_CUES.map(cue => {
      const audio = new Audio(`/audio/${language}/${cue}.mp3`);
      audioCache[`${language}-${cue}`] = audio;
      return new Promise(resolve => {
        audio.oncanplaythrough = resolve;
        audio.onerror = resolve;
      });
    });

    const transcriptPromises = AUDIO_CUES.map(cue =>
      fetch(`/transcripts/${language}/${cue}.txt`)
        .then(res => res.ok ? res.text() : "")
        .then(text => {
          transcriptCache[`${language}-${cue}`] = text;
        })
        .catch(() => {
          transcriptCache[`${language}-${cue}`] = "";
        })
    );
  
    Promise.all([...audioPromises, ...transcriptPromises])
      .then(() => setLoaded(true));
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
    const text = transcriptCache[`${language}-${currentCue}`];
    setTranscript(text || "");
    const audio = audioCache[`${language}-${currentCue}`];
    if (audio) audio.play();
  }, [currentCue, language, loaded]);

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

      {currentCue && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-2">Transkript</h2>
            <p className="whitespace-pre-line">{transcript || "Kein Transkript verfügbar."}</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
