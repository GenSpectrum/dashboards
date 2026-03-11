package org.genspectrum.dashboardsbackend.util

import org.genspectrum.dashboardsbackend.controller.BadRequestException
import java.util.UUID

fun convertToUuid(id: String): UUID = try {
    UUID.fromString(id)
} catch (_: IllegalArgumentException) {
    throw BadRequestException("Invalid UUID $id")
}
