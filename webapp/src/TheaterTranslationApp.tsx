import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { getTranscript } from './constants/transcripts.ts'
import { TRANSLATIONS } from './constants/translations.ts'
import { LANGUAGES } from './constants/languages.ts'
import { useWakeLock } from './hooks/useWakeLock.ts'

const TOTAL_CUES = globalThis.env?.ENVVAR_TOTAL_CUES
const socket = io(
  globalThis.env?.ENVVAR_SOCKET_URL ||
    'https://staging.pasionapi.serbski-inkubator.de'
)

export default function TheaterTranslationApp() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('') // ✅ Default: none
  const [enableAudio, setEnableAudio] = useState<boolean>(false) // ✅ Default: disabled
  const [currentCue, setCurrentCue] = useState<number>(0)
  const [transcript, setTranscript] = useState('')
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [fontSize, setFontSize] = useState<number>(16)
  const [showMainInterface, setShowMainInterface] = useState<boolean>(false)
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Wake lock to prevent screen from sleeping
  useWakeLock()

  const loadedAudio = useRef<Set<string>>(new Set())
  const audioCache = useRef<Record<string, HTMLAudioElement>>({})
  const currentlyPlayingAudio = useRef<HTMLAudioElement | null>(null)

  /** ✅ Load audio (with visible pseudo-progress) */
  const loadAudioForLanguage = async (lang: string) => {
    if (!lang || loadedAudio.current.has(lang)) return
    loadedAudio.current.add(lang)

    setIsDownloadingAudio(true)
    setDownloadProgress(0)
    const time = new Date().getTime()
    console.log('Loading audio for', lang)

    for (let cue = 0; cue < TOTAL_CUES; cue++) {
      const key = `${cue}.${lang}`
      if (!audioCache.current[key]) {
        const audio = new Audio(`/audio/${lang}/${cue}.mp3`)
        audio.load()
        audioCache.current[key] = audio
      }

      if (cue % 10 === 0) {
        // 👉 Artificial delay to make progress bar visible
        await new Promise(resolve => setTimeout(resolve, 5))
      }

      console.log(cue)
      setDownloadProgress(Math.round(((cue + 1) / TOTAL_CUES) * 100))
    }
    const time2 = new Date().getTime() - time
    console.log(`Loaded audio for ${lang} in ${time2}ms`)

    setIsDownloadingAudio(false)
  }

  const stopCurrentAudio = () => {
    if (currentlyPlayingAudio.current) {
      currentlyPlayingAudio.current.pause()
      currentlyPlayingAudio.current.currentTime = 0
      currentlyPlayingAudio.current = null
    }
  }

  const playCue = (cueNum: number) => {
    setCurrentCue(cueNum)
    stopCurrentAudio()

    if (enableAudio && selectedLanguage) {
      const audioKey = `${cueNum}.${selectedLanguage}`
      const audio = audioCache.current[audioKey]
      if (audio) {
        audio.currentTime = 0
        audio.play()
        currentlyPlayingAudio.current = audio
      }
    }

    setTranscript(getTranscript(selectedLanguage, cueNum).text || '[...]')
  }

  /** ✅ Handle language & audio changes */
  useEffect(() => {
    if (!selectedLanguage) return

    if (enableAudio) {
      loadAudioForLanguage(selectedLanguage)
    }
  }, [selectedLanguage, enableAudio])

  useEffect(() => {
    if (selectedLanguage) {
      setTranscript(getTranscript(selectedLanguage, currentCue).text || '[...]')
    }
  }, [selectedLanguage, currentCue])

  /** ✅ Socket listeners */
  useEffect(() => {
    socket.on('cue-update', async (cue: string) => {
      const cueNum = parseInt(cue, 10)
      if (!isNaN(cueNum)) await playCue(cueNum)
    })

    socket.on('play-current', async (data: { cue: number }) => {
      await playCue(data.cue)
    })

    socket.on('stop-playback', () => {
      stopCurrentAudio()
    })

    return () => {
      socket.off('cue-update')
      socket.off('play-current')
      socket.off('stop-playback')
    }
  }, [selectedLanguage, enableAudio])

  const handleLanguageSelect = (languageCode: string) => {
    // Stop any currently playing audio
    stopCurrentAudio()

    // Reset audio state
    setEnableAudio(false)

    // Clear audio cache for the new language
    loadedAudio.current.clear()
    audioCache.current = {}

    // Set new language
    setSelectedLanguage(languageCode)
    setShowMainInterface(true)

    // Update transcript immediately for the new language
    setTranscript(
      getTranscript(languageCode as any, currentCue).text || '[...]'
    )
  }

  const getTranslations = () => {
    return (
      TRANSLATIONS[selectedLanguage as keyof typeof TRANSLATIONS] ||
      TRANSLATIONS.en
    )
  }

  const toggleDarkMode = () => setDarkMode(!darkMode)
  const increaseFont = () => setFontSize(size => size + 2)
  const decreaseFont = () => setFontSize(size => Math.max(10, size - 2))

  // Language Selection Screen
  if (!showMainInterface) {
    return (
      <div className='min-h-screen bg-red-800 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg p-8 md:p-12 max-w-2xl w-full shadow-lg border-2 border-red-600'>
          <div className='text-center mb-8'>
            <h1 className='text-4xl md:text-6xl font-bold text-red-800 mb-4'>
              PASION 2025
            </h1>
            <p className='text-xl text-red-700 mb-2 font-semibold'>
              Rěč / Sprache / Language
            </p>
            <p className='text-lg text-red-600'>Wubrać / Auswählen / Select</p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className='group relative bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-400 rounded-lg p-6 transition-all duration-200 hover:shadow-md'
              >
                <div className='text-center'>
                  <div className='text-4xl mb-3'>{lang.flag}</div>
                  <div className='text-red-800 font-bold text-lg'>
                    {lang.name}
                  </div>
                  <div className='text-red-600 text-sm uppercase tracking-wider font-semibold'>
                    {lang.code}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Main Interface
  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        darkMode ? 'bg-black' : 'bg-red-800'
      }`}
    >
      <div className='container mx-auto px-4 py-8 max-w-6xl'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1
            className={`text-3xl md:text-4xl font-bold mb-2 ${
              darkMode ? 'text-white' : 'text-white'
            }`}
          >
            PASION 2025
          </h1>
          <div className='flex items-center justify-center gap-2 text-sm'>
            <span
              className={`px-3 py-1 rounded-full border-2 ${
                darkMode
                  ? 'bg-red-700 text-white border-red-500'
                  : 'bg-red-600 text-white border-red-400'
              }`}
            >
              {LANGUAGES.find(l => l.code === selectedLanguage)?.flag}{' '}
              {LANGUAGES.find(l => l.code === selectedLanguage)?.name}
            </span>
            <button
              onClick={() => setShowMainInterface(false)}
              className={`px-3 py-1 rounded-full text-xs transition-colors border-2 ${
                darkMode
                  ? 'bg-black text-red-200 hover:bg-gray-800 border-red-600'
                  : 'bg-red-700 text-red-100 hover:bg-red-600 border-red-500'
              }`}
            >
              {getTranslations().changeLanguage}
            </button>
          </div>
        </div>

        <div className='flex justify-center mb-8'>
          <label
            className={`flex items-center gap-3 px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
              darkMode
                ? 'bg-black hover:bg-gray-800 border-red-600'
                : 'bg-red-600 hover:bg-red-500 border-red-400'
            }`}
          >
            <div className='relative'>
              <input
                type='checkbox'
                checked={enableAudio}
                onChange={e => setEnableAudio(e.target.checked)}
                className='sr-only'
              />
              <div
                className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                  enableAudio ? 'bg-white' : 'bg-red-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-red-600 rounded-full shadow-md transform transition-transform duration-300 ${
                    enableAudio ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`}
                ></div>
              </div>
            </div>
            <span className='font-bold text-white'>
              {getTranslations().audio}
            </span>
          </label>
        </div>

        {/* Control Buttons */}
        <div className='flex justify-center gap-4 mb-8'>
          <button
            onClick={toggleDarkMode}
            className={`group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border-2 ${
              darkMode
                ? 'bg-black hover:bg-gray-800 text-white border-red-500'
                : 'bg-red-600 hover:bg-red-500 text-white border-red-400'
            }`}
          >
            <span className='text-lg'>🌙</span>
            <span className='text-sm font-bold'>{getTranslations().dark}</span>
          </button>

          <button
            onClick={increaseFont}
            className={`group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border-2 ${
              darkMode
                ? 'bg-black hover:bg-gray-800 text-white border-red-500'
                : 'bg-red-600 hover:bg-red-500 text-white border-red-400'
            }`}
          >
            <span className='text-lg font-bold'>+</span>
            <span className='text-sm font-bold'>{getTranslations().font}</span>
          </button>

          <button
            onClick={decreaseFont}
            className={`group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border-2 ${
              darkMode
                ? 'bg-black hover:bg-gray-800 text-white border-red-500'
                : 'bg-red-600 hover:bg-red-500 text-white border-red-400'
            }`}
          >
            <span className='text-lg font-bold'>-</span>
            <span className='text-sm font-bold'>{getTranslations().font}</span>
          </button>
        </div>

        {/* Transcript */}
        <div className='max-w-4xl mx-auto'>
          <div
            className={`rounded-lg p-6 md:p-8 whitespace-pre-wrap transition-all duration-300 border-2 ${
              darkMode
                ? 'bg-black border-red-600'
                : 'bg-white border-red-400 shadow-lg'
            }`}
            style={{
              fontSize: `${fontSize}px`,
              color: darkMode ? 'white' : 'black',
            }}
          >
            {transcript || (
              <div
                className={`text-center py-12 ${
                  darkMode ? 'text-red-200' : 'text-red-600'
                }`}
              >
                <div className='text-4xl mb-4'>🎭</div>
                <p className='text-lg font-bold'>{getTranslations().waiting}</p>
                <p className='text-sm mt-2 font-semibold'>
                  {getTranslations().transcripts}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isDownloadingAudio && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
          <div className='bg-white p-6 rounded shadow-md w-80 text-center'>
            <h2 className='mb-4 font-bold text-lg'>Downloading Resources...</h2>

            <p className='font-medium'>Audio</p>
            <div className='w-full bg-gray-200 rounded-full h-4'>
              <div
                className='bg-green-500 h-4 rounded-full'
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
