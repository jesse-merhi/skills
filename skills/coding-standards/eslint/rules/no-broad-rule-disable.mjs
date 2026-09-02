function bareRuleName(ruleName) {
	return ruleName.slice(ruleName.lastIndexOf("/") + 1);
}

function normalizeRuleName(ruleName) {
	return bareRuleName(ruleName.replace(/[;"']/g, "").trim());
}

function stripEslintDescription(directiveText) {
	const descriptionIndex = directiveText.indexOf("--");
	return descriptionIndex === -1 ? directiveText : directiveText.slice(0, descriptionIndex);
}

function disabledProtectedRule(comment, protectedRules) {
	const directiveMatch = comment.value.match(/(?:^|\s)eslint-disable(?!-(?:next-line|line)\b)\b([\s\S]*)/);
	if (!directiveMatch) {
		return null;
	}

	// All-rule disables suppress this rule before it can report, so only named
	// rules are visible here. A repository-wide scan is the tool for the rest.
	return (
		stripEslintDescription(directiveMatch[1])
			.split(/[,\s]+/)
			.map(normalizeRuleName)
			.filter(Boolean)
			.find((ruleName) => protectedRules.has(ruleName)) ?? null
	);
}

export default {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow file- and block-level eslint-disable of protected rules",
		},
		schema: [
			{
				type: "object",
				properties: {
					rules: {
						type: "array",
						items: { type: "string" },
						uniqueItems: true,
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			broadDisable:
				"Do not broadly disable '{{rule}}'. Use a focused eslint-disable-next-line on the single line that needs the exception.",
		},
	},
	create(context) {
		const protectedRules = new Set((context.options[0]?.rules ?? []).map(bareRuleName));
		if (protectedRules.size === 0) {
			return {};
		}

		return {
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					const rule = disabledProtectedRule(comment, protectedRules);
					if (rule !== null) {
						context.report({ node: comment, messageId: "broadDisable", data: { rule } });
					}
				}
			},
		};
	},
};
