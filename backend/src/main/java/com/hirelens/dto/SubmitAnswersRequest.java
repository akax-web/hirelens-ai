package com.hirelens.dto;

import lombok.Data;
import java.util.List;

@Data
public class SubmitAnswersRequest {
    private Long interviewId;
    private List<AnswerSubmission> answers;

    @Data
    public static class AnswerSubmission {
        private Long questionId;
        private String answerText;
    }
}
