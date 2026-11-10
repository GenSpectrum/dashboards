package org.genspectrum.dashboardsbackend.model.subscription

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.json.jsonb
import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.jacksonObjectMapper
import tools.jackson.module.kotlin.readValue

val jacksonObjectMapper: ObjectMapper = jacksonObjectMapper()
inline fun <reified T : Any> Table.jacksonSerializableJsonb(columnName: String) = jsonb<T>(
    columnName,
    ::serialize,
    ::deserialize,
)

inline fun <reified T : Any> serialize(value: T): String = jacksonObjectMapper.writeValueAsString(value)

inline fun <reified T : Any> deserialize(value: String): T = jacksonObjectMapper.readValue(value)
