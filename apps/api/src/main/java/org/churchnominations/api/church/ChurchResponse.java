package org.churchnominations.api.church;

import java.util.UUID;

public record ChurchResponse(UUID id, String name) {
    public static ChurchResponse from(Church church) {
        return new ChurchResponse(church.getId(), church.getName());
    }
}