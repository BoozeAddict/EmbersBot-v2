const Signup = require('#classes/Signup');
const client = require('#classes/Client');
const fs = require('fs');

class SignupsList {
    constructor() {
        this.hr_monday = new Signup('hr', 'Monday');
        this.hr_wednesday = new Signup('hr', 'Wednesday');
        this.hr_friday = new Signup('hr', 'Friday');
        this.gvg_saturday = new Signup('gvg', 'Saturday');
        this.gvg_sunday = new Signup('gvg', 'Sunday');
        this.signups = [this.hr_monday, this.hr_wednesday, this.hr_friday, this.gvg_saturday, this.gvg_sunday];
        this.signups_hr = [this.hr_monday, this.hr_wednesday, this.hr_friday];
        this.signups_gvg = [this.gvg_saturday, this.gvg_sunday];
    }

    postHRSignups(channel) {
        this.signups_hr.forEach(signup => signup.createSignupMessage(channel));
    }

    postGVGSignups(channel) {
        this.signups_gvg.forEach(signup => signup.createSignupMessage(channel));
    }

    getSignupById(signupId) {
        return this.signups.find(signup => signup.signupMessageId === signupId);
    }

    getSignupByTypeDay(eventType, day) {
        return this.signups.find(signup => signup.day === day && signup.eventType === eventType);
    }

    async resetIfOver() {
        await Promise.allSettled(
            this.signups.map(async (signup) => {
                await signup.resetEventIfOver();
            })
        )
    }

    #getHrChannel() {
        const channelId = this.hr_monday.channelId;
        const channel = client.channels.cache.get(channelId);
        return channel;
    }

    #getGvGChannel() {
        const channelId = this.gvg_saturday.channelId;
        const channel = client.channels.cache.get(channelId);
        return channel;
    }

    async #deleteLastMessage(channel, text) { // if text matches the text of the message.
        const messages = await channel.messages.fetch({limit: 5});
        await Promise.allSettled(
            messages.filter(message => message.content.includes('next week'))
            .map(message => message.delete())
        );
    }

    async sendReminders() {
        const textGvG = '@GvG Happy reset! Don\'t forget to sign up for the next week\'s GvG matches!';
        const channelGvG = this.#getGvGChannel();

        const textHR = '@LFPvE Happy reset! Don\'t forget to sign up for the next week\'s Hero Realms!';
        const channelHR = this.#getHrChannel();
        await Promise.allSettled([
            this.#deleteLastMessage(channelGvG, textGvG),
            this.#deleteLastMessage(channelHR, textHR),
        ]);

        await Promise.allSettled([
            channelGvG.send(textGvG),
            channelHR.send(textHR),
        ]);
        console.log("Sent messages after reset");
    }
}

const signupsList = new SignupsList();

module.exports = signupsList;