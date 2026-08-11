import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChainRound, Game, Round } from '../game/types'
import { speak, speechAvailable } from '../lib/speech'
import type { Settings } from '../lib/storage'
import Confetti from './Confetti'
import Visual from './Visual'

type Phase = 'play' | 'show' | 'ask' | 'check' | 'before' | 'after' | 'idle' | 'run' | 'over' | 'chain'

function initialPhase(round: Round): Phase {
  if (round.mode === 'memory') return 'show'
  if (round.mode === 'changed') return 'before'
  if (round.mode === 'timer') return 'idle'
  if (round.mode === 'chain') return 'chain'
  return 'play'
}

function initialSeconds(round: Round): number {
  if (round.mode === 'memory' || round.mode === 'changed') return round.showSeconds
  if (round.mode === 'timer') return round.seconds
  return 0
}

/** Строка истории для очередного шага; последняя — развязка. */
function chainLine(round: ChainRound, index: number): string {
  const step = round.steps[index]
  if (!step) return `А внутри... ${round.ending.text}`
  return index === 0 ? `Далеко-далеко был ${step.text}` : `А там — ${step.text}`
}

function buzz(ms: number): void {
  navigator.vibrate?.(ms)
}

function praise(right: number, total: number): string {
  if (total === 0) return 'Поиграли!'
  const ratio = right / total
  if (ratio === 1) return 'Всё-всё угадал! Ты молодец!'
  if (ratio >= 0.7) return 'Здорово получилось!'
  if (ratio >= 0.4) return 'Хорошо! В следующий раз будет ещё лучше'
  return 'Поиграли — уже хорошо. Попробуем ещё?'
}

interface Props {
  game: Game
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

export default function GameScreen({ game, settings, onSettingsChange }: Props) {
  const [started, setStarted] = useState(() => !game.setup)
  const [round, setRound] = useState<Round>(() => game.next(settings))
  const [phase, setPhase] = useState<Phase>(() => initialPhase(round))
  const [visualShown, setVisualShown] = useState(() => !round.adultOnly)
  const [silhouette, setSilhouette] = useState(false)
  const [answerShown, setAnswerShown] = useState(false)
  const [hintsShown, setHintsShown] = useState(() => !round.answer)
  const [choice, setChoice] = useState<boolean | null>(null)
  const [right, setRight] = useState(0)
  const [total, setTotal] = useState(0)
  const [finished, setFinished] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => initialSeconds(round))
  /** Сколько шагов истории уже открыто; на один больше числа шагов — открыта развязка. */
  const [openSteps, setOpenSteps] = useState(1)

  const startRound = useCallback((nextRound: Round) => {
    setRound(nextRound)
    setPhase(initialPhase(nextRound))
    setVisualShown(!nextRound.adultOnly)
    setSilhouette(false)
    setAnswerShown(false)
    setHintsShown(!nextRound.answer)
    setChoice(null)
    setSecondsLeft(initialSeconds(nextRound))
    setOpenSteps(1)
  }, [])

  const nextTask = useCallback(() => {
    startRound(game.next(settings))
  }, [game, settings, startRound])

  const finishRound = useCallback(
    (correct: boolean, celebrate = correct) => {
      const nextTotal = total + 1
      setTotal(nextTotal)
      if (correct) setRight((value) => value + 1)

      const proceed = () => {
        setConfetti(false)
        if (settings.seriesLength > 0 && nextTotal >= settings.seriesLength) setFinished(true)
        else startRound(game.next(settings))
      }

      if (celebrate) {
        buzz(30)
        setConfetti(true)
        window.setTimeout(proceed, 850)
      } else {
        proceed()
      }
    },
    [game, settings, startRound, total],
  )

  const chooseTruth = useCallback(
    (value: boolean) => {
      setChoice(value)
      if (round.mode === 'truth' && value === round.truth) {
        buzz(30)
        setConfetti(true)
        window.setTimeout(() => setConfetti(false), 900)
      }
    },
    [round],
  )

  // Показ картинок в играх на память и обратный отсчёт в «Кто быстрее».
  useEffect(() => {
    const counting = (phase === 'show' || phase === 'before' || phase === 'run') && secondsLeft > 0
    if (!counting) return
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [phase, secondsLeft])

  useEffect(() => {
    if (secondsLeft > 0) return
    if (phase === 'show') setPhase('ask')
    if (phase === 'before') setPhase('after')
    if (phase === 'run') {
      buzz(400)
      setPhase('over')
    }
  }, [phase, secondsLeft])

  const speechText = useMemo(() => {
    if (round.mode === 'chain') return chainLine(round, openSteps - 1)
    return round.speech ?? round.prompt
  }, [openSteps, round])

  useEffect(() => {
    if (!settings.speak || round.adultOnly || !started) return
    const worthSaying =
      (round.mode === 'card' && phase === 'play') ||
      (round.mode === 'changed' && phase === 'after') ||
      (round.mode === 'timer' && phase === 'idle') ||
      round.mode === 'truth' ||
      round.mode === 'chain'
    if (worthSaying) speak(speechText)
  }, [phase, round.adultOnly, round.mode, settings.speak, speechText, started])

  if (!started) {
    const patch = (part: Partial<Settings>) => onSettingsChange({ ...settings, ...part })
    return (
      <div className="screen setup">
        <header className="game-header">
          <a className="icon-button" href="#/" aria-label="В меню">
            ⬅️
          </a>
          <div className="game-title">
            <strong>
              {game.emoji} {game.title}
            </strong>
            <span className="game-howto">{game.howTo}</span>
          </div>
        </header>

        {game.setup?.includes('memoryCount') && (
          <div className="setting">
            <div className="setting-label">Сколько картинок?</div>
            <div className="chips">
              {[3, 4, 5, 6, 7].map((value) => (
                <button
                  key={value}
                  className={`chip ${settings.memoryCount === value ? 'on' : ''}`}
                  onClick={() => patch({ memoryCount: value })}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        {game.setup?.includes('memorySeconds') && (
          <div className="setting">
            <div className="setting-label">Сколько секунд смотреть?</div>
            <div className="chips">
              {[3, 5, 7, 10, 15].map((value) => (
                <button
                  key={value}
                  className={`chip ${settings.memorySeconds === value ? 'on' : ''}`}
                  onClick={() => patch({ memorySeconds: value })}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="setting-hint">Выбор запомнится и в следующий раз будет предложен снова.</p>

        <button
          className="big-button primary"
          onClick={() => {
            setStarted(true)
            nextTask()
          }}
        >
          Начали!
        </button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="screen result">
        <div className="result-stars">{'⭐'.repeat(Math.max(right, 1))}</div>
        <div className="result-score">
          {right} из {total}
        </div>
        <p className="result-text">{praise(right, total)}</p>
        <button
          className="big-button primary"
          onClick={() => {
            setRight(0)
            setTotal(0)
            setFinished(false)
            nextTask()
          }}
        >
          Ещё раз
        </button>
        <a className="big-button" href="#/">
          В меню
        </a>
      </div>
    )
  }

  const showHintsBlock = (round.hints && round.hints.length > 0) || round.note
  const hasVisual = round.mode === 'card' && round.visual.kind !== 'none'
  /** Шторка нужна только там, где на экране есть что скрывать от ребёнка. */
  const hasSecret = hasVisual || Boolean(round.subject)
  const hidden = Boolean(round.adultOnly) && hasSecret && !visualShown && !silhouette

  return (
    <div className="screen game">
      {confetti && <Confetti />}

      <header className="game-header">
        <a className="icon-button" href="#/" aria-label="В меню">
          ⬅️
        </a>
        <div className="game-title">
          <strong>
            {game.emoji} {game.title}
          </strong>
          <span className="game-howto">{game.howTo}</span>
        </div>
        {game.scoring && settings.seriesLength > 0 && (
          <div className="counter">
            {total + 1}/{settings.seriesLength}
          </div>
        )}
      </header>

      <div className="stage">
        {hidden && (
          <div className="curtain-box">
            <button className="curtain" onClick={() => setVisualShown(true)}>
              <span className="curtain-emoji">🙈</span>
              <span>Ребёнку не показываем</span>
              <span className="curtain-hint">Нажми, чтобы посмотреть самому</span>
            </button>
            {hasVisual && (
              <button className="text-button" onClick={() => setSilhouette(true)}>
                Подсказать ребёнку: показать силуэт
              </button>
            )}
          </div>
        )}

        {!hidden && (
          <>
            {round.mode === 'card' && <Visual visual={round.visual} silhouette={silhouette && !visualShown} />}

            {round.mode === 'truth' && <div className="emoji-wall single">{round.emoji}</div>}

            {round.mode === 'memory' && (phase === 'show' || phase === 'check') && (
              <div className="emoji-wall some">
                {round.emojis.map((emoji, index) => (
                  <span key={index}>{emoji}</span>
                ))}
              </div>
            )}

            {round.mode === 'changed' && (
              <div className="emoji-wall some">
                {(phase === 'before' ? round.before : round.after).map((emoji, index) => (
                  <span key={index}>{emoji}</span>
                ))}
              </div>
            )}

            {round.mode === 'chain' && (
              <div className="chain">
                <div className="chain-trail">
                  {round.steps.slice(0, Math.min(openSteps, round.steps.length) - 1).map((step, index) => (
                    <span key={index}>{step.emoji}</span>
                  ))}
                </div>
                <div className="chain-current">
                  {openSteps > round.steps.length
                    ? round.ending.emoji
                    : round.steps[Math.min(openSteps, round.steps.length) - 1]?.emoji}
                </div>
              </div>
            )}

            {round.mode === 'timer' && phase === 'run' && <div className="big-letter">{secondsLeft}</div>}
            {round.mode === 'timer' && phase === 'over' && <div className="big-letter">⏰</div>}

            {round.subject && round.adultOnly && visualShown && <div className="subject">{round.subject}</div>}
          </>
        )}

        {(round.mode === 'memory' && phase === 'ask') || (round.mode === 'timer' && phase === 'idle') ? (
          <div className="quiet-stage">{round.mode === 'timer' ? '⏱️' : '🤔'}</div>
        ) : null}
      </div>

      <div className="prompt-block">
        {(phase === 'show' || phase === 'before') && (
          <>
            <p className="prompt">Запомни картинки!</p>
            <p className="countdown">{secondsLeft}</p>
            <button className="big-button primary" onClick={() => setSecondsLeft(0)}>
              Запомнил
            </button>
          </>
        )}

        {phase === 'ask' && (
          <>
            <p className="prompt">Что ты запомнил? Назови всё!</p>
            <button className="big-button primary" onClick={() => setPhase('check')}>
              Проверить
            </button>
          </>
        )}

        {phase === 'check' && round.mode === 'memory' && (
          <>
            <p className="prompt">Было: {round.labels.join(', ')}</p>
            <div className="row">
              <button className="big-button good" onClick={() => finishRound(true)}>
                Справился
              </button>
              <button className="big-button" onClick={() => finishRound(false)}>
                Не всё
              </button>
            </div>
          </>
        )}

        {phase === 'after' && round.mode === 'changed' && (
          <>
            <p className="prompt">Что изменилось?</p>
            {answerShown ? (
              <>
                <p className="answer">{round.answer}</p>
                <div className="row">
                  <button className="big-button good" onClick={() => finishRound(true)}>
                    Угадал
                  </button>
                  <button className="big-button" onClick={() => finishRound(false)}>
                    Мимо
                  </button>
                </div>
              </>
            ) : (
              <button className="big-button primary" onClick={() => setAnswerShown(true)}>
                Показать ответ
              </button>
            )}
          </>
        )}

        {round.mode === 'timer' && (
          <>
            <p className="prompt">{round.prompt}</p>
            {phase === 'idle' && (
              <button
                className="big-button primary"
                onClick={() => {
                  setSecondsLeft(round.seconds)
                  setPhase('run')
                }}
              >
                Начали!
              </button>
            )}
            {phase === 'over' && (
              <>
                <p className="answer">Время вышло!</p>
                <div className="row">
                  <button className="big-button primary" onClick={nextTask}>
                    Другая тема
                  </button>
                  <button
                    className="big-button"
                    onClick={() => {
                      setSecondsLeft(round.seconds)
                      setPhase('run')
                    }}
                  >
                    Ещё раз
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {round.mode === 'chain' && (
          <>
            <p className="prompt">{chainLine(round, openSteps - 1)}</p>
            {openSteps < round.steps.length && (
              <button className="big-button primary" onClick={() => setOpenSteps(openSteps + 1)}>
                Дальше...
              </button>
            )}
            {openSteps === round.steps.length && (
              <>
                <button className="big-button intrigue" onClick={() => setOpenSteps(openSteps + 1)}>
                  🥁 А кто там?!
                </button>
                <p className="setting-hint">
                  Дальше развязка. Сделай долгую паузу, спроси шёпотом: «Как ты думаешь, кто там?»
                </p>
              </>
            )}
            {openSteps > round.steps.length && (
              <button className="big-button primary" onClick={nextTask}>
                Новая история
              </button>
            )}
          </>
        )}

        {round.mode === 'truth' && (
          <>
            <p className="prompt">{round.prompt}</p>
            {choice === null ? (
              <div className="row">
                <button className="big-button good" onClick={() => chooseTruth(true)}>
                  👍 Правда
                </button>
                <button className="big-button no" onClick={() => chooseTruth(false)}>
                  👎 Неправда
                </button>
              </div>
            ) : (
              <>
                <p className="answer">{choice === round.truth ? 'Верно! 🎉' : 'А вот и нет!'}</p>
                <p className="why">{round.why}</p>
                <button className="big-button primary" onClick={() => finishRound(choice === round.truth, false)}>
                  Дальше
                </button>
              </>
            )}
          </>
        )}

        {round.mode === 'card' && (
          <>
            <p className="prompt">{round.prompt}</p>
            {round.subject && !round.adultOnly && <p className="subject">{round.subject}</p>}

            {round.answer && !answerShown && (
              <button className="big-button primary" onClick={() => setAnswerShown(true)}>
                Показать ответ
              </button>
            )}

            {round.answer && answerShown && (
              <div className="answer-block">
                {round.answerEmoji && <div className="answer-emoji">{round.answerEmoji}</div>}
                <p className="answer">{round.answer}</p>
              </div>
            )}

            {(!round.answer || answerShown) &&
              (game.scoring ? (
                <div className="row">
                  <button className="big-button good" onClick={() => finishRound(true)}>
                    Угадал
                  </button>
                  <button className="big-button" onClick={() => finishRound(false)}>
                    Мимо
                  </button>
                </div>
              ) : (
                <button className="big-button primary" onClick={nextTask}>
                  Дальше
                </button>
              ))}
          </>
        )}

        <div className="tools">
          <button className="text-button" onClick={nextTask}>
            Другое задание
          </button>
          {round.adultOnly && visualShown && hasSecret && (
            <button
              className="text-button"
              onClick={() => {
                setVisualShown(false)
                setSilhouette(false)
              }}
            >
              Спрятать картинку
            </button>
          )}
          {round.adultOnly && !silhouette && !hidden && hasVisual && (
            <button className="text-button" onClick={() => setSilhouette(true)}>
              Показать силуэт
            </button>
          )}
          {showHintsBlock && (
            <button className="text-button" onClick={() => setHintsShown((value) => !value)}>
              {hintsShown ? 'Скрыть подсказки' : 'Подсказки'}
            </button>
          )}
          {speechAvailable() && (
            <button className="text-button" onClick={() => speak(speechText)}>
              🔊 Прочитать
            </button>
          )}
        </div>

        {hintsShown && showHintsBlock && (
          <div className="hints">
            {round.hints?.map((hint, index) => (
              <div key={index} className="hint">
                {hint}
              </div>
            ))}
            {round.note && <div className="note">{round.note}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
