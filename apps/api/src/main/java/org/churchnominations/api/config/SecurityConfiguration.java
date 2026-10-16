package org.churchnominations.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfiguration {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Configuration
    @Profile("dev")
    static class DevSecurityConfiguration {
        @Bean
        SecurityFilterChain devSecurityFilterChain(
                HttpSecurity http,
                UserDetailsService userDetailsService) throws Exception {
            http.cors(Customizer.withDefaults())
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/nomination-intakes/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/nomination-intakes/**").permitAll()
                        .requestMatchers("/api/elections/**").hasRole("CHURCH_ADMIN")
                        .requestMatchers("/api/boards/**").hasRole("CHURCH_ADMIN")
                        .requestMatchers("/api/churches/**", "/api/auth/me").authenticated()
                        .anyRequest().denyAll())
                    .httpBasic(Customizer.withDefaults())
                    .userDetailsService(userDetailsService);
            return http.build();
        }
    }

    @Configuration
    @Profile("!dev")
    static class NonDevSecurityConfiguration {
        @Bean
        SecurityFilterChain nonDevSecurityFilterChain(HttpSecurity http) throws Exception {
            http.cors(Customizer.withDefaults())
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(authorize -> authorize
                            .requestMatchers("/api/health").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/nomination-intakes/**").permitAll()
                            .requestMatchers(HttpMethod.PUT, "/api/nomination-intakes/**").permitAll()
                            .anyRequest().denyAll());
            return http.build();
        }
    }
}