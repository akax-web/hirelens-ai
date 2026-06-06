import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { interviewApi } from '../services/api'

export default function MockInterviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [skills, setSkills] = useState(user?.skills || '')
  const [skillInput, setSkillInput] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const mode = 'MOCK'
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [sessionData, setSessionData] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Timer state (seconds per question)
  const timePerQuestion = 180; // 3 minutes
  const [timeLeft, setTimeLeft] = useState(timePerQuestion)
  const timerRef = useRef(null)

  const skillArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []

  useEffect(() => {
    if (sessionData && !submitting) {
      startTimer()
    }
    return () => clearInterval(timerRef.current)
  }, [sessionData, currentIndex, submitting])

  const startTimer = () => {
    clearInterval(timerRef.current)
    setTimeLeft(timePerQuestion)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleTimeUp = () => {
    if (currentIndex < sessionData.questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      submitInterview()
    }
  }

  const handleAddSkill = (e) => {
    e.preventDefault()
    if (!skillInput.trim()) return
    if (!skillArray.includes(skillInput.trim())) {
      const newSkills = [...skillArray, skillInput.trim()].join(', ')
      setSkills(newSkills)
    }
    setSkillInput('')
  }

  const handleRemoveSkill = (skill) => {
    setSkills(skillArray.filter(s => s !== skill).join(', '))
  }

  const startSession = async () => {
    if (!skills.trim()) {
      setError('Please add at least one skill')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await interviewApi.generate({ skills, questionCount, mode })
      setSessionData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate mock interview')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (e) => {
    setAnswers({ ...answers, [currentIndex]: e.target.value })
  }

  const handleNext = () => {
    if (currentIndex < sessionData.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      submitInterview()
    }
  }

  const submitInterview = async () => {
    setSubmitting(true)
    clearInterval(timerRef.current)
    try {
      const payload = sessionData.questions.map((q, idx) => ({
        questionId: q.questionId,
        answerText: answers[idx] || ''
      }))
      await interviewApi.submit(sessionData.id, payload)
      navigate(`/result/${sessionData.id}`)
    } catch (err) {
      setError('Failed to submit answers')
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // --- Setup View ---
  if (!sessionData) {
    return (
      <div className="page">
        <Navbar />
        <div className="interview-page">
          <div className="interview-setup">
            <div className="interview-setup-header">
              <h1>Mock Interview Setup</h1>
              <p>Simulate a real technical interview under time pressure</p>
            </div>
            
            <div className="alert alert-info" style={{marginBottom: 24}}>
              <strong>Mock Mode Rules:</strong>
              <ul style={{marginLeft: 20, marginTop: 8}}>
                <li>You will have 3 minutes per question.</li>
                <li>You cannot go back to previous questions.</li>
                <li>When the timer runs out, it auto-advances.</li>
              </ul>
            </div>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <div className="card-glass" style={{ marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Role / Skills to Test</label>
                <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="form-input"
                    placeholder="E.g., Full Stack Developer, Java..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary">Add</button>
                </form>
                <div className="skills-tag-input">
                  {skillArray.map(skill => (
                    <span key={skill} className="skill-tag">
                      {skill} <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 24 }}>
                <label className="form-label">Number of Questions</label>
                <div className="count-selector">
                  {[3, 5, 7, 10].map(num => (
                    <button 
                      key={num} 
                      className={`count-btn ${questionCount === num ? 'active' : ''}`}
                      onClick={() => setQuestionCount(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              className="btn btn-cyan btn-lg btn-full" 
              onClick={startSession}
              disabled={loading || !skills.trim()}
            >
              {loading ? 'Preparing Mock Interview...' : 'Start Mock Interview Now'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Session View ---
  const q = sessionData.questions[currentIndex]
  const progress = ((currentIndex + 1) / sessionData.questions.length) * 100
  const timerClass = timeLeft <= 30 ? 'timer-urgent' : timeLeft <= 60 ? 'timer-warn' : 'timer-ok'

  return (
    <div className="page">
      <Navbar />
      <div className="interview-page">
        <div className="question-session">
          
          <div className="timer-bar">
            <div>
              <div style={{fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)'}}>Time Remaining</div>
              <div className={`timer-display ${timerClass}`}>{formatTime(timeLeft)}</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)'}}>Progress</div>
              <div style={{fontWeight: 600}}>Question {currentIndex + 1} of {sessionData.questions.length}</div>
            </div>
          </div>
          
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="question-card">
            <div className="question-number">Question {currentIndex + 1}</div>
            <div className="question-text">{q.questionText}</div>
          </div>

          <div className="answer-card">
            <label>Your Answer</label>
            <textarea
              className="answer-textarea"
              placeholder="Type your answer here..."
              value={answers[currentIndex] || ''}
              onChange={handleAnswerChange}
            />
            <div className="question-actions">
              <span className="char-count">{(answers[currentIndex] || '').length} characters</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn btn-cyan" onClick={handleNext} disabled={submitting}>
              {submitting ? 'Evaluating...' : (currentIndex === sessionData.questions.length - 1 ? 'Submit Mock Interview' : 'Next Question →')}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  )
}
