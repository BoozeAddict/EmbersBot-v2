import { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { gbp_db, getPoints, insertPoints, updatePoints, listTopUsers} from '#database/gbp';
import { GifCodec, GifUtil } from 'gifwrap';
import Jimp from 'jimp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedUsers = [
	"546003832757288962", // Mei
	"415901428108886046", // Lilith
	"293442433684078604", // Nia
	"199962821306351616"  // Booze
]

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const codec = new GifCodec();
const fontPath = path.join(__dirname, '..', '..', 'gbp_images', 'font2bitmap.fnt');
const font = await Jimp.loadFont(fontPath);

async function generateGoodBoyPointsGif(amount) {
	const gif = await GifUtil.read(path.join(__dirname, '..', '..', 'gbp_images', 'star.gif'));
	let text = ""
	if (amount > 1) { text = `+${amount}\ngood boy\npoints!`; }
	else if (amount === 1) { text = `+${amount}\ngood boy\npoint!`; }
	else if (amount === 0) { text = `0\ngood boy\npoints.`; }
	else if (amount === -1) { text = `${amount}\ngood boy\npoint!`; }
	else if (amount < -1) { text = `${amount}\ngood boy\npoints!`; }

	// add text to each frame of the gif
	for (const frame of gif.frames) {
		const img = GifUtil.shareAsJimp(Jimp, frame);
		img.print(
			font, 0, 0, 
			{ text: `${text}`, 
			alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, 
			alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
    		img.bitmap.width-10, img.bitmap.height);
		}
		GifUtil.quantizeDekker(gif.frames, 256);
		const encoded = await codec.encodeGif(gif.frames, { loops: gif.loops });
		return encoded.buffer;
}

async function addGoodBoyPoints(userId, amount, interaction) {
	// Check if userId is valid
	if (!userId || typeof userId !== 'string') {
		throw new Error('Invalid userId provided.');
	}

	// GIF generation can take longer than Discord's initial response window.
	await interaction.deferReply();

	if (interaction.user.id === userId)
		amount = -10; // DEATH

	// Check if the user already has points
	const row = getPoints.get(userId);
	if (row) {
		// User already has points, update the amount
		const newPoints = row.points + amount;
		updatePoints.run(newPoints, userId);
	} else {
		// User does not have points yet, insert a new row
		insertPoints.run(userId, amount);
	}

	// Generate the GIF with the updated points
	const updatedRow = getPoints.get(userId);
	const updatedPoints = updatedRow ? updatedRow.points : 0;
	const gifBuffer = await generateGoodBoyPointsGif(amount);

	let text = "";
	// if giving points to self:
	if (interaction.user.id === userId) { 
		text = `${interaction.member.displayName}, did you just try to give yourself good boy points? -10 points, very naughty.\n` +
		       `You now have ${updatedPoints} good boy points.\n`; }
	else { text = `${interaction.member.displayName} gave <@${userId}> ${amount} good boy points!\nThey now have ${updatedPoints} good boy points.\n`; }

	await interaction.editReply({
		content: text,
		files: [{ attachment: gifBuffer, name: 'goodboypoints.gif' }]
	});

}

async function checkGoodBoyPoints(userId, interaction) {
	if (!userId || typeof userId !== 'string') { userId = interaction.user.id; } // default to the user who invoked the command if no userId is provided
	const row = getPoints.get(userId);
	await interaction.reply({
		content: row ? `<@${userId}> has ${row.points} good boy points.` : `<@${userId}> has no good boy points yet.`,
		flags: MessageFlags.Ephemeral,
	});
}

async function showLeaderboards(interaction) {
    const rows = listTopUsers.all(10);

    if (rows.length === 0) {
        await interaction.reply({
            content: 'No good boy points records found.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // One API call for all rows. Members who left the server are simply missing.
    const members = await interaction.guild.members
        .fetch({ user: rows.map(row => row.userId) })
        .catch(() => null);

    let leaderboardText = 'Good Boy Points Leaderboard\n\n';
    rows.forEach((row, index) => {
        const username = members?.get(row.userId)?.displayName ?? 'Unknown User';
        leaderboardText += `${index + 1}. ${username} — ${row.points} good boy points\n`;
    });

    await interaction.reply({
        content: leaderboardText,
        allowedMentions: { parse: [] },
    });
}

export default {
	data: new SlashCommandBuilder().setName('gbp')
	.setDescription('Manage good boy points!')
	.addSubcommand(subcommand =>
		subcommand.setName('add')
			.setDescription('Add good boy points to a user.')
			.addUserOption(option =>
				option.setName('target')
					.setDescription('The user to give good boy points to.')
					.setRequired(true)
			)
			.addIntegerOption(option =>
				option.setName('amount')
					.setDescription('The number of good boy points to give.')
					.setRequired(true)
			)
	)
	.addSubcommand(subcommand =>
		subcommand.setName('leaderboards')
			.setDescription('View the good boy points leaderboards.')
	)
	.addSubcommand(subcommand =>
		subcommand.setName('check')
			.setDescription('Check your good boy points.')
			.addUserOption(option =>
				option.setName('target')
					.setDescription('The user to check good boy points for.')
					.setRequired(false)
			)
	),

	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		// add
		if (interaction.options.getSubcommand() === 'add') {
			if (!allowedUsers.includes(interaction.user.id) && interaction.user.id !== interaction.options.getUser('target')?.id) {
				await interaction.reply({
					content: 'You do not have permission to give out good boy points.',
					flags: MessageFlags.Ephemeral
				});
				return;
			}
			const targetUser = interaction.options.getUser('target');
			const amount = interaction.options.getInteger('amount');
			await addGoodBoyPoints(targetUser.id, amount, interaction);
		}

		// leaderboards
		else if (interaction.options.getSubcommand() === 'leaderboards') {
			await showLeaderboards(interaction);
		}

		// check
		else if (interaction.options.getSubcommand() === 'check') {
			const targetUser = interaction.options.getUser('target');
			await checkGoodBoyPoints(targetUser?.id, interaction);
		}
	},
};