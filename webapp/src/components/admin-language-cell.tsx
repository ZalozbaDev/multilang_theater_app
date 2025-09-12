import React, { FC, useState, useEffect } from 'react'
import { getTranscript, Language } from '../constants/transcripts.ts'

export const AdminLanguageCell: FC<{
  language: Language
  currentCue: number
  autoPlay: boolean
  playTrigger: boolean
}> = ({ language, currentCue, autoPlay, playTrigger }) => {
  const { text, duration } = getTranscript(language, currentCue)
  const [showDot, setShowDot] = useState(false)

  const startTimer = () => {
    setShowDot(true)
    return setTimeout(() => {
      setShowDot(false)
    }, duration)
  }

  useEffect(() => {
    if (duration > 0 && autoPlay) {
      const timer = startTimer()

      return () => clearTimeout(timer)
    } else if (!autoPlay) {
      // Hide dot when autoPlay is turned off
      setShowDot(false)
    }
  }, [duration, currentCue, autoPlay])

  // Start timer when play is triggered (SPACE button)
  useEffect(() => {
    if (duration > 0 && playTrigger) {
      const timer = startTimer()

      return () => clearTimeout(timer)
    }
  }, [playTrigger, duration])

  return (
    <div key={language} className='border p-3 rounded bg-white'>
      <div className='flex items-center justify-between'>
        <h2 className='font-semibold mb-2'>{language.toUpperCase()}</h2>
        {showDot && (
          <div className='relative'>
            <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
            <div className='absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75'></div>
          </div>
        )}
      </div>
      <div className='whitespace-pre-wrap font-mono'>{text || '[Lade...]'}</div>
    </div>
  )
}
