package org.churchnominations.api.church;

import org.churchnominations.api.identity.Account;
import org.churchnominations.api.identity.AccountRepository;
import org.churchnominations.api.identity.IdentityService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ChurchService {
    private final AccountRepository accounts;
    private final ChurchRepository churches;

    public ChurchService(AccountRepository accounts, ChurchRepository churches) {
        this.accounts = accounts;
        this.churches = churches;
    }

    @Transactional
    public ChurchResponse create(String accountEmail, ChurchRequest request) {
        Account account = accounts.findByEmail(IdentityService.normalizeEmail(accountEmail)).orElseThrow();
        if (churches.existsByAdminAccountEmail(account.getEmail())) {
            throw new ChurchAlreadyExistsException();
        }
        try {
            return ChurchResponse.from(churches.saveAndFlush(new Church(request.name().trim(), account)));
        } catch (DataIntegrityViolationException exception) {
            throw new ChurchAlreadyExistsException();
        }
    }

    public List<ChurchResponse> current(String accountEmail) {
        return churches.findAllByAdminAccountEmailOrderByNameAsc(IdentityService.normalizeEmail(accountEmail)).stream()
                .map(ChurchResponse::from)
                .toList();
    }
}