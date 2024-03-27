import { createCanvas } from 'canvas';
import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';
import { LANG, strFormat } from '../../../util/languages';
import { DayOfWeek, MonthCalendar } from '../util/calendar';
import {
	BoundingBox,
	CanvasTable,
	CanvasTextBox,
	InlineText,
} from '../util/canvasUtils';

function dayColor(day: DayOfWeek) {
	switch (day) {
		case DayOfWeek.Sunday:
			return 'red';
		case DayOfWeek.Saturday:
			return 'blue';
		default:
			return 'black';
	}
}

export default SimpleSlashCommandBuilder.create(
	LANG.commands.cal.name,
	LANG.commands.cal.description,
).build(async (interaction) => {
	const calendar = new MonthCalendar();
	const today = new Date();
	const table = [
		LANG.commands.cal.dayLabels.map((e, i) => {
			const text = new InlineText(e);
			text.color = dayColor(i as DayOfWeek);
			return text;
		}),
		...Array.from(calendar.weeks()).map((week) =>
			week.map((day) => {
				const text = new InlineText(day.date.toString());
				text.color = dayColor(day.day);
				if (!calendar.includes(day)) {
					text.color = 'gray';
				}
				if (day.is(today)) {
					text.font = 'bold 24px serif';
				}
				return text;
			}),
		),
	];
	const canvas = createCanvas(800, 400);
	const ctx = canvas.getContext('2d');
	new BoundingBox(0, 0, 800, 400).fill(ctx, 'white');
	const title = strFormat(LANG.commands.cal.monthYear, {
		month: LANG.commands.cal.monthNames[calendar.month],
		year: calendar.year,
	});
	const titleStyle = new InlineText(title);
	titleStyle.color = 'black';
	titleStyle.font = '48px serif';
	new CanvasTextBox(titleStyle, new BoundingBox(50, 0, 700, 100)).renderTo(ctx);
	new CanvasTable(table, new BoundingBox(50, 100, 700, 300)).renderTo(ctx);
	await interaction.reply({
		files: [
			{
				attachment: canvas.toBuffer(),
				name: 'calendar.png',
			},
		],
		embeds: [
			{
				title: strFormat(title),
				image: {
					url: 'attachment://calendar.png',
				},
			},
		],
	});
});
