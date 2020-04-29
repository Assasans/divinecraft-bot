import Logger, { registerLoggers } from './helper/logger';
registerLoggers();

import * as Bluebird from 'bluebird';
import * as chalk from 'chalk';

import * as Mineflayer from 'mineflayer';
import * as MineflayerNavigate from 'mineflayer-navigate';

import { Vec3 } from 'vec3';
import { inspect } from 'util';

class App {
	public bot;
	public miner: Miner;

	public host: string;
	public port: number;

	public username: string;
	public password: string;

	public owners: string[];
	public commandPrefix: string;

	public constructor(
		host: string, port: number,
		username: string, password: string,
		owners: string[], commandPrefix: string
	) {
		this.host = host;
		this.port = port;
		
		this.username = username;
		this.password = password;

		this.owners = owners;
		this.commandPrefix = commandPrefix;
	}

	private splitMessage(message: string): string[] {
		let matches: RegExpMatchArray = message.match(/[\w-]+|"[^"]+"/g);

		matches = matches.map((arg: string) => arg.replace(/"/g, ''));
		return matches;
	}

	private async handleMessage(message: string, username: string): Promise<void> {
		if(message.startsWith(this.commandPrefix)) {
			if(!this.owners.includes(username)) {
				this.bot.chat(`${username}, недостаточно прав!`);
				return;
			}

			const commandMessage: string = message.slice(this.commandPrefix.length);

			const args: string[] = this.splitMessage(message);
			const commandName: string = args[0];

			Logger.command.trace(`Parsing message '${chalk.greenBright(commandMessage)}' (prefix '${chalk.greenBright(this.commandPrefix)}', command '${chalk.greenBright(commandName)}')...`);
			Logger.command.trace(`Arguments: [ ${args.map((arg: string) => `${chalk.green('\'')}${chalk.green.bold(arg)}${chalk.green('\'')}`).join(', ')} ]`);

			switch(commandName) {
				case 'ping': {
					this.bot.chat(`${username}, Pong!`);
					Logger.mc.info(`[${chalk.greenBright.bold('ping')}] Pong (from '${chalk.greenBright(username)}')`);

					break;
				}

				case 'eval': {
					const script: string = args[1];

					Logger.mc.info(`[${chalk.greenBright.bold('eval')}] Eval '${chalk.greenBright(script)}' (from '${chalk.greenBright(username)}')`);
					try {
						const result: any = eval(script);
						const inspected: string = inspect(result, { colors: false, compact: true });

						this.bot.chat(inspected.replace(/\n.*/, '...'));
						Logger.mc.info(`[${chalk.greenBright.bold('eval')}] Eval result: ${inspected}`);
					} catch(error) {
						this.bot.chat(`Error: ${error.toString()}`);
						Logger.mc.info(`[${chalk.greenBright.bold('eval')}] Eval error: ${error.toString()}`);
					}

					break;
				}

				case 'miner-start': {
					this.miner.start();
					break;
				}

				case 'miner-stop': {
					this.miner.stop();
					break;
				}

				case 'rotate': {
					this.bot.look(
						Number.parseInt(args[1]),
						Number.parseInt(args[2]),
						true
					);
					break;
				}

				case 'say': {
					const content: string = args[1];

					this.bot.chat(content);
					Logger.mc.info(`[${chalk.greenBright.bold('say')}] Say '${chalk.greenBright(content)}' (from '${chalk.greenBright(username)}')`);

					break;
				}

				case 'goto-pos': {
					const x: number = Number.parseInt(args[1]);
					const y: number = Number.parseInt(args[2]);
					const z: number = Number.parseInt(args[3]);

					const position: Vec3 = new Vec3(x, y, z);
					this.bot.navigate.to(position);
					Logger.mc.info(`[${chalk.greenBright.bold('goto-pos')}] Go to coordinates { X: ${chalk.greenBright(x)}, Y: ${chalk.greenBright(y)}, Z: ${chalk.greenBright(z)} } (from '${chalk.greenBright(username)}')`);

					break;
				}

				case 'goto-player': {
					const targetUsername: string = args[1];

					const player = this.bot.players[targetUsername];
					if(!player) {
						Logger.mc.info(`[${chalk.greenBright.bold('goto-player')}] Player '${chalk.greenBright(targetUsername)}' not found (from '${chalk.greenBright(username)}')`);
						return;
					}

					const target = player.entity;
					this.bot.navigate.to(target.position);
					Logger.mc.info(`[${chalk.greenBright.bold('goto-player')}] Go to player '${chalk.greenBright(targetUsername)}' (from '${chalk.greenBright(username)}')`);

					break;
				}

				case 'goto-cancel': {
					this.bot.navigate.stop();
					Logger.mc.info(`[${chalk.greenBright.bold('goto-cancel')}] Go to cancelled (from '${chalk.greenBright(username)}')`);

					break;
				}

				case 'block-dig': {
					const x: number = Number.parseInt(args[1]);
					const y: number = Number.parseInt(args[2]);
					const z: number = Number.parseInt(args[3]);

					const block = this.bot.blockAt(new Vec3(x, y, z));

					this.bot.dig(block);
					this.bot.chat(`Block at coordinates { X: ${x}, Y: ${y}, Z: ${z} } is '${block.displayName}' ('${block.name}')`);
					Logger.mc.info(`[${chalk.greenBright.bold('block-dig')}] Digged block at coordinates { X: ${chalk.greenBright(x)}, Y: ${chalk.greenBright(y)}, Z: ${chalk.greenBright(z)} } is '${block.displayName}' ('${block.name}') (from '${chalk.greenBright(username)}')`);

					break;
				}

				case 'block-at': {
					const x: number = Number.parseInt(args[1]);
					const y: number = Number.parseInt(args[2]);
					const z: number = Number.parseInt(args[3]);

					const block = this.bot.blockAt(new Vec3(x, y, z));

					console.log(block);

					this.bot.chat(`Block at coordinates { X: ${x}, Y: ${y}, Z: ${z} } is '${block.displayName}' ('${block.name}')`);
					Logger.mc.info(`[${chalk.greenBright.bold('block-at')}] Block at coordinates { X: ${chalk.greenBright(x)}, Y: ${chalk.greenBright(y)}, Z: ${chalk.greenBright(z)} } is '${block.displayName}' ('${block.name}') (from '${chalk.greenBright(username)}')`);

					break;
				}

				case 'attack-player': {
					const targetUsername: string = args[1];

					const player = this.bot.players[targetUsername];
					if(!player) {
						Logger.mc.info(`[${chalk.greenBright.bold('attack-player')}] Player '${chalk.greenBright(targetUsername)}' not found (from '${chalk.greenBright(username)}')`);
						return;
					}

					const target = player.entity;
					this.bot.attack(target);
					Logger.mc.info(`[${chalk.greenBright.bold('attack-player')}] Attack player '${chalk.greenBright(targetUsername)}' (from '${chalk.greenBright(username)}')`);

					break;
				}

				case 'select-quickbar': {
					const slot: number = Number.parseInt(args[1]);

					if(slot < 0 || slot > 8) {
						Logger.mc.info(`[${chalk.greenBright.bold('select-quickbar')}] Quickbar slot ${chalk.greenBright(slot)}' is not valid (from '${chalk.greenBright(username)}')`);
						return;
					}

					this.bot.setQuickBarSlot(slot);
					Logger.mc.info(`[${chalk.greenBright.bold('select-quickbar')}] Set quickbar slot to ${chalk.greenBright(slot)} (from '${chalk.greenBright(username)}')`);

					break;
				}
			}
		}
	}

	public async start(): Promise<void> {
		this.bot = Mineflayer.createBot({
			host: this.host,
			port: this.port,
			version: '1.12.2',
			username: this.username
		});

		const mineflayerNavigate = MineflayerNavigate(Mineflayer);
		mineflayerNavigate(this.bot);

		this.miner = new Miner(this.bot);

		this.bot.on('chat', async (username: string, message: string) => {
			Logger.chat.trace(`[${chalk.yellowBright(username)}]: ${message}`);
			
			try {
				await this.handleMessage(message, username);
			} catch(error) {
				Logger.mc.error(error);
				this.bot.chat(`Error: ${error.toString()}`);
			}
		});

		this.bot.on('message', async (json: any) => {
			const message: string = json.toString();

			Logger.chat.trace(`${message}`);
		});

		this.bot.on('error', (error: Error) => {
			Logger.mc.error(error);
		});

		this.bot.on('error', (reason: string) => {
			Logger.mc.trace(`[${chalk.yellowBright('Server')}/${chalk.yellowBright('Kick')}]: ${reason}`);
		});

		this.bot.once('spawn', async () => {
			this.bot.chat(`/login ${this.password}`);
			Logger.mc.trace('Logged in');
			await Bluebird.delay(2500);

			this.bot.setQuickBarSlot(0);
			Logger.mc.trace('Set quick bar slot');
			await Bluebird.delay(100);

			this.bot.activateItem();
			await Bluebird.delay(100);
			this.bot.deactivateItem();
			await Bluebird.delay(750);

			this.bot.clickWindow(22, 0, 0, async () => {
				Logger.mc.trace('Clicked on \'Skyblock\' item');

				await Bluebird.delay(750);
				this.bot.clickWindow(20, 0, 0, async () => {
					Logger.mc.trace('Clicked on \'Skyblock 2\' item');

					await Bluebird.delay(2500);
					this.bot.chat('/is home');
					Logger.mc.trace('Teleported to home');
				});
			});
		})
		
		this.bot.navigate.on('pathFound', (path) => {
			this.bot.chat(`Found path. I can get there in ${path.length} moves.`);
		});

		this.bot.navigate.on('cannotFind', (closestPath) => {
			this.bot.chat('Unable to find path. Getting as close as possible');
			this.bot.navigate.walk(closestPath);
		});

		this.bot.navigate.on('arrived', () => {
			this.bot.chat('I have arrived');
		});

		this.bot.navigate.on('interrupted', () => {
			this.bot.chat('Stopping');
		});

		process.stdin.on('data', (data: Buffer) => {
			const script: string = data.toString();

			try {
				const result: any = eval(script);
				const inspected: string = inspect(result, { colors: false, compact: true });

				Logger.main.info(`[${chalk.greenBright.bold('eval')}] Eval result: ${inspected}`);
			} catch(error) {
				Logger.main.info(`[${chalk.greenBright.bold('eval')}] Eval error: ${error.toString()}`);
			}
		});
	}
}

class Miner {
	private bot;

	public running: boolean;

	private currentPos: Vec3;
	private currentBlock;

	public constructor(bot) {
		this.bot = bot;

		this.running = false;

		this.bot.on('diggingCompleted', (block) => {
			Logger.miner.trace(`Block '${block.displayName}' ('${block.name}') is digged.`);
		});

		this.bot.on('diggingAborted', (block) => {
			Logger.miner.error(`Error on digging block '${block.displayName}' ('${block.name}')`);
		});

		setInterval(() => {
			this.handler();
		}, 100);
	}

	private async handler() {
		if(this.running) {
			if(this.bot.targetDigBlock) return;

			this.getBlock();

			if(!this.currentBlock) return;
			if(this.currentBlock.name === 'air') return;

			Logger.miner.trace(`Block at coordinates { X: ${chalk.greenBright(this.currentBlock.position.x)}, Y: ${chalk.greenBright(this.currentBlock.position.y)}, Z: ${chalk.greenBright(this.currentBlock.position.z)} } is '${this.currentBlock.displayName}' ('${this.currentBlock.name}')`);

			this.mineBlock();
		}
	}

	private getBlock(): void {
		this.currentBlock = this.bot.blockInSight();
		this.currentPos = new Vec3(
			this.currentBlock.position.x,
			this.currentBlock.position.y,
			this.currentBlock.position.z
		);
	}

	private mineBlock(): void {
		this.bot.dig(this.currentBlock);
	}

	public start(): void {
		this.running = true;
	}

	public stop(): void {
		this.running = false;
		setTimeout(() => {
			this.bot.stopDigging();
		}, 1000);
	}
}

Logger.preinit.info('Starting wrapped application...');
const app: App = new App(
	'mc.server.com',
	25565,
	'username',
	'password',
	[
		'owner1',
		'owner2'
	],
	'$'
);
app.start().then(() => {
	Logger.preinit.info('Wrapped application started');
}).catch((error: Error) => {
	Logger.preinit.error(error);
});
