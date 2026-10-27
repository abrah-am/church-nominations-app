package org.churchnominations.api.nominations;

import java.util.UUID;

public record PresentationSessionResponse(UUID accessToken, String viewerPath, boolean visible) {
}