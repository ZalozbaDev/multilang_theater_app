import React, { FC, useState, useEffect } from 'react'
import { Language, transcripts } from '../constants/transcripts.ts'

export const AdminLanguageCell: FC<{
  language: Language
  currentCue: number
}> = ({ language, currentCue }) => {
  const text = transcripts[language][currentCue]['text'] || '[Lade...]'
  const duration = transcripts[language][currentCue]['duration'] || 0
  const [showDot, setShowDot] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      setShowDot(true)
      const timer = setTimeout(() => {
        setShowDot(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, currentCue])

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
      <div className='whitespace-pre-wrap font-mono'>
        {transcripts[language][currentCue]['text'] || '[Lade...]'}
      </div>
    </div>
  )
}
