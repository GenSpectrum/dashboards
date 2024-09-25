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

    data class ConditionMet(
        val evaluatedValue: Number,
        val threshold: Number,
        val lapisDataVersion: String?,
    ) : TriggerEvaluationResult {
        val type = ConditionMetType.ConditionMet

        enum class ConditionMetType {
            ConditionMet,
        }
    }

    data class ConditionNotMet(
        val evaluatedValue: Number?,
        val threshold: Number,
        val lapisDataVersion: String?,
    ) : TriggerEvaluationResult {
        val type = ConditionNotMetType.ConditionNotMet

        enum class ConditionNotMetType {
            ConditionNotMet,
        }
    }
}
