package com.hirelens.controller;

import com.hirelens.dto.GenerateQuestionsRequest;
import com.hirelens.dto.InterviewDetailDto;
import com.hirelens.dto.InterviewSummaryDto;
import com.hirelens.dto.SubmitAnswersRequest;
import com.hirelens.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/generate")
    public ResponseEntity<InterviewDetailDto> generateInterview(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody GenerateQuestionsRequest request) {
        InterviewDetailDto result = interviewService.generateInterview(userDetails.getUsername(), request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<InterviewDetailDto> submitAnswers(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody SubmitAnswersRequest request) {
        request.setInterviewId(id);
        InterviewDetailDto result = interviewService.submitAnswers(userDetails.getUsername(), request);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<InterviewSummaryDto>> getAllInterviews(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<InterviewSummaryDto> interviews = interviewService.getUserInterviews(userDetails.getUsername());
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterviewDetailDto> getInterview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        InterviewDetailDto detail = interviewService.getInterviewDetail(userDetails.getUsername(), id);
        return ResponseEntity.ok(detail);
    }
}
