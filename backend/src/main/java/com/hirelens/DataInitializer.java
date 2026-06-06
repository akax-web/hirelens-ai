package com.hirelens;

import com.hirelens.model.User;
import com.hirelens.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedDemoUser();
    }

    private void seedDemoUser() {
        String demoEmail = "demo@hirelens.ai";
        if (!userRepository.existsByEmail(demoEmail)) {
            User demo = User.builder()
                    .name("Demo User")
                    .email(demoEmail)
                    .password(passwordEncoder.encode("demo1234"))
                    .skills("Java, Spring Boot, MySQL, REST APIs, React")
                    .build();
            userRepository.save(demo);
            log.info("✅ Demo user created: {} / demo1234", demoEmail);
        } else {
            log.info("ℹ️ Demo user already exists: {}", demoEmail);
        }
    }
}
