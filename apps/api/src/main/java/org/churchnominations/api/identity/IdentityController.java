package org.churchnominations.api.identity;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class IdentityController {
    private final IdentityService identity;

    public IdentityController(IdentityService identity) {
        this.identity = identity;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse register(@Valid @RequestBody RegistrationRequest request) {
        return identity.register(request);
    }

    @GetMapping("/me")
    public AccountResponse current(Authentication authentication) {
        return identity.getCurrent(authentication.getName());
    }
}