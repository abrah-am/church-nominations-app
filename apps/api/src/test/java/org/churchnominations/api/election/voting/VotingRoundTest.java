package org.churchnominations.api.election.voting;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class VotingRoundTest {
    @Test
    void resetReturnsClosedRoundToFreshDraftAndIncrementsResetCount() {
        UUID positionId = UUID.randomUUID();
        VotingRound round = new VotingRound(positionId, 1, 2);
        round.activate(12);
        round.close(VotingRoundCloseReason.ADMIN);
        round.reveal("admin@example.org", java.time.Instant.now());

        round.reset();

        assertEquals(VotingRoundStatus.DRAFT, round.getStatus());
        assertEquals(1, round.getResetCount());
        assertNull(round.getSelectionCount());
        assertNull(round.getExpectedVoterCount());
        assertNull(round.getAccessToken());
        assertNull(round.getCloseReason());
        assertNull(round.getRevealedAt());
        assertNull(round.getRevealedBy());
    }
}