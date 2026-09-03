import parser from "@typescript-eslint/parser";
import { Linter } from "eslint";
import { assert, describe, it } from "vitest";

import tailwind from "./tailwind.mjs";

const elevationReports = (filename, configs) =>
	new Linter()
		.verify('const className = "shadow-lg";', [{ files: ["**/*.ts"], languageOptions: { parser } }, ...configs], { filename })
		.filter((message) => message.ruleId === "standards/no-raw-elevation");

describe("tailwind preset", () => {
	it("turns no-raw-elevation off for the elevation token module and nowhere else", () => {
		const configs = tailwind({ files: ["**/*.ts"], elevationModuleFiles: ["**/lib/elevation.ts"] });
		assert.lengthOf(elevationReports("src/lib/elevation.ts", configs), 0);
		assert.lengthOf(elevationReports("src/App.ts", configs), 1);
	});

	it("keeps reporting the token module when no module is named", () => {
		assert.lengthOf(elevationReports("src/lib/elevation.ts", tailwind({ files: ["**/*.ts"] })), 1);
	});
});
