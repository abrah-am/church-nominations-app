package org.churchnominations.api.identity;

import org.churchnominations.api.church.ChurchRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final AccountRepository accounts;
    private final ChurchRepository churches;

    public DatabaseUserDetailsService(AccountRepository accounts, ChurchRepository churches) {
        this.accounts = accounts;
        this.churches = churches;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String email = username.trim().toLowerCase(java.util.Locale.ROOT);
        Account account = accounts.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        var builder = User.withUsername(account.getEmail()).password(account.getPasswordHash());
        if (churches.existsByAdminAccountEmail(account.getEmail())) {
            return builder.authorities("ROLE_CHURCH_ADMIN").build();
        }
        return builder.authorities(new String[0]).build();
    }
}