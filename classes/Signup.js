const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, TextDisplayBuilder, MessageFlags, 
    SeparatorBuilder, SeparatorSpacingSize, MediaGalleryBuilder, AttachmentBuilder, ContainerBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const client = require('#classes/Client');
const generateSignupPng = require('#utility/generateSignupImage');

class Signup {
    constructor(eventType, day) {
        this.eventType = eventType;
        this.day = day;
        this.#readFromFile();
    }
    addPlayer(interaction) {
        const role = interaction.values[0];
        console.log(`role: ${role}`);
        const player = interaction.user.id;


        if (role === 'remove') {
            this.#removePlayer(player);
            this.#writeToFile();
            this.message = interaction.message;
            this.#updateSignupMessage(interaction);
            return;
        }
        // Check if already signed up
        if (this.#isPlayerSignedUp(player)) {
            this.#removePlayer(player);
        }
        switch (role) {
            case 'dps':
                if (this.eventType === "hr" && this.listDps.length >= 8)
                    this.listBench.push(player);
                else
                    this.listDps.push(player);
                break;
            case 'healer':
                if (this.eventType === "hr" && this.listHealers.length >= 2)
                    this.listBench.push(player);
                else
                    this.listHealers.push(player);
                break;
            case 'tank':
                this.listTanks.push(player);
                break;
            case 'late':
                this.listLate.push(player);
                break;
            case 'absent':
                this.listAbsent.push(player);
                break;
            case 'bench':
                this.listBench.push(player);
                break;
        }
        this.#writeToFile();
        this.message = interaction.message;
        this.#updateSignupMessage(interaction);
    }
    async resetEventIfOver()
    {
        if (this.#isEventOver())
        {
            console.log(`Resetting event ${this.eventType} on ${this.day}`);
            this.#clearSignup();
            this.#generateNearestEventDate();
            await this.#updateSignupMessage();
        }
    }
    async #generateHRSignupEmbed() {
    const textDisplay = new TextDisplayBuilder()
    .setContent(`# **<:Embers:1473400384252018709> ${this.day} Hero Realm Signup <:Embers:1473400384252018709>**\n\nStart time: <t:${this.eventDate}:F> (<t:${this.eventDate}:R>)`);

    const separator = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Large);

    const pngBuffer = await generateSignupPng(this);
    const attachment = new AttachmentBuilder(pngBuffer, { name: 'image.png' });

    const mediaGallery = new MediaGalleryBuilder().addItems(
        (mediaGalleryItem) => mediaGalleryItem.setURL('attachment://image.png')
    );
    
    const selectMenu = new StringSelectMenuBuilder()
	.setCustomId(`signup-${this.eventType}-${this.day}`)
	.setPlaceholder(`Sign up for ${this.day}...`)
	.addOptions(
		{
			label: 'DPS',
			value: 'dps',
			emoji: { name: '⚔️' }
		},
		{
			label: 'Healer',
			value: 'healer',
			emoji: { name: '➕' }
		},
		{
			label: 'Bench',
			value: 'bench',
			emoji: { name: '🪑' }
		},
		{
			label: 'Remove Signup',
			value: 'remove',
			emoji: { name: '❌' }
		}
	);

    const row = new ActionRowBuilder()
    .addComponents(selectMenu);

    const container = new ContainerBuilder()
    .setAccentColor(0xFF7A2E)
    .addTextDisplayComponents(textDisplay)
    .addSeparatorComponents(separator)
    .addMediaGalleryComponents(mediaGallery)
    .addActionRowComponents(row);

    const payload = {
        components:  [
            container,
        ],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
    };

	return payload;
}
    async #generateGVGSignupEmbed() {
    const textDisplay = new TextDisplayBuilder()
    .setContent(`# **<:Embers:1473400384252018709> ${this.day} Guild War Signup <:Embers:1473400384252018709>**\n\nStart time: <t:${this.eventDate}:F> (<t:${this.eventDate}:R>)`);

    const separator = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Large);

    const pngBuffer = await generateSignupPng(this);
    const attachment = new AttachmentBuilder(pngBuffer, { name: 'image.png' });

    const mediaGallery = new MediaGalleryBuilder().addItems(
        (mediaGalleryItem) => mediaGalleryItem.setURL('attachment://image.png')
    );
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`signup-${this.eventType}-${this.day}`)
        .setPlaceholder(`Sign up for ${this.day} Guild War...`)
        .addOptions(
        {
            label: 'DPS',
            value: 'dps',
            emoji: { name: '⚔️' }
        },
        {
            label: 'Tank',
            value: 'tank',
            emoji: { name: '🛡️' }
        },
        {
            label: 'Healer',
            value: 'healer',
            emoji: { name: '➕' }
        },
        {
            label: 'Bench',
            value: 'bench',
            emoji: { name: '🪑' }
        },
        {
            label: 'Late',
            value: 'late',
            emoji: { name: '🕗' }
        },
        {
            label: 'Absent',
            value: 'absent',
            emoji: { name: '⛔' }
        },
        {
            label: 'Remove Signup',
            value: 'remove',
            emoji: { name: '❌' }
        }
    );

    const row = new ActionRowBuilder()
    .addComponents(selectMenu);

    const container = new ContainerBuilder()
    .setAccentColor(0xFF7A2E)
    .addTextDisplayComponents(textDisplay)
    .addSeparatorComponents(separator)
    .addMediaGalleryComponents(mediaGallery)
    .addActionRowComponents(row);

    const payload = {
        components:  [
            container,
        ],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
    };

	return payload;
    }
    async #generateSignupEmbed() {
        switch (this.eventType) {
            case 'hr':
                return await this.#generateHRSignupEmbed();
            case 'gvg':
                return await this.#generateGVGSignupEmbed();
        }
    }
    #removePlayer(player) {
        this.listDps = this.listDps.filter(p => p !== player);
        this.listHealers = this.listHealers.filter(p => p !== player);
        this.listTanks = this.listTanks.filter(p => p !== player);
        this.listBench = this.listBench.filter(p => p !== player);
        this.listLate = this.listLate.filter(p => p !== player);
        this.listAbsent = this.listAbsent.filter(p => p !== player);
    }
    #isPlayerSignedUp(player) {
        return this.listDps.includes(player) || 
        this.listHealers.includes(player) || 
        this.listTanks.includes(player) || 
        this.listBench.includes(player) || 
        this.listLate.includes(player) ||
        this.listAbsent.includes(player);
    }
    #generateNearestEventDate() {
        const schedule = {
            Monday:    [17, 30],
            Wednesday: [17, 30],
            Friday:    [19, 30],
            Saturday:  [18, 30],
            Sunday:    [18, 30],
            Reset:     [21,  0]
        };

        const dayNumbers = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
            Reset: 6
        };

        const now = new Date();
        const targetDay = dayNumbers[this.day];

        if (targetDay === undefined || !schedule[this.day]) {
            throw new Error(`Invalid day: ${this.day}`);
        }

        const [hours, minutes] = schedule[this.day];

        let daysAhead = (targetDay - now.getUTCDay() + 7) % 7;

        const target = new Date(now);
        target.setUTCDate(target.getUTCDate() + daysAhead);
        target.setUTCHours(hours, minutes, 0, 0);

        // If it's already past today's scheduled time, get next week's occurrence
        if (target <= now) {
            target.setUTCDate(target.getUTCDate() + 7);
        }

        this.eventDate = Math.floor(target.getTime() / 1000);
    }    
    #checkIfMessageExists() {
        if (this.signupMessageId === 0 || this.channelId === 0) {
            return false;
        }
        return true;
    }
    async #updateSignupMessage(interaction = null) {
        if (interaction) await interaction.deferUpdate();
        if (!this.#checkIfMessageExists()) {
            console.error('Signup message ID or channel ID is not set. Cannot update signup message.');
            return;
        }
        if (!interaction && !this.message) await this.#getMessage();
        const payload = await this.#generateSignupEmbed();
        console.log(`Attempting to edit message: ${this.message.id}`);
        try {
            if (interaction)
                await interaction.update(payload);
            else
                await this.message.edit(payload);
        } catch (error) {
            console.error('Error updating signup message:', error);
        }
    }
    async #getMessage()
    {
        const channel = await client.channels.fetch(this.channelId);
        const message = await channel.messages.fetch(this.signupMessageId);
        this.message = message;
    }
    async createSignupMessage(channel) {
        if (!channel) {
            console.error('Channel not found for signup message.');
            return;
        }
        if (this.#isEventOver()) {
            this.#generateNearestEventDate();
        }
        const payload = await this.#generateSignupEmbed();
        try {
            channel.send(payload).then(sentMessage => {
            this.channelId = channel.id;
            this.signupMessageId = sentMessage.id;
            this.message = sentMessage;
            this.#writeToFile();
        });
        }
        catch (error) {
            console.error('Error sending signup message:', error);
        }
    }
    #clearSignup() {
        this.listDps = [];
        this.listHealers = [];
        this.listTanks = [];
        this.listBench = [];
        this.listLate = [];
        this.listAbsent = [];
    }
    #isEventOver() {
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime > this.eventDate + 60 * 60; // 1 hour
    }
    #readFromFile() {
        const filename = path.join(__dirname, '..', 'data', `data_${this.eventType}_${this.day}.json`);

        fs.mkdirSync(path.dirname(filename), { recursive: true });
        if (!fs.existsSync(filename)) {
            this.signupMessageId = 0;
            this.channelId = 0;
            this.eventDate = 0;
            this.listDps = [];
            this.listHealers = [];
            this.listTanks = [];
            this.listBench = [];
            this.listLate = [];
            this.listAbsent = [];
            this.#writeToFile();
        }
        else {
        const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
        this.signupMessageId = data.signupMessageId;
        this.channelId = data.channelId;
        this.eventDate = data.eventDate;
        this.listDps = data.listDps;
        this.listHealers = data.listHealers;
        this.listTanks = data.listTanks;
        this.listBench = data.listBench;
        this.listLate = data.listLate;
        this.listAbsent = data.listAbsent;
        }
    }
    #writeToFile() {
        const data = {
            signupMessageId: this.signupMessageId,
            channelId: this.channelId,
            eventDate: this.eventDate,
            listDps: this.listDps,
            listHealers: this.listHealers,
            listTanks: this.listTanks,
            listBench: this.listBench,
            listLate: this.listLate,
            listAbsent: this.listAbsent
        };
        fs.writeFileSync(`data/data_${this.eventType}_${this.day}.json`, JSON.stringify(data));
    }
    async getNicknameListByIdList(userIds)
    {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const fetchPromises = userIds.map(async (id) => {
        try {
        const member = guild.members.cache.get(id) 
            ?? await guild.members.fetch(id);
        
        return member.displayName;
        } catch (error) {
        return `Unknown User (${id})`; 
        }
    });

    const displayNames = await Promise.all(fetchPromises);
    return displayNames;
    }
}



module.exports = Signup;