import { games } from './game/games'
import { rules } from './game/rules'
import { riskyCodePoints } from './lib/emoji'
import { defaultSettings } from './lib/storage'

const variants = [
  { ...defaultSettings },
  { ...defaultSettings, hard: true, memoryCount: 6 },
  { ...defaultSettings, memoryCount: 3, speedSeconds: 60 },
]

let checked = 0
const problems: string[] = []

for (const game of games) {
  if (!rules[game.id] || rules[game.id]?.length === 0) problems.push(`${game.id}: нет правил для кнопки «?»`)
  if (game.isAvailable && !game.isAvailable()) {
    console.log(`пропущена (нет данных): ${game.title}`)
    continue
  }
  for (const settings of variants) {
    for (let i = 0; i < 200; i++) {
      const round = game.next(settings)
      checked++
      const where = `${game.id} #${i}`
      if (!round.prompt || round.prompt.includes('undefined')) problems.push(`${where}: плохое задание «${round.prompt}»`)
      if (round.answer?.includes('undefined')) problems.push(`${where}: плохой ответ «${round.answer}»`)
      if (round.hints?.some((hint) => !hint || hint.includes('undefined'))) problems.push(`${where}: плохая подсказка`)
      if (round.mode === 'card' && round.visual.kind === 'emoji') {
        if (round.visual.emojis.length === 0) problems.push(`${where}: пустой набор картинок`)
        if (round.visual.emojis.some((emoji) => !emoji)) problems.push(`${where}: пустая картинка`)
        if (game.id === 'odd' && round.visual.emojis.length !== 4) {
          problems.push(`${where}: в «что лишнее» ${round.visual.emojis.length} картинок вместо 4`)
        }
        if (game.id === 'pair' && round.visual.emojis.length < 5) {
          problems.push(`${where}: в «найди пару» всего ${round.visual.emojis.length} слов`)
        }
      }
      if (round.mode === 'memory' && round.emojis.length !== settings.memoryCount) {
        problems.push(`${where}: ${round.emojis.length} картинок вместо ${settings.memoryCount}`)
      }
      if (round.mode === 'changed') {
        const diff = round.before.filter((emoji, index) => emoji !== round.after[index]).length
        if (diff !== 1) problems.push(`${where}: изменилось ${diff} картинок вместо одной`)
      }
      if (round.mode === 'timer' && round.seconds <= 0) problems.push(`${where}: таймер на ${round.seconds} секунд`)
      if (round.mode === 'card' && round.visual.kind === 'rebus') {
        if (!round.visual.left || !round.visual.right) problems.push(`${where}: в ребусе нет картинки`)
        if (!round.answerEmoji) problems.push(`${where}: у ребуса нет ответа картинкой`)
      }
      if (round.mode === 'card' && round.visual.kind === 'sequence' && round.visual.steps.length < 4) {
        problems.push(`${where}: узор из ${round.visual.steps.length} картинок — мало`)
      }
      if (round.mode === 'truth' && (!round.why || !round.emoji)) problems.push(`${where}: факт без объяснения`)
      const emojis = [
        round.answerEmoji,
        round.mode === 'truth' ? round.emoji : undefined,
        round.mode === 'card' && round.visual.kind === 'emoji' ? round.visual.emojis.join('') : undefined,
        round.mode === 'card' && round.visual.kind === 'sequence' ? round.visual.steps.join('') : undefined,
        round.mode === 'card' && round.visual.kind === 'rebus' ? round.visual.left + round.visual.right : undefined,
        round.mode === 'card' && round.visual.kind === 'letter' ? round.visual.badge : undefined,
        round.mode === 'memory' ? round.emojis.join('') : undefined,
        round.mode === 'changed' ? round.before.join('') + round.after.join('') : undefined,
        round.mode === 'chain' ? round.steps.map((step) => step.emoji).join('') + round.ending.emoji : undefined,
      ]
      for (const emoji of emojis) {
        if (!emoji) continue
        const risky = riskyCodePoints(emoji)
        if (risky.length > 0) problems.push(`${where}: эмодзи может не отобразиться — ${risky.join(', ')}`)
      }
      if (round.mode === 'chain') {
        if (round.steps.length < 3) problems.push(`${where}: в истории всего ${round.steps.length} шага`)
        if (round.steps.some((step) => !step.emoji || !step.text)) problems.push(`${where}: пустой шаг истории`)
        if (!round.ending.emoji || !round.ending.text) problems.push(`${where}: пустая развязка`)
      }
    }
  }
}

console.log(`проверено раундов: ${checked}`)
if (problems.length > 0) {
  console.log(`\nнайдено проблем: ${problems.length}`)
  for (const problem of [...new Set(problems)].slice(0, 25)) console.log(' -', problem)
  process.exitCode = 1
} else {
  console.log('всё в порядке')
}
