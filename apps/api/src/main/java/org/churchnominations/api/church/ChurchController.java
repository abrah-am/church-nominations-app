package org.churchnominations.api.church;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/churches")
public class ChurchController {
    private final ChurchService churches;

    public ChurchController(ChurchService churches) {
        this.churches = churches;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChurchResponse create(Authentication authentication, @Valid @RequestBody ChurchRequest request) {
        return churches.create(authentication.getName(), request);
    }

    @GetMapping("/my")
    public List<ChurchResponse> current(Authentication authentication) {
        return churches.current(authentication.getName());
    }
}