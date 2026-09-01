const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const Signup = require('#classes/Signup');

function replaceDay(html, day) {
  return html.replace(/\{\{DAY\}\}/g, day);
}

function fillSection(html, sectionClass, names) {
  const pattern = new RegExp(
    `(<div class="slots ${sectionClass}">)([\\s\\S]*?)(</div>\\s*</div>)`
  );

  return html.replace(pattern, (match, open, block, close) => {
    const slots = block.split('<div class="slot">');
    const filled = [slots[0]]; // anything before the first slot (usually empty)

    for (let i = 1; i < slots.length; i++) {
      let slot = slots[i];
      const name = names[i - 1];
      if (name) {
        slot = slot.replace(
          '<span class="slot-name">open</span>',
          `<span class="slot-name" style="font-style:normal;opacity:1;color:var(--parchment)">${name}</span>`
        );
      }
      filled.push('<div class="slot">' + slot);
    }

    return open + filled.join("") + close;
  });
}

function updateCount(html, sectionClass, filled, total) {
  const pattern = new RegExp(
    `\\d+ / ${total} filled(</div>\\s*</div>\\s*<div class="slots ${sectionClass}">)`
  );
  return html.replace(pattern, `${filled} / ${total} filled$1`);
}

function removeBenchSection(html) {
  const pattern = new RegExp(
    `<div class="section">\\s*<div class="section-head">\\s*<div class="section-title"><span class="accent-bench">Bench</span></div>[\\s\\S]*?<div class="slots bench">[\\s\\S]*?</div>\\s*</div>`,
    'm'
  );

  return html.replace(pattern, '');
}

/**
 * Generate a sheet for the HR signups
 *
 * @param {Signup} signup
 */
function GenerateHrPng(signup) {
    const htmlTemplate = path.join(__dirname, '..', 'signup_images', "hr-signup-template.html");
    const pngOutput = path.join(__dirname, '..', 'signup_images', `${signup.eventType}-${signup.day}.png`);
    let html = fs.readFileSync(htmlTemplate, "utf8");

    html = replaceDay(html, signup.day);
    html = fillSection(html, "dps", signup.listDps);
    html = fillSection(html, "heal", signup.listHealers);
    html = fillSection(html, "bench", signup.listBench);
    if (signup.listBench.length === 0) {
        html = removeBenchSection(html);
    }

    html = updateCount(html, "dps", signup.listDps.length, 8);
    html = updateCount(html, "heal", signup.listHealers.length, 2);
    return htmlToPng(html, pngOutput);
}

async function htmlToPng(htmlString, pngFilePath) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1000 },
    deviceScaleFactor: 2
  });

  await page.setContent(htmlString, { waitUntil: "networkidle" });
  const pngBuffer = await page.screenshot({
    type: "png",
    fullPage: true
  });

  await browser.close();
  return pngBuffer;
}

module.exports = GenerateHrPng;