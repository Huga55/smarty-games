/**
 * Системная кнопка и жест «назад» на Android. По традиции: из игры возвращаемся
 * в меню, а из меню выходим только если нажать дважды — иначе приложение
 * закрывается случайным свайпом посреди игры.
 */
export function listenBack(onBack: () => void): () => void {
  let stop = () => {}
  let cancelled = false

  import('@capacitor/app')
    .then(({ App }) => App.addListener('backButton', onBack))
    .then((handle) => {
      if (cancelled) void handle.remove()
      else stop = () => void handle.remove()
    })
    .catch(() => {
      // В браузере плагина нет — там за «назад» отвечает сам браузер.
    })

  return () => {
    cancelled = true
    stop()
  }
}

export async function exitApp(): Promise<void> {
  try {
    const { App } = await import('@capacitor/app')
    await App.exitApp()
  } catch {
    // В браузере закрыть страницу нельзя, и это нормально.
  }
}
