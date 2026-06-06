package com.hirelens.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateQuestionsRequest {
    @NotBlank(message = "Skills are required")
    private String skills;

    @Min(1) @Max(15)
    private int questionCount = 5;

    private String mode = "PRACTICE";
}
