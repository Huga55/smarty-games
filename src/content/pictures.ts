export interface Picture {
  id: string
  /** Подпись-ответ для взрослого: берётся из имени файла. */
  label: string
  src: string
}

/**
 * Картинки подхватываются из папок автоматически: имя файла становится ответом.
 * Положил «БМВ.png» в src/assets/cars — и марка появилась в игре, править код не нужно.
 */
function collect(modules: Record<string, string>): Picture[] {
  return Object.entries(modules)
    .map(([path, src]) => {
      const file = path.split('/').pop() ?? path
      const label = file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
      return { id: path, label, src }
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
}

const carModules = import.meta.glob('../assets/cars/*.{png,jpg,jpeg,webp,svg,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const heroModules = import.meta.glob('../assets/heroes/*.{png,jpg,jpeg,webp,svg,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export const cars = collect(carModules)
export const heroes = collect(heroModules)
