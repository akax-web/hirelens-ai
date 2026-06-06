package com.hirelens.service;

import com.hirelens.dto.*;
import com.hirelens.model.*;
import com.hirelens.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final AiService aiService;

    @Transactional
    public InterviewDetailDto generateInterview(String userEmail, GenerateQuestionsRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate questions via AI
        List<String> questionTexts = aiService.generateQuestions(request.getSkills(), request.getQuestionCount());

        InterviewMode mode;
        try {
            mode = InterviewMode.valueOf(request.getMode().toUpperCase());
        } catch (Exception e) {
            mode = InterviewMode.PRACTICE;
        }

        // Build interview title
        String title = buildTitle(request.getSkills(), mode);

        // Save interview
        Interview interview = Interview.builder()
                .user(user)
                .title(title)
                .mode(mode)
                .skillsTested(request.getSkills())
                .build();
        Interview savedInterview = interviewRepository.save(interview);

        // Save questions
        List<Question> savedQuestions = new ArrayList<>();
        for (int i = 0; i < questionTexts.size(); i++) {
            Question q = Question.builder()
                    .interview(savedInterview)
                    .questionText(questionTexts.get(i))
                    .orderIndex(i + 1)
                    .build();
            savedQuestions.add(questionRepository.save(q));
        }

        return buildDetailDto(savedInterview, savedQuestions);
    }

    @Transactional
    public InterviewDetailDto submitAnswers(String userEmail, SubmitAnswersRequest request) {
        Interview interview = interviewRepository.findById(request.getInterviewId())
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        // Verify ownership
        if (!interview.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: This interview belongs to another user");
        }

        List<Question> questions = questionRepository.findByInterviewIdOrderByOrderIndexAsc(interview.getId());

        // Build QA pairs for evaluation
        List<AiService.QuestionAnswerPair> pairs = new ArrayList<>();
        List<Answer> savedAnswers = new ArrayList<>();

        for (SubmitAnswersRequest.AnswerSubmission sub : request.getAnswers()) {
            Question question = questions.stream()
                    .filter(q -> q.getId().equals(sub.getQuestionId()))
                    .findFirst()
                    .orElse(null);

            if (question != null) {
                pairs.add(new AiService.QuestionAnswerPair(question.getQuestionText(), sub.getAnswerText()));

                // Save answer temporarily (scores added after eval)
                Answer ans = Answer.builder()
                        .question(question)
                        .answerText(sub.getAnswerText())
                        .score(0)
                        .feedback("")
                        .build();
                savedAnswers.add(answerRepository.save(ans));
            }
        }

        // Evaluate
        AiService.EvaluationResult result = aiService.evaluateAnswers(pairs, interview.getSkillsTested());

        // Update answers with scores
        for (int i = 0; i < savedAnswers.size(); i++) {
            Answer ans = savedAnswers.get(i);
            ans.setScore(i < result.questionScores().size() ? result.questionScores().get(i) : 60);
            ans.setFeedback(i < result.questionFeedbacks().size() ? result.questionFeedbacks().get(i) : "Good attempt.");
            answerRepository.save(ans);
        }

        // Update interview with evaluation
        interview.setOverallScore(result.overallScore());
        interview.setStrengths(result.strengths());
        interview.setWeaknesses(result.weaknesses());
        interview.setImprovementTips(result.improvementTips());
        interviewRepository.save(interview);

        // Reload fresh data
        List<Question> freshQuestions = questionRepository.findByInterviewIdOrderByOrderIndexAsc(interview.getId());
        return buildDetailDto(interview, freshQuestions);
    }

    @Transactional(readOnly = true)
    public List<InterviewSummaryDto> getUserInterviews(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return interviewRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(i -> InterviewSummaryDto.builder()
                        .id(i.getId())
                        .title(i.getTitle())
                        .mode(i.getMode().name())
                        .overallScore(i.getOverallScore())
                        .skillsTested(i.getSkillsTested())
                        .questionCount(i.getQuestions().size())
                        .createdAt(i.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InterviewDetailDto getInterviewDetail(String userEmail, Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        if (!interview.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        List<Question> questions = questionRepository.findByInterviewIdOrderByOrderIndexAsc(interviewId);
        return buildDetailDto(interview, questions);
    }

    // =========================================================
    //  Helpers
    // =========================================================
    private String buildTitle(String skills, InterviewMode mode) {
        String[] skillArr = skills.split("[,;\\s]+");
        String primarySkill = skillArr.length > 0 ? capitalize(skillArr[0].trim()) : "Technical";
        return primarySkill + " " + capitalize(mode.name().toLowerCase()) + " Interview";
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }

    private InterviewDetailDto buildDetailDto(Interview interview, List<Question> questions) {
        List<InterviewDetailDto.QuestionAnswerDto> qaDtos = questions.stream().map(q -> {
            Answer ans = q.getAnswer();
            return InterviewDetailDto.QuestionAnswerDto.builder()
                    .questionId(q.getId())
                    .questionText(q.getQuestionText())
                    .orderIndex(q.getOrderIndex())
                    .answerId(ans != null ? ans.getId() : null)
                    .answerText(ans != null ? ans.getAnswerText() : null)
                    .score(ans != null ? ans.getScore() : null)
                    .feedback(ans != null ? ans.getFeedback() : null)
                    .build();
        }).collect(Collectors.toList());

        return InterviewDetailDto.builder()
                .id(interview.getId())
                .title(interview.getTitle())
                .mode(interview.getMode().name())
                .overallScore(interview.getOverallScore())
                .strengths(interview.getStrengths())
                .weaknesses(interview.getWeaknesses())
                .improvementTips(interview.getImprovementTips())
                .skillsTested(interview.getSkillsTested())
                .createdAt(interview.getCreatedAt())
                .questions(qaDtos)
                .build();
    }
}
