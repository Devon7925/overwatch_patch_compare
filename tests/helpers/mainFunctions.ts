import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as utils from "../../utils.js";

// Exercise the production functions without starting the browser entry point.
const source = ts.createSourceFile("main.ts", readFileSync(new URL("../../main.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
const functions = source.statements.filter(ts.isFunctionDeclaration).filter(s => s.body && s.name);
const privateNames = functions.filter(s => !s.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).map(s => s.name!.text);
const compiled = ts.transpileModule(functions.map(s => s.getText(source)).join("\n") + `\nexport { ${privateNames.join(", ")} };`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

export function loadMainFunctions(globals: Record<string, unknown> = {}) {
    const functions: Record<string, (...args: any[]) => any> = {};
    runInNewContext(compiled, { exports: functions, ...utils, structuredClone, console, ...globals });
    return functions;
}
