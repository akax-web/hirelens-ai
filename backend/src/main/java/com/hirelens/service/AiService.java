package com.hirelens.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    @Value("${openai.api.key:}")
    private String openAiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openAiUrl;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private boolean isAiEnabled() {
        return openAiKey != null && !openAiKey.isBlank() && !openAiKey.equals("YOUR_OPENAI_API_KEY");
    }

    // =========================================================
    //  Generate Questions
    // =========================================================
    public List<String> generateQuestions(String skills, int count) {
        if (!isAiEnabled()) {
            log.info("OpenAI key not set - using mock questions for skills: {}", skills);
            return generateMockQuestions(skills, count);
        }

        String prompt = String.format(
            "You are an expert technical interviewer. Generate exactly %d interview questions for a candidate with the following skills: %s. " +
            "Questions should be practical, thought-provoking, and progressively harder. " +
            "Return ONLY a numbered list, one question per line, no additional text.",
            count, skills
        );

        String response = callOpenAI(prompt);
        if (response == null) return generateMockQuestions(skills, count);

        List<String> questions = new ArrayList<>();
        for (String line : response.split("\n")) {
            String q = line.replaceAll("^\\d+\\.\\s*", "").trim();
            if (!q.isBlank()) questions.add(q);
        }
        return questions.size() >= count ? questions.subList(0, count) : questions;
    }

    // =========================================================
    //  Evaluate Answers
    // =========================================================
    public EvaluationResult evaluateAnswers(List<QuestionAnswerPair> pairs, String skills) {
        if (!isAiEnabled()) {
            log.info("OpenAI key not set - using mock evaluation");
            return generateMockEvaluation(pairs);
        }

        StringBuilder qa = new StringBuilder();
        for (int i = 0; i < pairs.size(); i++) {
            qa.append(String.format("Q%d: %s\nA%d: %s\n\n", i + 1, pairs.get(i).question(), i + 1, pairs.get(i).answer()));
        }

        String prompt = String.format(
            "You are an expert interview coach. Evaluate the following interview Q&A for a candidate with skills: %s.\n\n%s\n" +
            "Provide your evaluation in exactly this JSON format:\n" +
            "{\n" +
            "  \"overallScore\": <integer 0-100>,\n" +
            "  \"strengths\": \"<bullet points of strengths>\",\n" +
            "  \"weaknesses\": \"<bullet points of weaknesses>\",\n" +
            "  \"improvementTips\": \"<actionable tips to improve>\",\n" +
            "  \"questionScores\": [<score 0-100 for each answer in order>],\n" +
            "  \"questionFeedbacks\": [\"<feedback for each answer in order>\"]\n" +
            "}",
            skills, qa
        );

        String response = callOpenAI(prompt);
        if (response == null) return generateMockEvaluation(pairs);

        try {
            String jsonStr = extractJson(response);
            JsonNode node = objectMapper.readTree(jsonStr);
            List<Integer> scores = new ArrayList<>();
            List<String> feedbacks = new ArrayList<>();

            if (node.has("questionScores")) {
                for (JsonNode s : node.get("questionScores")) scores.add(s.asInt(60));
            }
            if (node.has("questionFeedbacks")) {
                for (JsonNode f : node.get("questionFeedbacks")) feedbacks.add(f.asText());
            }

            while (scores.size() < pairs.size()) scores.add(60);
            while (feedbacks.size() < pairs.size()) feedbacks.add("Good attempt.");

            return new EvaluationResult(
                node.path("overallScore").asInt(65),
                node.path("strengths").asText("Good foundational knowledge."),
                node.path("weaknesses").asText("Some areas need improvement."),
                node.path("improvementTips").asText("Practice more complex scenarios."),
                scores, feedbacks
            );
        } catch (Exception e) {
            log.error("Failed to parse AI evaluation response", e);
            return generateMockEvaluation(pairs);
        }
    }

    // =========================================================
    //  OpenAI HTTP Call
    // =========================================================
    private String callOpenAI(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("max_tokens", 1500);
            body.put("temperature", 0.7);
            body.put("messages", List.of(
                Map.of("role", "system", "content", "You are a professional AI interview coach."),
                Map.of("role", "user", "content", prompt)
            ));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(openAiUrl, HttpMethod.POST, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
            return null;
        }
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        return (start >= 0 && end >= 0) ? text.substring(start, end + 1) : text;
    }

    // =========================================================
    //  Mock Data (fallback)
    // =========================================================
    private List<String> generateMockQuestions(String skills, int count) {
        List<String> pool = new ArrayList<>();
        String s = skills.toLowerCase();

        if (s.contains("java")) {
            pool.addAll(List.of(
                "Explain the difference between an interface and an abstract class in Java.",
                "How does Java's garbage collection work? Describe the different GC algorithms.",
                "What are the SOLID principles? Give an example for each.",
                "Explain the difference between HashMap, LinkedHashMap, and TreeMap.",
                "What is the Java Memory Model and how does it affect concurrency?"
            ));
        }
        if (s.contains("spring")) {
            pool.addAll(List.of(
                "What is Dependency Injection and how does Spring implement it?",
                "Explain the difference between @Controller and @RestController.",
                "How does Spring Security handle authentication and authorization?",
                "What is the purpose of the @Transactional annotation?",
                "Explain Spring Boot auto-configuration and how it works."
            ));
        }
        if (s.contains("sql") || s.contains("mysql") || s.contains("database")) {
            pool.addAll(List.of(
                "What is the difference between INNER JOIN and OUTER JOIN?",
                "Explain database normalization and the different normal forms.",
                "How do indexes work in MySQL and when should you use them?",
                "What is a transaction? Explain ACID properties.",
                "How would you optimize a slow SQL query?"
            ));
        }
        if (s.contains("react") || s.contains("javascript") || s.contains("js")) {
            pool.addAll(List.of(
                "Explain the difference between useState and useEffect in React.",
                "What is the Virtual DOM and how does React use it for performance?",
                "What is the event loop in JavaScript? How does async/await work?",
                "Explain closures in JavaScript with an example.",
                "What are React hooks and why were they introduced?"
            ));
        }
        if (s.contains("python")) {
            pool.addAll(List.of(
                "What is the difference between a list and a tuple in Python?",
                "Explain Python decorators and give a practical example.",
                "What is the GIL (Global Interpreter Lock) and how does it affect threading?",
                "Describe Python generators and their use cases.",
                "How does memory management work in Python?"
            ));
        }

        // General fallback questions
        pool.addAll(List.of(
            "Tell me about a challenging project you worked on and how you overcame the difficulties.",
            "How do you approach debugging a complex issue in production?",
            "Explain the concept of RESTful APIs and their best practices.",
            "Describe the differences between synchronous and asynchronous programming.",
            "How do you ensure code quality in a team environment?",
            "What is the CAP theorem and how does it apply to distributed systems?",
            "Describe your approach to designing a scalable system.",
            "Explain the difference between unit tests, integration tests, and end-to-end tests.",
            "How would you handle a situation where a third-party API you depend on goes down?",
            "Describe your experience with version control systems and branching strategies."
        ));

        Collections.shuffle(pool);
        return pool.subList(0, Math.min(count, pool.size()));
    }

    private EvaluationResult generateMockEvaluation(List<QuestionAnswerPair> pairs) {
        List<Integer> scores = new ArrayList<>();
        List<String> feedbacks = new ArrayList<>();

        Random random = new Random();
        int totalScore = 0;

        for (QuestionAnswerPair pair : pairs) {
            int score;
            String feedback;
            if (pair.answer() == null || pair.answer().trim().length() < 20) {
                score = 20 + random.nextInt(20);
                feedback = "Your answer was too brief. Try to elaborate with specific examples and technical details.";
            } else if (pair.answer().trim().length() < 80) {
                score = 45 + random.nextInt(20);
                feedback = "Decent attempt! Add more technical depth and real-world examples to strengthen your answer.";
            } else {
                score = 65 + random.nextInt(25);
                feedback = "Good answer! You demonstrated solid understanding. Consider mentioning edge cases and best practices for a perfect score.";
            }
            scores.add(score);
            feedbacks.add(feedback);
            totalScore += score;
        }

        int overall = pairs.isEmpty() ? 0 : totalScore / pairs.size();

        String strengths, weaknesses, tips;
        if (overall >= 75) {
            strengths = "• Strong technical knowledge\n• Clear communication\n• Good use of examples";
            weaknesses = "• Could explore more edge cases\n• Some answers could be more concise";
            tips = "• Practice system design questions\n• Work on explaining complex topics simply\n• Review advanced concepts in your stack";
        } else if (overall >= 50) {
            strengths = "• Shows foundational understanding\n• Attempts to answer all questions";
            weaknesses = "• Needs more technical depth\n• Limited use of real-world examples\n• Some key concepts missing";
            tips = "• Build and deploy more projects\n• Study design patterns\n• Practice coding problems daily\n• Read documentation thoroughly";
        } else {
            strengths = "• Willing to attempt all questions\n• Shows some basic awareness";
            weaknesses = "• Significant gaps in technical knowledge\n• Answers lack depth and clarity\n• Core concepts need reinforcement";
            tips = "• Start with fundamentals and build up\n• Take structured courses\n• Work on personal projects\n• Join coding communities and get feedback";
        }

        return new EvaluationResult(overall, strengths, weaknesses, tips, scores, feedbacks);
    }

    // =========================================================
    //  Records / Inner Types
    // =========================================================
    public record QuestionAnswerPair(String question, String answer) {}

    public record EvaluationResult(
        int overallScore,
        String strengths,
        String weaknesses,
        String improvementTips,
        List<Integer> questionScores,
        List<String> questionFeedbacks
    ) {}
}
