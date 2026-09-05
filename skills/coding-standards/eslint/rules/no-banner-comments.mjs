const bannerPattern = /^[-=]{10,}$/u;

export default {
	meta: {
		type: "suggestion",
		docs: { description: "Disallow decorative comment separators" },
		messages: { banner: "Decorative comment separator. Use a plain section comment instead." },
	},
	create(context) {
		return {
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					if (bannerPattern.test(comment.value.trim()))
						context.report({ node: comment, messageId: "banner" });
				}
			},
		};
	},
};
