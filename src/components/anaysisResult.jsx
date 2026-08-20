import { useState } from 'react'
import { formatCurrency } from '../utils/analyzerUtils.js'

export function AnalysisResult({ result, isLoading }) {
  const [copyLabel, setCopyLabel] = useState('Copy JSON')

  if (isLoading) return <div className="empty-state loading"><div className="loader" /><h2>Reading payment signals</h2><p>Translating your question and querying the MCP database.</p></div>
  if (!result) return <div className="empty-state"><div className="empty-icon">+</div><h2>Your answer will appear here</h2><p>Submit a complaint to see metrics, failure patterns, and the underlying SQL.</p></div>

  const jsonOutput = JSON.stringify(result, null, 2)
  async function copyJson() {
    await navigator.clipboard.writeText(jsonOutput)
    setCopyLabel('Copied')
    setTimeout(() => setCopyLabel('Copy JSON'), 1500)
  }

  return <div className="result-content">
    <div className="summary"><span className="status-dot" /><p>{result.summary}</p></div>
    <div className="metric-grid"><Metric label="Failed payments" value={result.metrics.failureCount.toString()} /><Metric label="Failed amount" value={formatCurrency(result.metrics.totalFailedAmount)} /><Metric label="Failure rate" value={`${result.metrics.failureRate.toFixed(0)}%`} /><Metric label="Avg. amount" value={formatCurrency(result.metrics.averageFailedAmount)} /></div>
    <div className="breakdown"><div><h3>Failure reasons</h3>{result.failureReasons.map((item) => <div className="reason" key={item.reason}><span>{item.reason}</span><b>{item.count}</b><small>{formatCurrency(item.amount)}</small></div>)}</div><div><h3>Query executed via MCP</h3><pre>{result.sql}</pre></div></div>
    <details><summary>View structured JSON</summary><button className="copy-json" type="button" onClick={copyJson} title="Copy structured JSON" aria-label="Copy structured JSON"><span className="copy-glyph" aria-hidden="true" />{copyLabel}</button><pre className="json">{jsonOutput}</pre></details>
  </div>
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>
}
