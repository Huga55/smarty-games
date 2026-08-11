import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChainRound, Game, Round } from '../game/types'
import { speak, speechAvailable } from '../lib/speech'
import type { Settings } from '../lib/storage'
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

export default function GameScreen({ game, settings }: { game: Game; settings: Settings }) {
  const [round, setRound] = useState<Round>(() => game.next(settings))
  const [phase, setPhase] = useState<Phase>(() => initialPhase(round))
  const [visualShown, setVisualShown] = useState(() => !round.adultOnly)
  const [answerShown, setAnswerShown] = useState(false)
  const [hintsShown, setHintsShown] = useState(() => !round.answer)
  const [right, setRight] = useState(0)
  const [total, setTotal] = useState(0)
  const [finished, setFinished] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => initialSeconds(round))
  /** Сколько шагов истории уже открыто; на один больше числа шагов — открыта развязка. */
  const [openSteps, setOpenSteps] = useState(1)

  const startRound = useCallback((nextRound: Round) => {
    setRound(nextRound)
    setPhase(initialPhase(nextRound))
    setVisualShown(!nextRound.adultOnly)
    setAnswerShown(false)
    setHintsShown(!nextRound.answer)
    setSecondsLeft(initialSeconds(nextRound))
    setOpenSteps(1)
  }, [])

  const nextTask = useCallback(() => {
    startRound(game.next(settings))
  }, [game, settings, startRound])

  const score = useCallback(
    (correct: boolean) => {
      if (correct) buzz(30)
      const nextTotal = total + 1
      setTotal(nextTotal)
      if (correct) setRight((value) => value + 1)
      if (settings.seriesLength > 0 && nextTotal >= settings.seriesLength) {
        setFinished(true)
        return
      }
      nextTask()
    },
    [nextTask, settings.seriesLength, total],
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
    if (!settings.speak || round.adultOnly) return
    const worthSaying =
      (round.mode === 'card' && phase === 'play') ||
      (round.mode === 'changed' && phase === 'after') ||
      (round.mode === 'timer' && phase === 'idle') ||
      round.mode === 'chain'
    if (worthSaying) speak(speechText)
  }, [phase, round.adultOnly, round.mode, settings.speak, speechText])

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

  return (
    <div className="screen game">
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
        {round.adultOnly && !visualShown && (
          <button className="curtain" onClick={() => setVisualShown(true)}>
            <span className="curtain-emoji">🙈</span>
            <span>Ребёнку не показываем</span>
            <span className="curtain-hint">Нажми, чтобы увидеть задание</span>
          </button>
        )}

        {(!round.adultOnly || visualShown) && (
          <>
            {round.mode === 'card' && <Visual visual={round.visual} />}

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

            {round.subject && visualShown && round.adultOnly && <div className="subject">{round.subject}</div>}
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
              <button className="big-button good" onClick={() => score(true)}>
                Справился
              </button>
              <button className="big-button" onClick={() => score(false)}>
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
                  <button className="big-button good" onClick={() => score(true)}>
                    Угадал
                  </button>
                  <button className="big-button" onClick={() => score(false)}>
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
            {openSteps <= round.steps.length ? (
              <button className="big-button primary" onClick={() => setOpenSteps(openSteps + 1)}>
                {openSteps === round.steps.length ? 'А кто там?!' : 'Дальше...'}
              </button>
            ) : (
              <button className="big-button primary" onClick={nextTask}>
                Новая история
              </button>
            )}
          </>
        )}

        {round.mode === 'card' && (!round.adultOnly || visualShown) && (
          <>
            <p className="prompt">{round.prompt}</p>
            {round.subject && !round.adultOnly && <p className="subject">{round.subject}</p>}

            {round.answer && !answerShown && (
              <button className="big-button primary" onClick={() => setAnswerShown(true)}>
                Показать ответ
              </button>
            )}

            {round.answer && answerShown && (
              <p className="answer">
                {round.answerEmoji && <span className="answer-emoji">{round.answerEmoji}</span>}
                {round.answer}
              </p>
            )}

            {(!round.answer || answerShown) &&
              (game.scoring ? (
                <div className="row">
                  <button className="big-button good" onClick={() => score(true)}>
                    Угадал
                  </button>
                  <button className="big-button" onClick={() => score(false)}>
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
