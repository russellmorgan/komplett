import { Avatar } from "../Avatar";
import type { AuthUser } from "../data/auth";
import { requestNotificationPermission } from "../data/reminders";
import { setReaction, useAllUsers, useSharedTask } from "../data/shared";
import { setPartner, useUserDoc } from "../data/user";
import { REACTION_EMOJI, type SharedTask } from "../domain/shared";
import { Icon } from "../icons";

export function Partner({ user }: { user: AuthUser }) {
  const me = useUserDoc(user.uid);
  const people = useAllUsers().filter((p) => p.uid !== user.uid);
  const partnerId = me?.partnerId ?? null;
  const partner = useUserDoc(partnerId);
  const mutual = partner?.partnerId === user.uid;
  const mine = useSharedTask(user.uid);
  const theirs = useSharedTask(mutual ? partnerId : null);

  const choices = [
    { uid: "", displayName: "No partner", email: "Work solo for now", photoURL: null },
    ...people,
  ];
  return (
    <div className="stack">
      <h1>Partner</h1>
      <div className="card-grid">
        <section className="card">
          <h2>Your partner</h2>
          <div className="rows">
            {choices.map((p) => {
              const on = (partnerId ?? "") === p.uid;
              return (
                <button
                  key={p.uid}
                  type="button"
                  aria-pressed={on}
                  className="person"
                  onClick={() => {
                    if (p.uid) requestNotificationPermission(); // for the "partner is done" alert
                    setPartner(user.uid, p.uid || null);
                  }}
                >
                  <Avatar person={p} />
                  <span className="row-title">
                    <strong>{p.displayName}</strong>
                    <span className="muted">{p.email}</span>
                  </span>
                  <span className="radio" />
                </button>
              );
            })}
          </div>
          {people.length === 0 && <p className="muted">Nobody else has signed in yet.</p>}
        </section>
        <div className="stack">
          <SharedCard
            heading="Your shared task"
            shared={mine}
            empty="Pick a task and choose “Set as accountability task” in its details."
          />
          {partnerId === null ? (
            <section className="card">
              <p className="muted">No partner set — choose someone to see their task.</p>
            </section>
          ) : partner === undefined ? null : !mutual ? (
            <section className="card">
              <p className="muted">
                {partner.displayName} hasn’t picked you back yet, so their task isn’t visible.
              </p>
            </section>
          ) : (
            <SharedCard
              heading={`${partner.displayName}’s shared task`}
              shared={theirs}
              empty="They haven’t set an accountability task yet."
              onReact={(shared, emoji) =>
                setReaction(partnerId, shared, user.uid, emoji).catch(console.error)
              }
              myUid={user.uid}
            />
          )}
        </div>
      </div>
    </div>
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
  onReact?: (shared: SharedTask, emoji: string) => void;
  myUid?: string;
}) {
  const mine = shared?.reactions.find((r) => r.byUserId === myUid)?.emoji;
  return (
    <section className="card shared-card">
      <span className="muted">{heading}</span>
      {shared === undefined ? null : shared === null ? (
        <p className="muted">{empty}</p>
      ) : (
        <>
          <span className={shared.completedAt !== null ? "shared-title struck" : "shared-title"}>
            {shared.title}
          </span>
          <span className={shared.completedAt !== null ? "shared-status done" : "shared-status"}>
            {shared.completedAt !== null ? (
              <>
                <Icon name="check" size={12} /> Done
              </>
            ) : shared.dueDate ? (
              `Due ${shared.dueDate}`
            ) : (
              "In progress"
            )}
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
                  onClick={() => onReact(shared, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </fieldset>
          )}
        </>
      )}
    </section>
  );
}
