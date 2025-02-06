// utils/pomodoroTimer.js
import { createCanvas } from 'canvas';

// 🛑 Assurer que la Map est définie globalement
const activeTimers = new Map();
const originalChannelNames = new Map();

async function generateTimerImage(percentage) {
	const width = 256;
	const height = 256;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	// Fond
	ctx.fillStyle = '#2f3136';
	ctx.fillRect(0, 0, width, height);

	// Barre circulaire
	const centerX = width / 2;
	const centerY = height / 2;
	const radius = 100;
	const startAngle = -0.5 * Math.PI;
	const endAngle = (2 * Math.PI * (percentage / 100)) + startAngle;

	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, startAngle, endAngle);
	ctx.lineWidth = 20;
	ctx.strokeStyle = '#ff4d4d';
	ctx.stroke();

	// Texte
	ctx.fillStyle = '#ffffff';
	ctx.font = '30px Arial';
	ctx.textAlign = 'center';
	ctx.fillText(`${percentage}%`, centerX, centerY + 10);

	return canvas.toBuffer();
}

export async function startPomodoro(channel) {
	console.log(`✅ Démarrage du cycle Pomodoro pour ${channel.name}`);

	const match = channel.name.match(/Pomodoro (\d+)\/(\d+)/);
	if (!match) return console.log('⚠️ Erreur : Impossible de lire la durée du Pomodoro');

	const pomodoroDuration = parseInt(match[1]) * 60; // Pomodoro en secondes
	const breakDuration = parseInt(match[2]) * 60; // Pause en secondes

	const matchNumber = channel.name.match(/#\d+/);
	const channelNumber = matchNumber ? matchNumber[0] : '#1';

	if (!originalChannelNames.has(channel.id)) {
		originalChannelNames.set(channel.id, `Pomodoro ${match[1]}/${match[2]} ${channelNumber}`);
	}

	async function runCycle() {
		while (channel.members.size > 0) {
			// 🟢 Phase Pomodoro
			console.log(`🍅 Début du Pomodoro de ${match[1]} minutes`);
			await updateChannelName(channel, match[1], channelNumber, 'Pomodoro');

			await countdown(channel, pomodoroDuration);

			if (channel.members.size === 0) break; // Si tout le monde part, on arrête ici

			// 🟡 Phase Pause
			console.log(`☕ Début de la pause de ${match[2]} minutes`);
			await updateChannelName(channel, match[2], channelNumber, 'Pause');

			await countdown(channel, breakDuration);

			if (channel.members.size === 0) break; // Vérifier encore avant le prochain cycle

			console.log('♻️ Reprise d\'un nouveau cycle Pomodoro');
		}

		// 🛑 Personne dans le salon → Reset complet
		if (channel.members.size === 0) {
			console.log(`🚫 Plus personne dans ${channel.name}, arrêt du cycle.`);
			stopTimer(channel);
		}
	}

	runCycle();
}

async function countdown(channel, duration) {
	let remainingTime = duration;
	while (remainingTime > 0 && channel.members.size > 0) {
		await new Promise(resolve => setTimeout(resolve, 60000)); // Attendre 1 minute
		remainingTime -= 60;
		const minutesLeft = Math.floor(remainingTime / 60);

		const matchNumber = channel.name.match(/#\d+/);
		const channelNumber = matchNumber ? matchNumber[0] : '#1';

		await updateChannelName(channel, minutesLeft, channelNumber, 'Pomodoro');
	}
}
async function updateChannelName(channel, timeLeft, channelNumber, phase) {
	const newName = `Pomodoro ${channelNumber} - ${phase}: ${timeLeft} min restantes`;
	console.log(`🔄 Mise à jour du nom : ${newName}`);

	await channel.setName(newName).catch(error => {
		console.error(`❌ Erreur mise à jour du nom pour ${channel.name} :`, error);
	});
}

export function stopTimer(channel) {
	if (activeTimers.has(channel.id)) {
		clearInterval(activeTimers.get(channel.id));
		activeTimers.delete(channel.id);
		console.log(`🛑 Timer arrêté pour ${channel.name}`);
	}

	if (originalChannelNames.has(channel.id)) {
		const originalName = originalChannelNames.get(channel.id);
		console.log(`🔄 Réinitialisation du nom : ${originalName}`);
		channel.setName(originalName).catch(error => {
			console.error('❌ Erreur lors du reset du nom :', error);
		});

		originalChannelNames.delete(channel.id);
	}
}


export { activeTimers, originalChannelNames, countdown, updateChannelName, generateTimerImage };
