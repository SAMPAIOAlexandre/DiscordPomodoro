const activeTimers = new Map();
const originalChannelNames = new Map();
const pomodoroSettings = new Map();
const activeReminders = new Map();


export async function startPomodoro(channel) {
	console.log(`✅ Démarrage du cycle Pomodoro pour ${channel.name}`);

	const match = channel.name.match(/Pomodoro (\d+)\/(\d+)/);
	if (!match) return console.log('⚠️ Erreur : Impossible de lire la durée du Pomodoro');

	const pomodoroDuration = parseInt(match[1]) * 60;
	const breakDuration = parseInt(match[2]) * 60;


	if (!originalChannelNames.has(channel.id)) {
		originalChannelNames.set(channel.id, channel.name);
		pomodoroSettings.set(channel.id, { pomodoroDuration, breakDuration });
	}

	await runCycle(channel, pomodoroDuration, breakDuration);
}

async function runCycle(channel, pomodoroDuration, breakDuration) {
	while (channel.members.size > 0) {
		console.log(`🍅 Début du Pomodoro de ${pomodoroDuration / 60} minutes`);
		await updateChannelName(channel, pomodoroDuration / 60, 'Pomodoro');
		await countdown(channel, pomodoroDuration, 'Pomodoro', pomodoroDuration, breakDuration);

		if (channel.members.size === 0) break;

		console.log(`☕ Début de la pause de ${breakDuration / 60} minutes`);
		await updateChannelName(channel, breakDuration / 60, 'Pause');
		await countdown(channel, breakDuration, 'Pause', pomodoroDuration, breakDuration);

		if (channel.members.size === 0) break;

		console.log(`✅ Fin du cycle pour ${channel.name}`);

		const settings = pomodoroSettings.get(channel.id);
		if (settings) {
			await runCycle(channel, settings.pomodoroDuration, settings.breakDuration);
		}
	}

	if (channel.members.size === 0) {
		console.log('🚫 Salon vide, réinitialisation...');
		stopTimer(channel);
	}
}

async function countdown(channel, duration, phase, pomodoroDuration, breakDuration) {
	let remainingTime = duration;
	await updateChannelName(channel, Math.floor(remainingTime / 60), phase);

	// Variables pour éviter les doublons de messages
	let midReminderSent = false;
	let nearEndReminderSent = false;

	while (remainingTime > 0 && channel.members.size > 0) {
		await new Promise(resolve => setTimeout(resolve, 60000));
		remainingTime -= 60;

		// 📢 Envoi du rappel à mi-chemin
		if (phase === 'Pomodoro' && !midReminderSent && remainingTime === Math.floor(pomodoroDuration / 2)) {
			channel.send('⏳ Vous êtes à mi-chemin de votre session Pomodoro ! 💪');
			midReminderSent = true; // ✅ Éviter les répétitions
		}

		// 🚨 Envoi du rappel "5 minutes restantes" uniquement si le Pomodoro est assez long
		if (phase === 'Pomodoro' && !nearEndReminderSent && remainingTime === Math.max(60, pomodoroDuration - 300)) {
			channel.send('⚠️ Plus que quelques minutes avant la fin du Pomodoro, finissez votre tâche ! ⏳');
			nearEndReminderSent = true;
		}

		// ✅ Mise à jour du nom du salon toutes les 5 minutes
		if (remainingTime > 0 && remainingTime % 300 === 0) {
			await updateChannelName(channel, Math.floor(remainingTime / 60), phase);
		}
	}

	console.log(`✅ Fin du cycle ${phase} pour ${channel.name}`);

	// ✅ Passage immédiat à la phase suivante
	if (phase === 'Pomodoro') {
		console.log(`☕ Début de la pause de ${breakDuration / 60} min`);
		await updateChannelName(channel, breakDuration / 60, 'Pause');
		return countdown(channel, breakDuration, 'Pause', pomodoroDuration, breakDuration);
	}
	else if (phase === 'Pause') {
		console.log('🍅 Reprise du Pomodoro après la pause');
		await updateChannelName(channel, pomodoroDuration / 60, 'Pomodoro');
		return countdown(channel, pomodoroDuration, 'Pomodoro', pomodoroDuration, breakDuration);
	}
}


async function updateChannelName(channel, timeLeft, phase) {
	const newName = `${originalChannelNames.get(channel.id)} - ${phase}: ${timeLeft} min restantes`.trim();
	console.log(`🔄 Tentative de mise à jour du nom : ${newName}`);

	try {
		await channel.setName(newName);
		console.log(`✅ Discord a bien mis à jour le nom du salon : ${newName}`);


		const updatedChannel = await channel.guild.channels.fetch(channel.id);
		console.log(`🔍 Vérification après mise à jour : ${updatedChannel.name}`);

	}
	catch (error) {
		console.error(`❌ Erreur mise à jour du nom pour ${channel.name} :`, error);
	}
}

export function stopTimer(channel) {
	if (!channel) {
		console.log('⚠️ Tentative d\'arrêt d\'un salon inexistant.');
		return;
	}

	if (activeTimers.has(channel.id)) {
		clearInterval(activeTimers.get(channel.id));
		activeTimers.delete(channel.id);
		console.log(`🛑 Timer arrêté pour ${channel.name}`);
	}

	if (originalChannelNames.has(channel.id)) {
		const originalName = originalChannelNames.get(channel.id);
		console.log(`🔄 Réinitialisation du nom du salon : ${originalName}`);


		const updatedChannel = channel.guild.channels.cache.get(channel.id);
		if (!updatedChannel) {
			console.log(`⚠️ Impossible de réinitialiser, le salon ${channel.name} n'existe plus.`);
			originalChannelNames.delete(channel.id);
			pomodoroSettings.delete(channel.id);
			return;
		}

		updatedChannel.setName(originalName).then(() => {
			console.log(`✅ Nom du salon bien réinitialisé : ${originalName}`);
			originalChannelNames.delete(channel.id);
			pomodoroSettings.delete(channel.id);
		}).catch(error => {
			console.error(`❌ Erreur lors du reset du nom pour ${originalName} :`, error);
		});
	}
	else {
		console.log(`⚠️ Aucun nom original trouvé pour ${channel.name}, suppression de la mémoire.`);
		originalChannelNames.delete(channel.id);
		pomodoroSettings.delete(channel.id);
	}
}

export { activeTimers, originalChannelNames, countdown, updateChannelName };
