/* Verify stepkick.com renders live (fresh context, no SW cache). node _tests/verify-live.cjs */
const puppeteer = require("C:/Users/chedo/Dropbox/claude/skills/site-status/node_modules/puppeteer-core");
const path = require("path");
(async () => {
  const errors = [], failed = [];
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 420, height: 860, deviceScaleFactor: 2 });
  p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  p.on("requestfailed", (r) => failed.push(r.url() + " (" + (r.failure() && r.failure().errorText) + ")"));
  const resp = await p.goto("https://stepkick.com/?fresh=" + Math.floor(process.hrtime()[1]), { waitUntil: "networkidle0", timeout: 25000 });
  await new Promise((r) => setTimeout(r, 800));
  const info = await p.evaluate(() => {
    const app = document.querySelector("#app") || document.body;
    return { textLen: (document.body.innerText || "").trim().length, appChildren: app ? app.childElementCount : 0, sample: (document.body.innerText || "").trim().slice(0, 120) };
  });
  await p.screenshot({ path: path.join(__dirname, "live-render.png") });
  console.log("status: " + resp.status());
  console.log("body text length: " + info.textLen + " | #app children: " + info.appChildren);
  console.log("sample text: " + JSON.stringify(info.sample));
  console.log(failed.length ? "FAILED REQUESTS:\n  " + failed.join("\n  ") : "no failed requests");
  console.log(errors.length ? "ERRORS:\n  " + errors.join("\n  ") : "no console/page errors");
  console.log(info.textLen > 10 ? "RENDERS ✓" : "STILL BLANK ✗");
  await b.close();
  process.exit(info.textLen > 10 && !errors.length ? 0 : 1);
})();
