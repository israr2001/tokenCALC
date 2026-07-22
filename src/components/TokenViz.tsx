import { useDeferredValue } from 'react'
import type { TokenizerFamily } from '../data'
import { tokenizePieces } from '../lib/tokenize'

interface TokenVizProps {
  text: string
  family: TokenizerFamily
}

function displayPiece(text: string): string {
  return text
    .replace(/ /g, '·')
    .replace(/\n/g, '↵')
    .replace(/\t/g, '→')
}

export function TokenViz({ text, family }: TokenVizProps) {
  const deferredText = useDeferredValue(text)
  const result = tokenizePieces(deferredText, family)

  return (
    <section className="token-viz" aria-labelledby="token-viz-heading">
      <div className="token-viz-head">
        <h3 id="token-viz-heading">Token pieces</h3>
        <span
          className={`accuracy-badge accuracy-${result.accuracy}`}
          title={result.method}
        >
          {result.accuracyLabel}
        </span>
      </div>

      {result.pieces.length === 0 ? (
        <p className="token-viz-empty">
          {result.accuracy === 'approx'
            ? 'Piece visualization is Exact-only (o200k OpenAI encodings). Switch to an OpenAI model to inspect tokens.'
            : 'Paste text to visualize token pieces.'}
        </p>
      ) : (
        <>
          <div className="token-pieces" role="list">
            {result.pieces.map((piece) => (
              <span
                key={`${piece.index}-${piece.tokenId}`}
                className={`token-piece hue-${piece.index % 6}`}
                role="listitem"
                title={`#${piece.index} · id ${piece.tokenId}`}
              >
                {displayPiece(piece.text)}
              </span>
            ))}
          </div>
          {result.truncated && (
            <p className="token-viz-note">
              Showing first {result.pieces.length} tokens for performance.
            </p>
          )}
        </>
      )}
    </section>
  )
}
