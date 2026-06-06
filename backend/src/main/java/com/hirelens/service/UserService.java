package com.hirelens.service;

import com.hirelens.dto.UpdateSkillsRequest;
import com.hirelens.dto.UserProfileDto;
import com.hirelens.model.Interview;
import com.hirelens.model.User;
import com.hirelens.repository.InterviewRepository;
import com.hirelens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final InterviewRepository interviewRepository;

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Interview> interviews = interviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        long totalInterviews = interviews.size();

        OptionalDouble avg = interviews.stream()
                .filter(i -> i.getOverallScore() != null)
                .mapToInt(Interview::getOverallScore)
                .average();

        return UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .skills(user.getSkills())
                .totalInterviews(totalInterviews)
                .averageScore(avg.isPresent() ? Math.round(avg.getAsDouble() * 10.0) / 10.0 : null)
                .build();
    }

    @Transactional
    public UserProfileDto updateSkills(String email, UpdateSkillsRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setSkills(request.getSkills());
        userRepository.save(user);

        return getProfile(email);
    }
}
