package org.churchnominations.api.board;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "boards")
public class Board {
    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "church_id", nullable = false, updatable = false)
    private UUID churchId;

    @Column(name = "board_year", nullable = false)
    private int year;

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("name ASC")
    private List<BoardMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sessionDate ASC")
    private List<BoardSession> sessions = new ArrayList<>();

    protected Board() {
    }

    public Board(UUID churchId, int year, List<String> memberNames) {
        this.churchId = churchId;
        this.year = year;
        memberNames.forEach(name -> members.add(new BoardMember(this, name)));
    }

    public UUID getId() {
        return id;
    }

    public UUID getChurchId() {
        return churchId;
    }

    public int getYear() {
        return year;
    }

    public List<BoardMember> getMembers() {
        return members;
    }

    public List<BoardSession> getSessions() {
        return sessions;
    }

    public BoardSession addSession(java.time.LocalDate sessionDate) {
        BoardSession session = new BoardSession(this, sessionDate);
        sessions.add(session);
        return session;
    }
}