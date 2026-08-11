import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

/**
 * Качает логотипы марок из открытого датасета и раскладывает их в
 * src/assets/cars под русскими названиями — именно они показываются взрослому
 * как ответ. Нужен интернет, но только один раз: дальше картинки лежат в репозитории.
 *
 * Хочешь добавить марку — допиши строку в список ниже. Слаг можно подсмотреть
 * в data.json датасета: https://github.com/filippofilip95/car-logos-dataset
 */
const brands = {
  Лада: 'lada',
  УАЗ: 'uaz',
  ГАЗ: 'gaz',
  КАМАЗ: 'kamaz',
  Тойота: 'toyota',
  Киа: 'kia',
  Хёндай: 'hyundai',
  Фольксваген: 'volkswagen',
  Шкода: 'skoda',
  Рено: 'renault',
  Ниссан: 'nissan',
  Мазда: 'mazda',
  Мицубиси: 'mitsubishi',
  Форд: 'ford',
  Опель: 'opel',
  Шевроле: 'chevrolet',
  БМВ: 'bmw',
  Мерседес: 'mercedes-benz',
  Ауди: 'audi',
  Порше: 'porsche',
  Вольво: 'volvo',
  Пежо: 'peugeot',
  Ситроен: 'citroen',
  Хонда: 'honda',
  Субару: 'subaru',
  Сузуки: 'suzuki',
  Лексус: 'lexus',
  Джип: 'jeep',
  'Ленд Ровер': 'land-rover',
  Мини: 'mini',
  Ягуар: 'jaguar',
  Феррари: 'ferrari',
  Ламборгини: 'lamborghini',
  Тесла: 'tesla',
  Бугатти: 'bugatti',
  Хавал: 'haval',
  Чери: 'chery',
  Джили: 'geely',
  Эксид: 'exeed',
  Омода: 'omoda',
  МАН: 'man',
  Скания: 'scania',
  Ивеко: 'iveco',
}

const DATA_URL = 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/data.json'
const outDir = path.join('src', 'assets', 'cars')
const cacheFile = path.join('node_modules', '.cache', 'car-logos.json')

async function loadIndex() {
  if (existsSync(cacheFile)) return JSON.parse(await readFile(cacheFile, 'utf8'))
  const response = await fetch(DATA_URL)
  if (!response.ok) throw new Error(`Не удалось скачать список марок: ${response.status}`)
  const data = await response.json()
  await mkdir(path.dirname(cacheFile), { recursive: true })
  await writeFile(cacheFile, JSON.stringify(data), 'utf8')
  return data
}

const index = await loadIndex()
const bySlug = new Map(index.map((entry) => [entry.slug, entry]))
await mkdir(outDir, { recursive: true })

let saved = 0
const missing = []

for (const [name, slug] of Object.entries(brands)) {
  const target = path.join(outDir, `${name}.webp`)
  if (existsSync(target)) continue

  const entry = bySlug.get(slug)
  if (!entry) {
    missing.push(`${name} (нет слага «${slug}»)`)
    continue
  }

  const response = await fetch(entry.image.optimized)
  if (!response.ok) {
    missing.push(`${name} (ошибка загрузки ${response.status})`)
    continue
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await sharp(buffer)
    // Убираем поля вокруг логотипа, иначе на экране он получается мелким.
    .trim({ threshold: 12 })
    .resize(400, 400, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .webp({ quality: 88 })
    .toFile(target)
  saved++
  console.log('сохранено:', name)
}

console.log(`\nновых логотипов: ${saved}, всего марок в списке: ${Object.keys(brands).length}`)
if (missing.length > 0) console.log('не получилось:', missing.join('; '))
