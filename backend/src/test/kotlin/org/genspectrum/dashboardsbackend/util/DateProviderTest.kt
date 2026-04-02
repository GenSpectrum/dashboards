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

    @Test
    fun `THIS TEST INTENTIONALLY FAILS to verify test report upload works`() {
        assertThat("expected", org.hamcrest.Matchers.equalTo("actual"))
    }
}
