import { useState } from 'react'
import { analyzeComplaint } from '../api/analyzerapi.js'

export function useAnalyser() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function analyze(complaint, filters = {}) {
    const value = complaint.trim()
    if (!value) {
      setResult(null)
      setError('Describe the payment problem before analyzing.')
      return
    }
    if (isLoading) return

    setIsLoading(true)
    setError('')
    try {
      setResult(await analyzeComplaint(value, filters))
    } catch (analysisError) {
      setResult(null)
      setError(analysisError instanceof Error ? analysisError.message : 'Unable to analyze this complaint.')
    } finally {
      setIsLoading(false)
    }
  }

  function clearError() {
    if (error) setError('')
  }

  return { result, error, isLoading, analyze, clearError }
}
