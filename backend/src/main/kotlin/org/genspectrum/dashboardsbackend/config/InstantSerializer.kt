package org.genspectrum.dashboardsbackend.config

import org.springframework.boot.jackson.JacksonComponent
import tools.jackson.core.JsonGenerator
import tools.jackson.core.JsonParser
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.SerializationContext
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.ValueSerializer
import kotlin.time.Instant

@JacksonComponent
class InstantSerializer : ValueSerializer<Instant>() {
    override fun serialize(value: Instant, gen: JsonGenerator, serializers: SerializationContext) {
        gen.writeString(value.toString())
    }
}

@JacksonComponent
class InstantDeserializer : ValueDeserializer<Instant>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Instant = Instant.parse(p.valueAsString)
}
