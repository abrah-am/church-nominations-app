package org.churchnominations.api.board;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "board_members")
public class BoardMember {
    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String name;

    protected BoardMember() {
    }

    BoardMember(Board board, String name) {
        this.board = board;
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public Board getBoard() {
        return board;
    }

    public String getName() {
        return name;
    }
}