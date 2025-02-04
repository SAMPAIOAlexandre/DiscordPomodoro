import { createCanvas } from 'canvas';


const activeTimers = new Map();


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
	console.log(`✅ startPomodoro() exécuté pour ${channel.name}`); // Debug 1

	const match = channel.name.match(/Pomodoro (\d+)\/(\d+)/);
	if (!match) return console.log('⚠️ Erreur : Impossible de lire la durée du Pomodoro');

	const duration = parseInt(match[1]);
	const breakDuration = parseInt(match[2]);
	let remainingTime = duration * 60;
	const totalTime = duration * 60;

	console.log(`🔍 Durée Pomodoro : ${duration} min | Pause : ${breakDuration} min`); // Debug 2

	channel.members.forEach(member => {
		member.voice.setMute(true, 'Début du Pomodoro');
	});

	activeTimers.set(channel.id, setInterval(async () => {
		remainingTime -= 60;
		const percentage = Math.floor(((totalTime - remainingTime) / totalTime) * 100);
		console.log(`⏳ ${percentage}% complété (${remainingTime / 60} min restantes)`); // Debug 3

		if (remainingTime <= 0) {
			clearInterval(activeTimers.get(channel.id));
			activeTimers.delete(channel.id);
			await channel.setName(`Pomodoro ${duration}/${breakDuration} - ✅ Terminé`);
		}
		else {
			const minutesLeft = Math.floor(remainingTime / 60);
			await channel.setName(`Pomodoro ${duration}/${breakDuration} - ${minutesLeft} min restantes`);
		}
	}, 60000));
}

export { activeTimers };
