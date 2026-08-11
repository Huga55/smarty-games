export interface Rebus {
  left: string
  right: string
  answer: string
  answerEmoji: string
  /** Подсказка взрослому, если ребёнок застрял. */
  hint: string
}

/**
 * Ребусы для тех, кто не умеет читать: складываем две картинки и получаем третью.
 * Ответ всегда картинкой, поэтому читать не нужно ни ребёнку, ни взрослому.
 */
export const rebuses: Rebus[] = [
  { left: '🐄', right: '🥛', answer: 'молоко', answerEmoji: '🥛', hint: 'Что даёт корова?' },
  { left: '🐝', right: '🌸', answer: 'мёд', answerEmoji: '🍯', hint: 'Что делает пчела, когда облетит все цветы?' },
  { left: '🥛', right: '❄️', answer: 'мороженое', answerEmoji: '🍦', hint: 'Молоко заморозили — что получилось?' },
  { left: '☁️', right: '💧', answer: 'дождь', answerEmoji: '🌧️', hint: 'Что падает из тучи?' },
  { left: '☀️', right: '🌧️', answer: 'радуга', answerEmoji: '🌈', hint: 'Солнце и дождь вместе — что бывает в небе?' },
  { left: '❄️', right: '☀️', answer: 'лужа', answerEmoji: '💧', hint: 'Снег на солнце растаял. Что осталось?' },
  { left: '🥚', right: '🔥', answer: 'яичница', answerEmoji: '🍳', hint: 'Яйцо разбили на горячую сковородку' },
  { left: '🍞', right: '🧀', answer: 'бутерброд', answerEmoji: '🥪', hint: 'Хлеб плюс сыр — что можно съесть?' },
  { left: '🍅', right: '🥒', answer: 'салат', answerEmoji: '🥗', hint: 'Порезали овощи в тарелку' },
  { left: '🍎', right: '🥤', answer: 'сок', answerEmoji: '🧃', hint: 'Из яблок выжали. Что получилось?' },
  { left: '🌰', right: '💧', answer: 'дерево', answerEmoji: '🌳', hint: 'Семечко полили — что вырастет?' },
  { left: '🌱', right: '☀️', answer: 'цветок', answerEmoji: '🌻', hint: 'Росток на солнышке подрос' },
  { left: '🐛', right: '⏳', answer: 'бабочка', answerEmoji: '🦋', hint: 'Гусеница подождала — и превратилась' },
  { left: '🥚', right: '🐔', answer: 'цыплёнок', answerEmoji: '🐤', hint: 'Курица села на яйцо' },
  { left: '🐑', right: '🧶', answer: 'шарф', answerEmoji: '🧣', hint: 'Из шерсти овечки связали' },
  { left: '🌾', right: '🔥', answer: 'хлеб', answerEmoji: '🍞', hint: 'Из пшеницы сделали муку и испекли' },
  { left: '🍇', right: '☀️', answer: 'изюм', answerEmoji: '🍇', hint: 'Виноград полежал на солнце и высох' },
  { left: '🥔', right: '🔥', answer: 'картошка фри', answerEmoji: '🍟', hint: 'Картошку пожарили' },
  { left: '🎂', right: '🕯️', answer: 'день рождения', answerEmoji: '🎉', hint: 'Торт со свечками. Какой это праздник?' },
  { left: '🌲', right: '🎁', answer: 'Новый год', answerEmoji: '🎄', hint: 'Ёлка и подарки. Какой это праздник?' },
  { left: '🎈', right: '💨', answer: 'шарик полетел', answerEmoji: '🎈', hint: 'Шарик надули и отпустили' },
  { left: '💧', right: '❄️', answer: 'лёд', answerEmoji: '🧊', hint: 'Воду поставили в морозилку' },
  { left: '🐟', right: '🏠', answer: 'аквариум', answerEmoji: '🐠', hint: 'Домик для рыбки' },
  { left: '🐶', right: '🏠', answer: 'конура', answerEmoji: '🐕', hint: 'Домик для собаки' },
  { left: '🐝', right: '🏠', answer: 'улей', answerEmoji: '🍯', hint: 'Домик для пчёл' },
  { left: '🐦', right: '🏠', answer: 'гнездо', answerEmoji: '🐣', hint: 'Домик для птички' },
  { left: '✏️', right: '📄', answer: 'рисунок', answerEmoji: '🖼️', hint: 'Карандашом по бумаге' },
  { left: '🧼', right: '💧', answer: 'пена', answerEmoji: '🛁', hint: 'Мыло и вода вместе' },
  { left: '🔨', right: '🧱', answer: 'дом', answerEmoji: '🏠', hint: 'Молотком и кирпичами что строят?' },
  { left: '🌊', right: '🏖️', answer: 'море и пляж', answerEmoji: '⛱️', hint: 'Куда едут летом отдыхать?' },
  { left: '❄️', right: '🥕', answer: 'снеговик', answerEmoji: '⛄', hint: 'Из снега слепили, вместо носа морковка' },
  { left: '🚗', right: '💧', answer: 'мойка', answerEmoji: '🚿', hint: 'Машину помыли' },
]
