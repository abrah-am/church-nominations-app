package org.churchnominations.api.identity;

import org.churchnominations.api.church.ChurchResponse;

import java.util.UUID;

public record AccountResponse(UUID id, String email, ChurchResponse church) {
}