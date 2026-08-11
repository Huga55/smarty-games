import { items } from './content/items'
import { oddSets } from './content/odd'
import { patterns, riddles, orders } from './content/riddles'
import { rebuses } from './content/rebus'
import {
  chainBuildings,
  chainEndings,
  chainHidings,
  chainPlaces,
  chainWays,
  scaryGuests,
} from './content/scary'
import { truthFacts } from './content/truth'
import { wordCategories } from './content/words'
import { riskyCodePoints } from './lib/emoji'

const problems: string[] = []

function check(where: string, text: string | undefined): void {
  if (!text) return
  const risky = riskyCodePoints(text)
  if (risky.length > 0) problems.push(`${where}: ${risky.join(', ')}`)
}

for (const item of items) check(`items/${item.id}`, item.emoji)
for (const set of oddSets) for (const option of set.options) check(`odd/${option.label}`, option.emoji)
for (const riddle of riddles) check(`riddle/${riddle.a}`, riddle.emoji)
for (const order of orders) {
  for (const step of order.steps) check(`order/${step.label}`, step.emoji)
}
for (const pattern of patterns) {
  for (const emoji of [...pattern.steps, pattern.answerEmoji]) check('pattern', emoji)
}
for (const rebus of rebuses) {
  check(`rebus/${rebus.answer}`, rebus.left + rebus.right + rebus.answerEmoji)
}
for (const step of [...chainPlaces, ...chainBuildings, ...chainWays, ...chainHidings, ...chainEndings]) {
  check(`scary/${step.text}`, step.emoji)
}
for (const guest of scaryGuests) check(`guest/${guest.name}`, guest.emoji)
for (const fact of truthFacts) check(`truth/${fact.text}`, fact.emoji)
for (const category of wordCategories) check(`category/${category.label}`, category.emoji)

if (problems.length > 0) {
  console.log(`эмодзи, которых может не быть на телефоне: ${problems.length}`)
  for (const problem of problems) console.log(' -', problem)
  process.exitCode = 1
} else {
  console.log('все эмодзи безопасные')
}
