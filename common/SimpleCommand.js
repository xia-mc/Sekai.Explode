// @ts-check

const { SlashCommandBuilder } = require('discord.js');

/**
 * @typedef {import('../util/types').Command} Command
 */

/**
 * @typedef {import('discord.js').ChatInputCommandInteraction} ChatInputCommandInteraction
 */

/**
 * @template {Function} F
 * @typedef {F extends (arg: infer T) => unknown ? T : never} FirstParameter
 */

/**
 * @template {Option<unknown, boolean>} O
 * @typedef {(
 *     O extends IntegerOption<infer Required> ? (Required extends true ? number : number | undefined) :
 *     never
 * )} OptionValue
 */

/**
 * @template {Option<unknown, boolean>[]} Options
 * @typedef {{
 *     [I in keyof Options]: Options[I] extends Option<unknown, boolean> ? OptionValue<Options[I]> : never
 * }} OptionValues
 */

/**
 * @template {unknown} [T = unknown]
 * @template {boolean} [Required = boolean]
 */
class Option {
	name;

	#required;

	/**
	 * @param {import('discord.js').SharedSlashCommandOptions} builder オプションの Builder
	 * @param {(builder: import('discord.js').SharedSlashCommandOptions) => void} addOption Builder にオプションを追加する関数
	 */
	constructor(builder, addOption) {
		const index = builder.options.length;
		addOption(builder);
		const json = builder.options[index].toJSON();
		this.name = json.name;
		this.#required = /** @type {Required} */ (json.required);
	}

	/**
	 * オプションの値を取得する。
	 * @abstract
	 * @param {ChatInputCommandInteraction} _interaction コマンドのインタラクション
	 * @returns {Required extends true ? T : T | undefined}
	 */
	get(_interaction) {
		throw new Error('Not implemented');
	}

	/**
	 * 必須のオプションか
	 * @returns {this is Option<T, true>}
	 */
	isRequired() {
		return this.#required;
	}
}

/**
 * @typedef {FirstParameter<typeof import('discord.js').SharedSlashCommandOptions.prototype.addIntegerOption>} IntegerOptionInput
 */

/**
 * @template {boolean} [Required = boolean]
 * @extends {Option<number, Required>}
 */
class IntegerOption extends Option {
	/**
	 * @param {import('discord.js').SharedSlashCommandOptions} builder
	 * @param {IntegerOptionInput} input
	 */
	constructor(builder, input) {
		super(builder, (builder) => {
			builder.addIntegerOption(input);
		});
	}

	/**
	 * @override
	 * @param {ChatInputCommandInteraction} interaction
	 */
	get(interaction) {
		if (this.isRequired()) {
			return interaction.options.getInteger(this.name, true);
		} else {
			return interaction.options.getInteger(this.name) ?? void 0;
		}
	}
}

/**
 * シンプルな SlashCommandBuilder(?)
 * @template {Option<unknown, boolean>[]} [Options = []]
 */
class SimpleSlashCommandBuilder {
	#name;

	#description;

	handle;

	/**
	 * @type {Options}
	 */
	options;

	/**
	 * @param {string} name
	 * @param {string} description
	 * @param {SlashCommandBuilder} handle
	 * @param {Options} options
	 */
	constructor(name, description, handle, options) {
		handle.setName(name);
		handle.setDescription(description);
		this.#name = name;
		this.#description = description;
		this.handle = handle;
		this.options = options;
	}

	/**
	 * @param {string} name コマンドの名前
	 * @param {string} description コマンドの説明文
	 * @returns {SimpleSlashCommandBuilder<[]>}
	 */
	static create(name, description) {
		return new SimpleSlashCommandBuilder(
			name,
			description,
			new SlashCommandBuilder(),
			[],
		);
	}

	/**
	 * @template {boolean} [Required = false]
	 * @param {IntegerOptionInput} input
	 * @returns
	 */
	addIntegerOption(input) {
		/** @type {[...Options, IntegerOption<Required>]} */
		const options = [...this.options, new IntegerOption(this.handle, input)];
		return new SimpleSlashCommandBuilder(
			this.#name,
			this.#description,
			this.handle,
			options,
		);
	}
}

/**
 * @template {Option<unknown, boolean>[]} [Options = []]
 * @implements {Command}
 */
class SimpleCommand {
	action;

	builder;

	/**
	 *
	 * @param {SimpleSlashCommandBuilder<Options>} builder
	 * @param {(
	 *     interaction: ChatInputCommandInteraction,
	 *     ...options: OptionValues<Options>
	 * ) => Promise<void>} action
	 */
	constructor(builder, action) {
		this.builder = builder;
		this.data = builder.handle;
		this.action = action;
	}

	/**
	 * @param {ChatInputCommandInteraction} interaction コマンドのインタラクション
	 */
	async execute(interaction) {
		const optionValues = /** @type {OptionValues<Options>} */ (
			this.builder.options.map((option) => option.get(interaction))
		);
		await this.action(interaction, ...optionValues);
	}
}

module.exports = {
	SimpleSlashCommandBuilder,
	SimpleCommand,
};
