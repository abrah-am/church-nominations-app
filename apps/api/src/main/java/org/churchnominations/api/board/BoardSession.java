package org.churchnominations.api.board;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "board_sessions")
public class BoardSession {
    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @ManyToMany
    @JoinTable(name = "board_session_attendance",
            joinColumns = @JoinColumn(name = "session_id"),
            inverseJoinColumns = @JoinColumn(name = "member_id"))
    private List<BoardMember> attendedMembers = new ArrayList<>();

    protected BoardSession() {
    }

    BoardSession(Board board, LocalDate sessionDate) {
        this.board = board;
        this.sessionDate = sessionDate;
    }

    public UUID getId() {
        return id;
    }

    public Board getBoard() {
        return board;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public List<BoardMember> getAttendedMembers() {
        return attendedMembers;
    }

    public void replaceAttendance(List<BoardMember> members) {
        attendedMembers.clear();
        attendedMembers.addAll(members);
    }
}