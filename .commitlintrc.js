import {RuleConfigSeverity} from "@commitlint/types";

/**
 * @type {import('@commitlint/types').UserConfig}
 */
const Configuration = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        "scope-empty": [RuleConfigSeverity.Disabled],
        "header-max-length": [RuleConfigSeverity.Disabled],
        "body-max-line-length": [RuleConfigSeverity.Disabled],
    },
    defaultIgnores: false,
    ignores: [(c) => c.startsWith('Merge'),],
};

export default Configuration;
