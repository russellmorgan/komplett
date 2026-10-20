import { REACTION_EMOJI, type Reaction } from "./domain/shared";

// Reactions on a completed shared task. Yours are buttons that take the reaction back; the
// picker adds another each tap.
export function Reactions({
  reactions,
  myUid,
  onRemove,
}: {
  reactions: Reaction[];
  myUid?: string;
  onRemove?: (at: number) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <span className="reactions" title="Reactions">
      {reactions.map((r) =>
        onRemove && r.byUserId === myUid ? (
          <button
            key={`${r.byUserId}-${r.at}`}
            type="button"
            className="reaction-mine"
            aria-label={`Remove ${r.emoji}`}
            onClick={() => onRemove(r.at)}
          >
            {r.emoji}
          </button>
        ) : (
          <span key={`${r.byUserId}-${r.at}`}>{r.emoji}</span>
        ),
      )}
    </span>
  );
}

export function ReactionPicker({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <fieldset className="reaction-picker">
      <legend className="muted">React</legend>
      {REACTION_EMOJI.map((emoji) => (
        <button key={emoji} type="button" onClick={() => onReact(emoji)}>
          {emoji}
        </button>
      ))}
    </fieldset>
  );
}
