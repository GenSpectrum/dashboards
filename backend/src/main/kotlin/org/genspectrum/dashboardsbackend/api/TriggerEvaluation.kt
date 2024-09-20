package org.genspectrum.dashboardsbackend.api

data class TriggerEvaluationResponse(
    val result: TriggerEvaluationResult,
)

sealed interface TriggerEvaluationResult {
    data class EvaluationError(
        val message: String,
        val statusCode: Int,
    ) : TriggerEvaluationResult {
        val type = EvaluationErrorType.EvaluationError

        enum class EvaluationErrorType {
            EvaluationError,
        }
    }

    data object ConditionMet : TriggerEvaluationResult {
        val type = ConditionMetType.ConditionMet

        enum class ConditionMetType {
            ConditionMet,
        }
    }

    data object ConditionNotMet : TriggerEvaluationResult {
        val type = ConditionNotMetType.ConditionNotMet

        enum class ConditionNotMetType {
            ConditionNotMet,
        }
    }
}
