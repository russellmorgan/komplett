import type { AuthUser } from "../data/auth";
import { react, useAllUsers, useSharedTask } from "../data/shared";
import { setPartner, useUserDoc } from "../data/user";
import { REACTION_EMOJI, type SharedTask } from "../domain/shared";

export function Partner({ user }: { user: AuthUser }) {
  const me = useUserDoc(user.uid);
  const people = useAllUsers().filter((p) => p.uid !== user.uid);
  const partnerId = me?.partnerId ?? null;
  const partner = useUserDoc(partnerId);
  const mutual = partner?.partnerId === user.uid;
  const mine = useSharedTask(user.uid);
  const theirs = useSharedTask(mutual ? partnerId : null);

  return (
    <>
      <h1>Partner</h1>
      <label>
        Your partner{" "}
        <select
          value={partnerId ?? ""}
          onChange={(e) => setPartner(user.uid, e.target.value || null)}
          aria-label="Choose partner"
        >
          <option value="">No partner</option>
          {people.map((p) => (
            <option key={p.uid} value={p.uid}>
              {p.displayName} ({p.email})
            </option>
          ))}
        </select>
      </label>
      {people.length === 0 && <p className="muted">Nobody else has signed in yet.</p>}
      <ul className="people">
        {people.map((p) => (
          <li key={p.uid} className={p.uid === partnerId ? "picked" : undefined}>
            <Avatar person={p} />
            <span>
              {p.displayName}
              <br />
              <span className="muted">{p.email}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="shared-pair">
        <SharedCard
          heading="Your shared task"
          shared={mine}
          empty="Pick a task and choose “Set as accountability task” in its details."
        />
        {partnerId === null ? (
          <p className="muted">No partner set — choose someone above to see their task.</p>
        ) : partner === undefined ? null : !mutual ? (
          <p className="muted">
            {partner.displayName} hasn’t picked you back yet, so their task isn’t visible.
          </p>
        ) : (
          <SharedCard
            heading={`${partner.displayName}’s shared task`}
            shared={theirs}
            empty="They haven’t set an accountability task yet."
            onReact={(emoji) => partnerId && theirs && react(partnerId, theirs, user.uid, emoji)}
            myUid={user.uid}
          />
        )}
      </div>
    </>
  );
}

function SharedCard({
  heading,
  shared,
  empty,
  onReact,
  myUid,
}: {
  heading: string;
  shared: SharedTask | null | undefined;
  empty: string;
  onReact?: (emoji: string) => void;
  myUid?: string;
}) {
  const mine = shared?.reactions.find((r) => r.byUserId === myUid)?.emoji;
  return (
    <section className="shared-card">
      <h2>{heading}</h2>
      {shared === undefined ? null : shared === null ? (
        <p className="muted">{empty}</p>
      ) : (
        <div>
          <span className="task-title">{shared.title}</span>
          <br />
          <span className="muted">
            {shared.completedAt !== null
              ? "Done ✓"
              : shared.dueDate
                ? `Due ${shared.dueDate}`
                : "In progress"}
          </span>
          {shared.reactions.length > 0 && (
            <span className="reactions" title="Reactions">
              {shared.reactions.map((r) => (
                <span key={r.byUserId}>{r.emoji}</span>
              ))}
            </span>
          )}
          {onReact && shared.completedAt !== null && (
            <fieldset className="reaction-picker">
              <legend className="muted">React</legend>
              {REACTION_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={emoji === mine}
                  onClick={() => onReact(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </fieldset>
          )}
        </div>
      )}
    </section>
  );
}

function Avatar({ person }: { person: { displayName: string; photoURL: string | null } }) {
  return person.photoURL ? (
    <img className="avatar" src={person.photoURL} alt="" />
  ) : (
    <span className="avatar">{person.displayName.slice(0, 1).toUpperCase()}</span>
  );
}
