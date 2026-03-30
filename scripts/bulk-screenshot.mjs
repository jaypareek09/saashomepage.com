import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const urlsPath = path.resolve("./urls.txt");
const outputDir = path.resolve("./screenshots");
const errorLog = path.resolve("./screenshots/errors.txt");
const viewport = { width: 1440, height: 900 };
const concurrency = 6;

if (!fs.existsSync(urlsPath)) {
  throw new Error("urls.txt not found in project root.");
}

const urls = fs
  .readFileSync(urlsPath, "utf-8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

if (!urls.length) {
  throw new Error("No URLs found in urls.txt");
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(errorLog, "", "utf-8");

const slugify = (url) =>
  url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 800;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport });

let index = 0;
const runWorker = async () => {
  while (index < urls.length) {
    const currentIndex = index++;
    const url = urls[currentIndex];
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await autoScroll(page);
      await page.waitForTimeout(700);
      const filename = `${String(currentIndex + 1).padStart(3, "0")}_${slugify(url)}.png`;
      const target = path.join(outputDir, filename);
      await page.screenshot({ path: target, fullPage: true });
      console.log(`Saved ${filename}`);
    } catch (error) {
      const message = `${url} :: ${error.message}\n`;
      fs.appendFileSync(errorLog, message, "utf-8");
      console.error("Failed", url, error.message);
    } finally {
      await page.close();
    }
  }
};

await Promise.all(Array.from({ length: concurrency }, runWorker));
await browser.close();

console.log("Done. Screenshots saved to", outputDir);
