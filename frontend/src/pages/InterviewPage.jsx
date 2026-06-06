import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { interviewApi } from '../services/api'

export default function InterviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [skills, setSkills] = useState(user?.skills || '')
  const [skillInput, setSkillInput] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [mode, setMode] = useState('PRACTICE')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [sessionData, setSessionData] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const skillArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []

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
      setError(err.response?.data?.message || 'Failed to generate interview questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (e) => {
    setAnswers({ ...answers, [currentIndex]: e.target.value })
  }

  const handleNext = () => {
    if (currentIndex < sessionData.questions.length - 1) setCurrentIndex(currentIndex + 1)
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const submitInterview = async () => {
    setSubmitting(true)
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

  // --- Setup View ---
  if (!sessionData) {
    return (
      <div className="page">
        <Navbar />
        <div className="interview-page">
          <div className="interview-setup">
            <div className="interview-setup-header">
              <h1>Practice Session Setup</h1>
              <p>Customize your AI interview experience</p>
            </div>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <div className="card-glass" style={{ marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Skills to Test</label>
                <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="form-input"
                    placeholder="E.g., React, Java, System Design..."
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
              className="btn btn-primary btn-lg btn-full" 
              onClick={startSession}
              disabled={loading || !skills.trim()}
            >
              {loading ? 'Generating AI Questions...' : 'Start Practice Session'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Session View ---
  const q = sessionData.questions[currentIndex]
  const progress = ((currentIndex + 1) / sessionData.questions.length) * 100

  return (
    <div className="page">
      <Navbar />
      <div className="interview-page">
        <div className="question-session">
          
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-label">
            <span>Question {currentIndex + 1} of {sessionData.questions.length}</span>
            <span>Practice Mode</span>
          </div>

          <div className="question-card">
            <div className="question-number">Question {currentIndex + 1}</div>
            <div className="question-text">{q.questionText}</div>
          </div>

          <div className="answer-card">
            <label>Your Answer</label>
            <textarea
              className="answer-textarea"
              placeholder="Type your answer here... Be as detailed as possible."
              value={answers[currentIndex] || ''}
              onChange={handleAnswerChange}
            />
            <div className="question-actions">
              <span className="char-count">{(answers[currentIndex] || '').length} characters</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={handlePrev} disabled={currentIndex === 0}>
              ← Previous
            </button>
            
            {currentIndex === sessionData.questions.length - 1 ? (
              <button className="btn btn-cyan" onClick={submitInterview} disabled={submitting}>
                {submitting ? 'Evaluating...' : 'Submit & Get Results'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleNext}>
                Next Question →
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
