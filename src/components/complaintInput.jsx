import { EXAMPLE_COMPLAINT } from '../utils/analyzerUtils.js'

export function ComplaintInput({ complaint, setComplaint, filters, analyze, isLoading, error, clearError, resetFilters }) {
  function handleRetry() {
    setComplaint('')
    resetFilters()
    clearError()
  }

  return <div className="query-panel">
    <div className="panel-label"><span>01</span> Ask your question</div>
    <label htmlFor="complaint">What would you like to investigate?</label>
    <textarea id="complaint" value={complaint} onChange={(event) => { setComplaint(event.target.value); clearError() }} placeholder={EXAMPLE_COMPLAINT} rows={4} disabled={isLoading} />
    <div className="prompt-row">
      <button type="button" className="example" onClick={() => setComplaint(EXAMPLE_COMPLAINT)} disabled={isLoading}>Use example <span>-&gt;</span></button>
      <span className="hint">Try: failed payments over the last hour</span>
    </div>
    <button type="button" className="analyze-button" onClick={() => analyze(complaint, filters)} disabled={isLoading}>{isLoading ? 'Analyzing payment signals...' : 'Analyze complaint'}</button>
    {error && <div className="error" role="alert"><b>Analysis failed</b><span>{error}</span><button className="retry-button" type="button" onClick={handleRetry} disabled={isLoading}>Retry</button></div>}
  </div>
}
