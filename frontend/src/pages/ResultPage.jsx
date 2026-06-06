import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { interviewApi } from '../services/api'

export default function ResultPage() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    interviewApi.getById(id)
      .then(res => setResult(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load results'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div style={{ paddingTop: 120, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Analyzing your performance...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="page">
        <Navbar />
        <div style={{ paddingTop: 120, textAlign: 'center' }}>
          <div className="alert alert-error" style={{ maxWidth: 400, margin: '0 auto' }}>{error || 'Result not found'}</div>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 24 }}>Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const scoreClass = result.overallScore >= 75 ? 'score-ring-high' : result.overallScore >= 50 ? 'score-ring-mid' : 'score-ring-low'

  return (
    <div className="page">
      <Navbar />
      <div className="result-page">
        
        <div className="result-header">
          <div className={`score-ring ${scoreClass}`}>
            {result.overallScore}<small>%</small>
          </div>
          <h1 className="result-title">Interview Completed</h1>
          <p className="result-subtitle">
            {result.title} • {result.mode} MODE • {new Date(result.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="result-grid">
          <div className="result-card">
            <div className="result-card-title green">Strengths</div>
            <div className="result-card-body">{result.strengths || 'No specific strengths identified.'}</div>
          </div>
          <div className="result-card">
            <div className="result-card-title red">Areas for Improvement</div>
            <div className="result-card-body">{result.weaknesses || 'No specific weaknesses identified.'}</div>
          </div>
        </div>

        <div className="result-card" style={{ marginBottom: 40 }}>
          <div className="result-card-title cyan">Actionable Tips</div>
          <div className="result-card-body">{result.improvementTips || 'Keep practicing!'}</div>
        </div>

        <h2 className="section-title">Question Breakdown</h2>
        
        <div className="qa-list">
          {result.questions.map((q, idx) => (
            <div key={q.questionId} className="qa-item">
              <div className="qa-question">
                <div className="qa-question-label">Question {idx + 1}</div>
                <div className="qa-question-text">{q.questionText}</div>
              </div>
              <div className="qa-answer">
                <div className="qa-score-pill" style={{
                  background: q.score >= 75 ? 'rgba(16,185,129,0.1)' : q.score >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                  color: q.score >= 75 ? 'var(--green)' : q.score >= 50 ? 'var(--yellow)' : 'var(--red)'
                }}>
                  Score: {q.score}/100
                </div>
                <div className="qa-answer-text">
                  "{q.answerText || 'No answer provided.'}"
                </div>
                <div className="qa-feedback">
                  <span style={{ fontSize: 16 }}>💡</span>
                  <span>{q.feedback}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/dashboard" className="btn btn-secondary" style={{ marginRight: 16 }}>Back to Dashboard</Link>
          <Link to="/interview" className="btn btn-primary">Start Another Practice</Link>
        </div>

      </div>
    </div>
  )
}
