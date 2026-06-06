package com.hirelens.controller;

import com.hirelens.dto.UpdateSkillsRequest;
import com.hirelens.dto.UserProfileDto;
import com.hirelens.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UserProfileDto profile = userService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me/skills")
    public ResponseEntity<UserProfileDto> updateSkills(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateSkillsRequest request) {
        UserProfileDto updated = userService.updateSkills(userDetails.getUsername(), request);
        return ResponseEntity.ok(updated);
    }
}
