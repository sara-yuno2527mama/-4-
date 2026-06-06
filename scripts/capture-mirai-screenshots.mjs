import { chromium } from "playwright";

const desktop = "C:/Users/o9o15/Desktop";

async function capture(page, filename, setup) {
  await page.goto("http://localhost:3000/mirai", { waitUntil: "networkidle" });
  await setup(page);
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${desktop}/${filename}`,
    fullPage: true,
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await capture(page, "mirai-workspace.png", async () => {});

await capture(page, "mirai-private-pottery.png", async (p) => {
  await p.getByRole("button", { name: "陶芸関係" }).click();
});

await capture(page, "mirai-committee-may.png", async (p) => {
  await p.getByRole("button", { name: "実行委員会本会" }).click();
});

await browser.close();
console.log("Saved to Desktop");
