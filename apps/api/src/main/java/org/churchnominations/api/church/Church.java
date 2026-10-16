package org.churchnominations.api.church;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.churchnominations.api.identity.Account;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "churches")
public class Church {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_account_id", unique = true)
    private Account adminAccount;

    protected Church() {
    }

    public Church(String name, Account adminAccount) {
        this.name = name;
        this.adminAccount = adminAccount;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Account getAdminAccount() {
        return adminAccount;
    }
}