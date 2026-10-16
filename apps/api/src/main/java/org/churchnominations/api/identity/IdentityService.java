package org.churchnominations.api.identity;

import org.churchnominations.api.church.ChurchRepository;
import org.churchnominations.api.church.ChurchResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class IdentityService {
    private final AccountRepository accounts;
    private final ChurchRepository churches;
    private final PasswordEncoder passwordEncoder;

    public IdentityService(AccountRepository accounts, ChurchRepository churches, PasswordEncoder passwordEncoder) {
        this.accounts = accounts;
        this.churches = churches;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AccountResponse register(RegistrationRequest request) {
        String email = normalizeEmail(request.email());
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new InvalidRegistrationException();
        }
        if (accounts.existsByEmail(email)) {
            throw new AccountAlreadyExistsException();
        }
        Account account;
        try {
            account = accounts.saveAndFlush(new Account(email, passwordEncoder.encode(request.password())));
        } catch (DataIntegrityViolationException exception) {
            throw new AccountAlreadyExistsException();
        }
        return response(account);
    }

    public AccountResponse getCurrent(String email) {
        Account account = accounts.findByEmail(normalizeEmail(email)).orElseThrow();
        return response(account);
    }

    private AccountResponse response(Account account) {
        var church = churches.findByAdminAccountEmail(account.getEmail())
                .map(ChurchResponse::from)
                .orElse(null);
        return new AccountResponse(account.getId(), account.getEmail(), church);
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}