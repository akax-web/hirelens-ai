package com.hirelens.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InterviewDetailDto {
    private Long id;
    private String title;
    private String mode;
    private Integer overallScore;
    private String strengths;
    private String weaknesses;
    private String improvementTips;
    private String skillsTested;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;
    
    private List<QuestionAnswerDto> questions;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class QuestionAnswerDto {
        private Long questionId;
        private String questionText;
        private Integer orderIndex;
        private Long answerId;
        private String answerText;
        private Integer score;
        private String feedback;
    }
}
