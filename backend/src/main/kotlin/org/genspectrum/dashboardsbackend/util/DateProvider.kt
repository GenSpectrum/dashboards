package org.genspectrum.dashboardsbackend.util

import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.springframework.stereotype.Component
import kotlin.time.Clock

@Component
class DateProvider {
    fun getCurrentDate() = Clock.System.now().toLocalDateTime(TimeZone.UTC).date
}
