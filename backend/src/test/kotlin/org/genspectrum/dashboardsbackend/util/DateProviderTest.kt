package org.genspectrum.dashboardsbackend.util

import kotlinx.datetime.LocalDate
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.instanceOf
import org.junit.jupiter.api.Test

class DateProviderTest {
    private val underTest = DateProvider()

    @Test
    fun `WHEN getting current date THEN returns some date`() {
        val currentDate = underTest.getCurrentDate()

        assertThat(currentDate, instanceOf(LocalDate::class.java))
    }
}
