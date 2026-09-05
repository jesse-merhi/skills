import noBannerComments from "./rules/no-banner-comments.mjs";
import noBrittleE2eSelectors from "./rules/no-brittle-e2e-selectors.mjs";
import noBrittleTestStyleAssertions from "./rules/no-brittle-test-style-assertions.mjs";
import noBroadRuleDisable from "./rules/no-broad-rule-disable.mjs";
import noLargeTestSnapshots from "./rules/no-large-test-snapshots.mjs";
import noLightModeOnlyColors from "./rules/no-light-mode-only-colors.mjs";
import noRawColorLiterals from "./rules/no-raw-color-literals.mjs";
import noRawElevation from "./rules/no-raw-elevation.mjs";
import noRawSql from "./rules/no-raw-sql.mjs";
import noSmallText from "./rules/no-small-text.mjs";
import noTrivialForwardingWrapper from "./rules/no-trivial-forwarding-wrapper.mjs";
import noWideArbitraryBreakpoints from "./rules/no-wide-arbitrary-breakpoints.mjs";
import noZodTypeAny from "./rules/no-zod-type-any.mjs";
import preferZodForUnknownTypeof from "./rules/prefer-zod-for-unknown-typeof.mjs";

export const standards = {
	rules: {
		"no-banner-comments": noBannerComments,
		"no-brittle-e2e-selectors": noBrittleE2eSelectors,
		"no-brittle-test-style-assertions": noBrittleTestStyleAssertions,
		"no-broad-rule-disable": noBroadRuleDisable,
		"no-large-test-snapshots": noLargeTestSnapshots,
		"no-light-mode-only-colors": noLightModeOnlyColors,
		"no-raw-color-literals": noRawColorLiterals,
		"no-raw-elevation": noRawElevation,
		"no-raw-sql": noRawSql,
		"no-small-text": noSmallText,
		"no-trivial-forwarding-wrapper": noTrivialForwardingWrapper,
		"no-wide-arbitrary-breakpoints": noWideArbitraryBreakpoints,
		"no-zod-type-any": noZodTypeAny,
		"prefer-zod-for-unknown-typeof": preferZodForUnknownTypeof,
	},
};
