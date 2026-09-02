const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const Signup = require('#classes/Signup');

function fillSection(html, sectionClass, names) {
  const pattern = new RegExp(
    `(<div class="slots.+${sectionClass}">)([\\s\\S]*?)(</div>\\s*</div>)`
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

function fillBenchSection(html, names) {
  const pattern = new RegExp(
    `(<div class="slots bench">)([\\s\\S]*?)(</div>\\s*</div>)`
  );
  let innerText = '';

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    innerText += `<div class="slot"><span class="slot-num">${String(i + 1).padStart(2, '0')}</span><span class="slot-name" style="font-style:normal;opacity:1;color:var(--parchment)">${name}</span></div>\n`;
  }
  html = html.replace(pattern, `$1${innerText}$3`);
  return html;
}

function fillLateSection(html, names) {
  const pattern = new RegExp(
    `(<div class="slots overflow-row late">)([\\s\\S]*?)(</div>\\s*</div>)`
  );
  let innerText = '';

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    innerText += `<div class="slot"><span class="slot-num">${String(i + 1).padStart(2, '0')}</span><span class="slot-name" style="font-style:normal;opacity:1;color:var(--parchment)">${name}</span></div>\n`;
  }
  html = html.replace(pattern, `$1${innerText}$3`);
  return html;
}

function fillAbsentSection(html, names) {
  const pattern = new RegExp(
    `(<div class="slots overflow-row absent">)([\\s\\S]*?)(</div>\\s*</div>)`
  );
  let innerText = '';

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    innerText += `<div class="slot"><span class="slot-num">${String(i + 1).padStart(2, '0')}</span><span class="slot-name" style="font-style:normal;opacity:1;color:var(--parchment)">${name}</span></div>\n`;
  }
  html = html.replace(pattern, `$1${innerText}$3`);
  return html;
}

function updateCount(html, sectionClass, filled, total) {
  const pattern = new RegExp(
    `\\d+ / ${total} filled(</div>\\s*</div>\\s*<div class="slots ${sectionClass}">)`
  );
  return html.replace(pattern, `${filled} / ${total} filled$1`);
}

function removeBenchSection(html) {
  const pattern = new RegExp(
    `<!-- START BENCH -->[\\s\\S]*?<!-- END BENCH -->`,
    'm'
  );

  return html.replace(pattern, '');
}

function removeLateSection(html) {
  const pattern = new RegExp(
    `<!-- START LATE -->[\\s\\S]*?<!-- END LATE -->`,
    'm'
  );

  return html.replace(pattern, '');
}

function removeAbsentSection(html) {
  const pattern = new RegExp(
    `<!-- START ABSENT -->[\\s\\S]*?<!-- END ABSENT -->`,
    'm'
  );

  return html.replace(pattern, '');
}

function removeExtraSections(html) {
  const pattern = new RegExp(
    `<!-- START OFFROSTER -->[\\s\\S]*?<!-- END OFFROSTER -->`,
    'm'
  );

  return html.replace(pattern, '');
}

function replaceDay(html, day) {
  return html.replace(/\{\{\$DAY\}\}/g, day);
}

/**
 * Generate a sheet for the GvG signups
 *
 * @param {Signup} signup
 */
async function GenerateGvgPng(signup) {
    const htmlTemplate = path.join(__dirname, '..', 'signup_images', "gvg-signup-template.html");
    let html = fs.readFileSync(htmlTemplate, "utf8");

    html = replaceDay(html, signup.day);
    const dpsNames = await signup.getNicknameListByIdList(signup.listDps);
    const healNames = await signup.getNicknameListByIdList(signup.listHealers);
    const tankNames = await signup.getNicknameListByIdList(signup.listTanks);
    html = fillSection(html, "dps", dpsNames);
    html = fillSection(html, "heal", healNames);
    html = fillSection(html, "tank", tankNames);
    if (signup.listBench.length === 0) {
        html = removeBenchSection(html);
    }
    else {
      const benchNames = await signup.getNicknameListByIdList(signup.listBench);
      html = fillBenchSection(html, benchNames);
    }

    if (signup.listLate.length === 0 && signup.listAbsent.length === 0 && signup.listBench.length === 0) {
      html = removeExtraSections(html);
    }
    else {
      if (signup.listLate.length === 0) {
        html = removeLateSection(html);
      }
      else {
        const lateNames = await signup.getNicknameListByIdList(signup.listLate);
        html = fillLateSection(html, lateNames);
      }

      if (signup.listAbsent.length === 0) {
        html = removeAbsentSection(html);
      }
      else {
        const absentNames = await signup.getNicknameListByIdList(signup.listAbsent);
        html = fillAbsentSection(html, absentNames);
      }
    }

    html = updateCount(html, "dps", signup.listDps.length, 8);
    html = updateCount(html, "heal", signup.listHealers.length, 2);
    html = replaceDay(html, signup.day);
    return await htmlToPng(html);
}


/**
 * Generate a sheet for the HR signups
 *
 * @param {Signup} signup
 */
async function GenerateHrPng(signup) {
    const htmlTemplate = path.join(__dirname, '..', 'signup_images', "hr-signup-template.html");
    let html = fs.readFileSync(htmlTemplate, "utf8");

    html = replaceDay(html, signup.day);
    const dpsNames = await signup.getNicknameListByIdList(signup.listDps);
    const healNames = await signup.getNicknameListByIdList(signup.listHealers);
    html = fillSection(html, "dps", dpsNames);
    html = fillSection(html, "heal", healNames);
    if (signup.listBench.length === 0) {
        html = removeBenchSection(html);
    }
    else {
    const benchNames = await signup.getNicknameListByIdList(signup.listBench);
        html = fillBenchSection(html, benchNames);
    }

    html = updateCount(html, "dps", signup.listDps.length, 8);
    html = updateCount(html, "heal", signup.listHealers.length, 2);
    html = replaceDay(html, signup.day);
    return await htmlToPng(html);
}

/**
 * Generate a sheet for the signups
 *
 * @param {Signup} signup
 */
async function GenerateSignupPng(signup) {
  if (signup.eventType === 'hr') {
    return await GenerateHrPng(signup);
  }
  else if (signup.eventType === 'gvg') {
    return await GenerateGvgPng(signup);
  }
  else {
    throw new Error(`Unknown signup type: ${signup.eventType}`);
  }
}

async function htmlToPng(htmlString) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1000 },
  });

  await page.setContent(htmlString, { waitUntil: "domcontentloaded" });
  const pngBuffer = await page.locator('.sheet').screenshot({ type: 'png', fullPage: true });

  /*
  const pngBuffer = await page.screenshot({
    type: "png",
    fullPage: true
  });
  */

  await browser.close();
  return pngBuffer;
}

module.exports = GenerateSignupPng;