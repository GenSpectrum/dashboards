package org.genspectrum.dashboardsbackend.util

import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.springframework.stereotype.Component

@Component
class DateProvider {
    fun getCurrentDate() = Clock.System.now().toLocalDateTime(TimeZone.UTC).date
}
