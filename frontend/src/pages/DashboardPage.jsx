import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { interviewApi, userApi } from '../services/api'

function getScoreClass(score) {
  if (score === null || score === undefined) return 'score-pending'
  if (score >= 75) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([interviewApi.getAll(), userApi.getMe()])
      .then(([iRes, pRes]) => {
        setInterviews(iRes.data)
        setProfile(pRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const avgScore = profile?.averageScore
  const total = profile?.totalInterviews || 0
  const best = interviews.length ? Math.max(...interviews.filter(i => i.overallScore).map(i => i.overallScore)) : null

  return (
    <div className="page">
      <Navbar />
      <div className="main-content">
        <div className="container">
          <div className="dashboard-header">
            <h1>Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋</h1>
            <p>Track your progress and ace your next interview</p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{total}</div>
              <div className="stat-label">Total Interviews</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value" style={{ color: avgScore >= 75 ? 'var(--green)' : avgScore >= 50 ? 'var(--yellow)' : 'var(--cyan)' }}>
                {avgScore !== null && avgScore !== undefined ? `${avgScore}%` : '—'}
              </div>
              <div className="stat-label">Average Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>{best ? `${best}%` : '—'}</div>
              <div className="stat-label">Best Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💼</div>
              <div className="stat-value" style={{ color: 'var(--cyan)', fontSize: 16, paddingTop: 8 }}>
                {user?.skills ? user.skills.split(',').slice(0, 2).join(', ') + (user.skills.split(',').length > 2 ? '...' : '') : 'Not set'}
              </div>
              <div className="stat-label">Skills</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="section-header">
            <h2 className="section-title">Start Practicing</h2>
          </div>
          <div className="action-grid" style={{ marginBottom: 40 }}>
            <Link to="/interview" className="action-card">
              <div className="action-card-icon">📝</div>
              <h3>Practice Interview</h3>
              <p>AI generates questions based on your skills. Answer at your own pace.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8, width: 'fit-content' }}>Start Practice →</button>
            </Link>
            <Link to="/mock-interview" className="action-card">
              <div className="action-card-icon">⏱️</div>
              <h3>Mock Interview</h3>
              <p>Timed simulation of a real interview. Build confidence under pressure.</p>
              <button className="btn btn-cyan btn-sm" style={{ marginTop: 8, width: 'fit-content' }}>Start Mock →</button>
            </Link>
          </div>

          {/* Past Interviews */}
          <div className="section-header">
            <h2 className="section-title">Past Interviews</h2>
            {interviews.length > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{interviews.length} session{interviews.length > 1 ? 's' : ''}</span>}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading interviews...
            </div>
          ) : interviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎤</div>
              <h3>No interviews yet</h3>
              <p>Start your first practice session to see results here</p>
              <Link to="/interview" className="btn btn-primary" style={{ marginTop: 16 }}>Start First Interview</Link>
            </div>
          ) : (
            <div className="interviews-list">
              {interviews.map(interview => (
                <div key={interview.id} className="interview-item" onClick={() => navigate(`/result/${interview.id}`)}>
                  <div className="interview-item-left">
                    <div className="interview-item-title">{interview.title}</div>
                    <div className="interview-item-meta">
                      <span>{formatDate(interview.createdAt)}</span>
                      <span>{interview.questionCount} questions</span>
                      {interview.skillsTested && <span>{interview.skillsTested.split(',').slice(0,2).join(', ')}</span>}
                    </div>
                  </div>
                  <div className="interview-item-right">
                    <span className={`mode-tag mode-${interview.mode?.toLowerCase()}`}>{interview.mode}</span>
                    <span className={`score-badge ${getScoreClass(interview.overallScore)}`}>
                      {interview.overallScore !== null && interview.overallScore !== undefined ? `${interview.overallScore}%` : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
