// check every 5 minutes if event is over

const signupsList = require('#classes/SignupsList');
const fs = require('fs');
const path = require('path');

const RESET_FILE = path.join(__dirname, '..', 'data', `weeklyReset.json`);

// Get the timestamp of the most recent Sunday at 21:00 UTC
function getLatestWeeklyReset(now = new Date()) {
    const day = now.getUTCDay(); // Sunday = 0

    const reset = new Date(now);

    // Go back to the most recent Sunday
    reset.setUTCDate(now.getUTCDate() - day);

    // Set reset time to 21:00 UTC
    reset.setUTCHours(21, 0, 0, 0);

    // If we're on Sunday but before 21:00,
    // the latest reset was last Sunday.
    if (reset > now) {
        reset.setUTCDate(reset.getUTCDate() - 7);
    }

    return reset.getTime();
}

function getLastReset() {
    try {
        const data = JSON.parse(
            fs.readFileSync(RESET_FILE, "utf8")
        );

        return data.lastReset ?? 0;
    } catch {
        return 0;
    }
}

function saveLastReset(reset) {
    fs.writeFileSync(
        RESET_FILE,
        JSON.stringify({
            lastReset: reset
        }, null, 2)
    );
}

async function checkWeeklyReset(channel) {
    const latestReset = getLatestWeeklyReset();
    const lastReset = getLastReset();

    // We've already handled this reset
    if (lastReset === latestReset) {
        return;
    }

    // Save first so a restart/error doesn't cause
    // the same reset to be processed again.
    saveLastReset(latestReset);

    console.log(
        `Weekly reset detected: ${new Date(latestReset).toISOString()}`
    );

    await signupsList.sendReminders();
}

async function checkForResetsTimer() {
    const interval = setInterval(async () => {
        await checkForResets();

    }, 5*60*1000); // Every 5 min
}

async function checkForResets() {
        await signupsList.resetIfOver();
        await checkWeeklyReset();

}

module.exports = { checkForResets, checkForResetsTimer };