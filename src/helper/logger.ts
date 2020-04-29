import * as log4js from 'log4js';
import * as chalk from 'chalk';

const Logger = {
	preinit: log4js.getLogger('PreInit'),
	main: log4js.getLogger('Main'),

	mc: log4js.getLogger('Minecraft'),
	chat: log4js.getLogger('MC/Chat'),
	command: log4js.getLogger('MC/Command'),
	miner: log4js.getLogger('MC/Miner'),

	looper: log4js.getLogger('Looper')
};

export function registerLoggers(): void {
	log4js.configure({
		appenders: {
			console: {
				type: 'console',
				layout: {
					type: 'pattern',
					pattern: `%[[%d{hh:mm:ss}] [%p/${chalk.bold('%c')}]%]: %m`
				}
			}
		},
		categories: {
			default: {
				appenders: [
					'console'
				],
				level: 'trace'
			}
		}
	});
}

export default Logger;