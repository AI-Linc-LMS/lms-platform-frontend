/**
 * The Prism build every syntax-highlighting consumer must import.
 *
 * `import { Prism } from "react-syntax-highlighter"` registers refractor's
 * ENTIRE language corpus (200+ grammars, ~215KB gzip) into whichever route
 * chunk imports it — measured on the article, assessment-result and admin
 * course routes. PrismLight registers only what we teach.
 */
import { PrismLight } from "react-syntax-highlighter";

import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import kotlin from "react-syntax-highlighter/dist/esm/languages/prism/kotlin";
import swift from "react-syntax-highlighter/dist/esm/languages/prism/swift";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";

PrismLight.registerLanguage("markup", markup);
PrismLight.registerLanguage("html", markup);
PrismLight.registerLanguage("xml", markup);
PrismLight.registerLanguage("css", css);
PrismLight.registerLanguage("javascript", javascript);
PrismLight.registerLanguage("js", javascript);
PrismLight.registerLanguage("typescript", typescript);
PrismLight.registerLanguage("ts", typescript);
PrismLight.registerLanguage("jsx", jsx);
PrismLight.registerLanguage("tsx", tsx);
PrismLight.registerLanguage("python", python);
PrismLight.registerLanguage("py", python);
PrismLight.registerLanguage("java", java);
PrismLight.registerLanguage("c", c);
PrismLight.registerLanguage("cpp", cpp);
PrismLight.registerLanguage("csharp", csharp);
PrismLight.registerLanguage("sql", sql);
PrismLight.registerLanguage("bash", bash);
PrismLight.registerLanguage("shell", bash);
PrismLight.registerLanguage("json", json);
PrismLight.registerLanguage("go", go);
PrismLight.registerLanguage("rust", rust);
PrismLight.registerLanguage("kotlin", kotlin);
PrismLight.registerLanguage("swift", swift);
PrismLight.registerLanguage("ruby", ruby);
PrismLight.registerLanguage("php", php);

export { PrismLight as SyntaxHighlighter };
