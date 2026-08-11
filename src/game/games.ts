import { items } from '../content/items'
import { oddSets } from '../content/odd'
import { cars, heroes } from '../content/pictures'
import { rebuses } from '../content/rebus'
import { orders, patterns, riddles } from '../content/riddles'
import { truthFacts } from '../content/truth'
import {
  braveTasks,
  chainBuildings,
  chainEndings,
  chainHidings,
  chainMoods,
  chainPlaces,
  chainWays,
  scaryGuests,
  scarySounds,
} from '../content/scary'
import type { Cat, Item } from '../content/types'
import { letters, pantomimeExtras, speedTopics, wordCategories } from '../content/words'
import type { WordCategory } from '../content/words'
import { nextFrom, pick, randomInt, sample, shuffle } from '../lib/random'
import type { Settings } from '../lib/storage'
import type {
  CardRound,
  ChainRound,
  ChangedRound,
  Game,
  MemoryRound,
  Round,
  TimerRound,
  TruthRound,
} from './types'

const livingCats: Cat[] = ['животное', 'птица', 'рыба', 'насекомое']

function isLiving(item: Item): boolean {
  return item.cats.some((cat) => livingCats.includes(cat))
}

function byCat(cat: Cat): Item[] {
  return items.filter((item) => item.cats.includes(cat))
}

function firstLetter(word: string): string {
  return word.charAt(0).toUpperCase()
}

function examplesFor(category: WordCategory, letter: string): string[] {
  const fromItems = (category.cats ?? [])
    .flatMap(byCat)
    .filter((item) => firstLetter(item.name) === letter)
    .map((item) => item.name)
  const fromExtra = (category.extraExamples ?? []).filter((word) => firstLetter(word) === letter)
  return [...new Set([...fromItems, ...fromExtra])]
}

/** Приметы объекта короткими тезисами — взрослый сам складывает из них фразы. */
function traitsOf(item: Item): string[] {
  const traits: string[] = []
  const mainCat = item.cats[0]
  if (mainCat) traits.push(mainCat)
  if (item.tags?.includes('большой')) traits.push('большой')
  if (item.tags?.includes('маленький')) traits.push('маленький')
  if (item.where) traits.push(`бывает ${item.where}`)
  if (item.color) traits.push(`цвет — ${item.color}`)
  if (item.eats) traits.push(`ест ${item.eats}`)
  if (item.sound) traits.push(`говорит «${item.sound}»`)
  if (item.tags?.includes('летает')) traits.push('умеет летать')
  if (item.tags?.includes('плавает')) traits.push('умеет плавать')
  traits.push(...(item.facts ?? []))
  return traits
}

// ─── Смотри и называй ─────────────────────────────────────────────────

const carsGame: Game = {
  id: 'cars',
  title: 'Марки машин',
  emoji: '🚗',
  section: 'look',
  howTo: 'Показываем значок, ребёнок называет марку. Ответ спрятан под кнопкой.',
  scoring: true,
  isAvailable: () => cars.length > 0,
  missingHint: 'Положи картинки логотипов в папку src/assets/cars — игра появится сама.',
  next: (): CardRound => {
    const car = nextFrom('cars', cars)
    return {
      mode: 'card',
      visual: { kind: 'image', src: car.src },
      prompt: 'Что это за машина?',
      answer: car.label,
    }
  },
}

const heroesGame: Game = {
  id: 'heroes',
  title: 'Угадай героя',
  emoji: '🎬',
  section: 'look',
  howTo: 'Показываем картинку, ребёнок называет героя.',
  scoring: true,
  isAvailable: () => heroes.length > 0,
  missingHint: 'Положи картинки героев в папку src/assets/heroes — игра появится сама.',
  next: (): CardRound => {
    const hero = nextFrom('heroes', heroes)
    return {
      mode: 'card',
      visual: { kind: 'image', src: hero.src },
      prompt: 'Кто это?',
      answer: hero.label,
    }
  },
}

const countGame: Game = {
  id: 'count',
  title: 'Сколько?',
  emoji: '🔢',
  section: 'look',
  howTo: 'Считаем вслух вместе. Потом спрашиваем: а если одну убрать?',
  scoring: true,
  next: (settings): CardRound => {
    const item = nextFrom('count', items)
    const count = settings.hard ? randomInt(4, 10) : randomInt(1, 6)
    return {
      mode: 'card',
      visual: { kind: 'emoji', emojis: Array.from({ length: count }, () => item.emoji) },
      subject: item.name,
      prompt: 'Сколько тут? Посчитайте вслух вместе.',
      answer: String(count),
      hints: [
        'А если одну убрать — сколько останется?',
        'А если добавить ещё одну?',
        'Покажи столько же на пальцах',
      ],
    }
  },
}

const memoryGame: Game = {
  id: 'memory',
  title: 'Запомни и назови',
  emoji: '👀',
  section: 'look',
  howTo: 'Показываем картинки на несколько секунд, потом экран прячется — ребёнок вспоминает.',
  scoring: true,
  setup: ['memoryCount', 'memorySeconds'],
  next: (settings): MemoryRound => {
    const chosen = sample(items, settings.memoryCount)
    return {
      mode: 'memory',
      emojis: chosen.map((item) => item.emoji),
      labels: chosen.map((item) => item.name),
      showSeconds: settings.memorySeconds,
      prompt: 'Запомни картинки!',
      answer: chosen.map((item) => item.name).join(', '),
    }
  },
}

const changedGame: Game = {
  id: 'changed',
  title: 'Что изменилось?',
  emoji: '🔄',
  section: 'look',
  howTo: 'Показываем картинки, прячем, показываем снова — но одна уже другая.',
  scoring: true,
  setup: ['memoryCount', 'memorySeconds'],
  next: (settings): ChangedRound => {
    const chosen = sample(items, settings.memoryCount)
    const replaceAt = randomInt(0, chosen.length - 1)
    const oldItem = chosen[replaceAt] as Item
    const rest = items.filter((item) => !chosen.some((c) => c.id === item.id))
    const newItem = pick(rest)
    const after = chosen.map((item, index) => (index === replaceAt ? newItem : item))
    return {
      mode: 'changed',
      before: chosen.map((item) => item.emoji),
      after: after.map((item) => item.emoji),
      showSeconds: settings.memorySeconds,
      prompt: 'Что изменилось?',
      answer: `Было «${oldItem.name}», стало «${newItem.name}»`,
      answerEmoji: newItem.emoji,
    }
  },
}

// ─── Слушай и отвечай ─────────────────────────────────────────────────

const letterGame: Game = {
  id: 'letter',
  title: 'Слово на букву',
  emoji: '🔤',
  section: 'listen',
  howTo: 'Читаем задание вслух. Ребёнок придумывает слово сам — экран ему не нужен.',
  scoring: true,
  next: (settings): CardRound => {
    const categoryPool = wordCategories.filter((category) => settings.hard || !category.hard)
    const category = nextFrom('wordCategory', categoryPool)
    const letterPool = letters.filter((letter) => settings.hard || !letter.hard)
    const withExamples = letterPool.filter((letter) => examplesFor(category, letter.letter).length > 0)
    const letter = pick(withExamples.length > 0 ? withExamples : letterPool)
    const examples = examplesFor(category, letter.letter)
    return {
      mode: 'card',
      visual: { kind: 'letter', text: letter.letter, badge: category.emoji },
      prompt: `Назови ${category.label} на букву «${letter.letter}»`,
      speech: `Назови ${category.label} на букву ${letter.letter}`,
      hints: examples.length > 0 ? [`Подсказки: ${examples.slice(0, 6).join(', ')}`] : undefined,
      note: 'Можно усложнить: назови три слова на эту букву.',
    }
  },
}

const riddleGame: Game = {
  id: 'riddle',
  title: 'Загадки',
  emoji: '🧩',
  section: 'listen',
  howTo: 'Читаем загадку вслух, ребёнок отвечает словами.',
  scoring: true,
  next: (settings): CardRound => {
    // В простом режиме чаще спрашиваем про звуки и приметы, в сложном —
    // настоящие загадки с подвохом.
    const kind = settings.hard
      ? pick(['manual', 'manual', 'manual', 'facts'] as const)
      : pick(['manual', 'sound', 'sound', 'facts'] as const)

    if (kind === 'sound') {
      const speaking = items.filter((item) => item.sound)
      const item = nextFrom('soundRiddle', speaking)
      return {
        mode: 'card',
        visual: { kind: 'none' },
        prompt: `Кто говорит «${item.sound}»?`,
        answer: item.name,
        answerEmoji: item.emoji,
      }
    }

    if (kind === 'facts') {
      const withFacts = items.filter((item) => (item.facts?.length ?? 0) >= 2)
      const item = nextFrom('factRiddle', withFacts)
      const facts = sample(item.facts ?? [], 2)
      const question = isLiving(item) ? 'Кто это?' : 'Что это?'
      return {
        mode: 'card',
        visual: { kind: 'none' },
        prompt: `Угадай: ${item.cats[0]}, ${facts.join(', ')}. ${question}`,
        answer: item.name,
        answerEmoji: item.emoji,
      }
    }

    const pool = settings.hard ? riddles : riddles.filter((riddle) => !riddle.hard)
    const riddle = nextFrom(settings.hard ? 'riddlesHard' : 'riddlesEasy', pool)
    return {
      mode: 'card',
      visual: { kind: 'none' },
      prompt: riddle.q,
      answer: riddle.a,
      answerEmoji: riddle.emoji,
    }
  },
}

const rebusGame: Game = {
  id: 'rebus',
  title: 'Ребусы',
  emoji: '➕',
  section: 'listen',
  howTo: 'Складываем две картинки. Что получится? Ответ тоже картинкой.',
  scoring: true,
  next: (): CardRound => {
    const rebus = nextFrom('rebuses', rebuses)
    return {
      mode: 'card',
      visual: { kind: 'rebus', left: rebus.left, right: rebus.right },
      prompt: 'Что получится, если сложить?',
      answer: rebus.answer,
      answerEmoji: rebus.answerEmoji,
      hints: [rebus.hint],
    }
  },
}

const oddGame: Game = {
  id: 'odd',
  title: 'Что лишнее?',
  emoji: '🍏',
  section: 'listen',
  howTo: 'Читаем четыре слова вслух. Главное не ответ, а «почему».',
  scoring: true,
  next: (): CardRound => {
    const useManual = Math.random() < 0.5
    if (useManual) {
      const set = nextFrom('oddSets', oddSets)
      const options = shuffle(set.options)
      return {
        mode: 'card',
        visual: { kind: 'emoji', emojis: options.map((option) => option.emoji) },
        prompt: `Что лишнее: ${options.map((option) => option.label).join(', ')}?`,
        note: set.note,
        hints: ['Обязательно спроси: а почему?'],
      }
    }

    const catsForOdd: Cat[] = [
      'животное',
      'птица',
      'фрукт',
      'овощ',
      'транспорт',
      'еда',
      'одежда',
      'посуда',
      'игрушка',
      'насекомое',
      'музыка',
      'мебель',
    ]
    const [mainCat, otherCat] = sample(catsForOdd, 2) as [Cat, Cat]
    const main = sample(byCat(mainCat), 3)
    const other = sample(
      byCat(otherCat).filter((item) => !item.cats.includes(mainCat)),
      1,
    )
    const options = shuffle([...main, ...other])
    const odd = other[0] as Item
    return {
      mode: 'card',
      visual: { kind: 'emoji', emojis: options.map((item) => item.emoji) },
      prompt: `Что лишнее: ${options.map((item) => item.name).join(', ')}?`,
      answer: odd.name,
      answerEmoji: odd.emoji,
      note: `Задумано так: три раза «${mainCat}», а «${odd.name}» — это ${otherCat}. Но если ребёнок объяснил иначе и логично — это тоже правильно.`,
      hints: ['Обязательно спроси: а почему?'],
    }
  },
}

const pairGame: Game = {
  id: 'pair',
  title: 'Найди пару',
  emoji: '🔍',
  section: 'listen',
  howTo: 'Читаем список слов, ребёнок находит два подходящих друг к другу.',
  scoring: true,
  next: (): CardRound => {
    const catsForPairs: Cat[] = ['животное', 'фрукт', 'овощ', 'транспорт', 'еда', 'одежда', 'игрушка', 'посуда', 'птица']
    const [pairCat, ...otherCats] = shuffle(catsForPairs) as [Cat, ...Cat[]]
    const pair = sample(byCat(pairCat), 2)
    const others = otherCats
      .slice(0, 4)
      .map((cat) => sample(byCat(cat).filter((item) => !item.cats.includes(pairCat)), 1)[0])
      .filter((item): item is Item => Boolean(item))
    const options = shuffle([...pair, ...others])
    const [first, second] = pair as [Item, Item]
    return {
      mode: 'card',
      visual: { kind: 'emoji', emojis: options.map((item) => item.emoji) },
      prompt: `Слушай: ${options.map((item) => item.name).join(', ')}. Найди два слова, которые подходят друг к другу.`,
      answer: `${first.name} и ${second.name}`,
      note: `Задумано: оба — это «${pairCat}». Другое разумное объяснение тоже принимаем.`,
    }
  },
}

const orderGame: Game = {
  id: 'order',
  title: 'Что сначала?',
  emoji: '🔀',
  section: 'listen',
  howTo: 'Картинки перемешаны. Ребёнок говорит, что было сначала, а что потом.',
  scoring: true,
  next: (): CardRound => {
    const order = nextFrom('orders', orders)
    const mixed = shuffle(order.steps)
    return {
      mode: 'card',
      visual: { kind: 'emoji', emojis: mixed.map((step) => step.emoji) },
      prompt: `Что было сначала, а что потом: ${mixed.map((step) => step.label).join(', ')}?`,
      answer: order.answer,
      hints: ['Спроси, почему именно так', 'Можно разложить по порядку на пальцах: раз, два, три'],
    }
  },
}

const patternGame: Game = {
  id: 'pattern',
  title: 'Продолжи узор',
  emoji: '🔵',
  section: 'look',
  howTo: 'Показываем ряд картинок. Какая будет следующей?',
  scoring: true,
  next: (): CardRound => {
    const pattern = nextFrom('patterns', patterns)
    return {
      mode: 'card',
      visual: { kind: 'sequence', steps: pattern.steps },
      prompt: 'Какая картинка будет следующей?',
      answer: pattern.answer,
      answerEmoji: pattern.answerEmoji,
    }
  },
}

const truthGame: Game = {
  id: 'truth',
  title: 'Правда или нет',
  emoji: '🤔',
  section: 'together',
  howTo: 'Читаем вслух, ребёнок сам жмёт кнопку. После ответа обязательно читаем объяснение.',
  scoring: true,
  next: (settings): TruthRound => {
    const pool = settings.hard ? truthFacts : truthFacts.filter((fact) => !fact.hard)
    const fact = nextFrom(settings.hard ? 'truthHard' : 'truthEasy', pool)
    return {
      mode: 'truth',
      emoji: fact.emoji,
      truth: fact.truth,
      why: fact.why,
      prompt: fact.text,
    }
  },
}

// ─── Играем вместе ────────────────────────────────────────────────────

const whoAmIGame: Game = {
  id: 'whoami',
  title: 'Кто я?',
  emoji: '🕵️',
  section: 'together',
  howTo: 'Описываем словами, не называя. Ребёнок угадывает. Потом меняемся ролями.',
  scoring: true,
  next: (): CardRound => {
    const withFacts = items.filter((item) => (item.facts?.length ?? 0) >= 1)
    const item = nextFrom('whoami', withFacts)
    return {
      mode: 'card',
      visual: { kind: 'emoji', emojis: [item.emoji] },
      subject: item.name,
      prompt: 'Опиши это, не называя слово',
      answer: item.name,
      hints: traitsOf(item),
      note: 'В следующий раз пусть загадывает ребёнок, а угадываешь ты.',
      adultOnly: true,
    }
  },
}

const pantomimeGame: Game = {
  id: 'pantomime',
  title: 'Покажи без слов',
  emoji: '🎭',
  section: 'together',
  howTo: 'Показываем движениями, без слов. Кто угадал — тот показывает следующим.',
  scoring: true,
  next: (): CardRound => {
    const showable = items.filter((item) => item.show)
    const useItem = Math.random() < 0.6
    if (useItem) {
      const item = nextFrom('pantomimeItems', showable)
      return {
        mode: 'card',
        visual: { kind: 'emoji', emojis: [item.emoji] },
        subject: item.name,
        prompt: 'Посмотри на картинку и покажи это без слов',
        answer: item.name,
        hints: ['Говорить нельзя — только движения'],
        adultOnly: true,
      }
    }
    const action = nextFrom('pantomimeExtras', pantomimeExtras)
    return {
      mode: 'card',
      visual: { kind: 'none' },
      subject: action,
      prompt: 'Загляни под шторку и покажи это без слов',
      answer: action,
      hints: ['Говорить нельзя — только движения'],
      adultOnly: true,
    }
  },
}

const explainGame: Game = {
  id: 'explain',
  title: 'Объясни слово',
  emoji: '💬',
  section: 'together',
  howTo: 'Ребёнок рассказывает всё, что знает. Помогаем наводящими вопросами.',
  scoring: false,
  next: (): CardRound => {
    const item = nextFrom('explain', items)
    const questions = ['Что это такое?', 'Какого оно цвета?', 'Большое или маленькое?']
    if (item.where) questions.push('Где это бывает?')
    if (item.eats) questions.push('Что оно ест?')
    if (item.sound) questions.push('Как оно говорит?')
    questions.push('Зачем оно нужно?', 'А у нас такое есть?')
    return {
      mode: 'card',
      visual: { kind: 'emoji', emojis: [item.emoji] },
      subject: item.name,
      prompt: `Расскажи всё, что знаешь: ${item.name}`,
      hints: questions,
      note: 'Тут нет правильного ответа — важно, чтобы ребёнок говорил много.',
    }
  },
}

const storyGame: Game = {
  id: 'story',
  title: 'Придумай историю',
  emoji: '🎲',
  section: 'together',
  howTo: 'Три случайные картинки — и сочиняем историю по очереди, по одному предложению.',
  scoring: false,
  next: (): CardRound => {
    const chosen = sample(items, 3)
    return {
      mode: 'card',
      visual: { kind: 'emoji', emojis: chosen.map((item) => item.emoji) },
      subject: chosen.map((item) => item.name).join(' + '),
      prompt: `Придумай историю: ${chosen.map((item) => item.name).join(', ')}`,
      hints: ['Кто главный герой?', 'Что случилось?', 'Чем всё закончилось?', 'А что было бы, если...'],
      note: 'Хорошо получается, если рассказывать по одному предложению по очереди.',
    }
  },
}

const speedGame: Game = {
  id: 'speed',
  title: 'Кто быстрее назовёт',
  emoji: '⏱️',
  section: 'together',
  howTo: 'Называем по очереди, пока идёт время. Кто не смог — тот проиграл.',
  scoring: false,
  next: (settings): TimerRound => {
    const topic = nextFrom('speedTopics', speedTopics)
    return {
      mode: 'timer',
      seconds: settings.speedSeconds,
      prompt: `Называйте по очереди: ${topic}`,
      hints: ['Взрослый может нарочно ошибаться — так веселее'],
    }
  },
}

// ─── Страшилки ────────────────────────────────────────────────────────

const darkStoryGame: Game = {
  id: 'darkstory',
  title: 'Тёмная-тёмная история',
  emoji: '🌒',
  section: 'scary',
  howTo: 'Открываем по одному шагу, ребёнок повторяет и добавляет своё. В конце — кто там!',
  scoring: false,
  next: (): ChainRound => ({
    mode: 'chain',
    steps: [
      nextFrom('chainPlaces', chainPlaces),
      nextFrom('chainBuildings', chainBuildings),
      nextFrom('chainWays', chainWays),
      nextFrom('chainHidings', chainHidings),
    ],
    ending: nextFrom('chainEndings', chainEndings),
    prompt: 'Слушай внимательно... В одном месте был...',
    hints: [pick(chainMoods), 'Развязка всегда добрая — пугать не нужно, нужно интриговать'],
  }),
}

const banishGame: Game = {
  id: 'banish',
  title: 'Прогони страшилку',
  emoji: '👻',
  section: 'scary',
  howTo: 'К нам пришла страшилка. Ребёнок придумывает, как её прогнать по-доброму.',
  scoring: false,
  next: (): CardRound => {
    const guest = nextFrom('scaryGuests', scaryGuests)
    return {
      mode: 'card',
      visual: { kind: 'emoji', emojis: [guest.emoji] },
      subject: guest.name,
      prompt: `К нам пришло: ${guest.name}. И вот что смешно — ${guest.quirk}. Что будем делать?`,
      hints: guest.ideas,
      note: 'Соглашайся с любой идеей ребёнка и развивай её. Страшилка всегда уходит смеясь.',
    }
  },
}

const braveGame: Game = {
  id: 'brave',
  title: 'Страшилка наоборот',
  emoji: '🙈',
  section: 'scary',
  howTo: 'Пугает ребёнок, а взрослый смешно боится. Бояться нужно очень старательно.',
  scoring: false,
  next: (): CardRound => ({
    mode: 'card',
    visual: { kind: 'none' },
    prompt: nextFrom('braveTasks', braveTasks),
    hints: ['Испугайся как следует: ойкни, спрячься за подушку, задрожи', 'А потом обязательно посмейтесь вместе'],
  }),
}

const nightSoundGame: Game = {
  id: 'nightsound',
  title: 'Что за шум?',
  emoji: '👂',
  section: 'scary',
  howTo: 'Произносим звук и вместе придумываем нестрашные объяснения.',
  scoring: false,
  next: (): CardRound => {
    const sound = nextFrom('scarySounds', scarySounds)
    return {
      mode: 'card',
      visual: { kind: 'none' },
      prompt: `Вечером слышно: ${sound.sound}. Что это может быть? Придумай три ответа!`,
      speech: `Вечером слышно: ${sound.sound}. Что это может быть?`,
      hints: sound.ideas,
      note: 'Все ответы — обычные домашние дела. Смысл игры в том, что непонятный звук всегда чем-то объясняется.',
    }
  },
}

export const games: Game[] = [
  carsGame,
  heroesGame,
  countGame,
  memoryGame,
  changedGame,
  patternGame,
  letterGame,
  riddleGame,
  rebusGame,
  oddGame,
  pairGame,
  orderGame,
  truthGame,
  whoAmIGame,
  pantomimeGame,
  explainGame,
  storyGame,
  speedGame,
  darkStoryGame,
  banishGame,
  braveGame,
  nightSoundGame,
]

export function availableGames(): Game[] {
  return games.filter((game) => game.isAvailable?.() ?? true)
}

export function gameById(id: string): Game | undefined {
  return games.find((game) => game.id === id)
}

export function nextRound(game: Game, settings: Settings): Round {
  return game.next(settings)
}
