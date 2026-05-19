package org.genspectrum.dashboardsbackend.util

import kotlin.time.Clock
import kotlin.time.Instant

// Truncate to milliseconds to avoid mismatches between the in-memory value
// we return and what is read back from the DB.
fun now(): Instant = Clock.System.now().run {
    Instant.fromEpochMilliseconds(toEpochMilliseconds())
}
