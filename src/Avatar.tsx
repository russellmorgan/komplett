type Props = { person: { displayName: string; photoURL: string | null }; className?: string };

// Google's photo CDN rejects some requests that carry a referrer, hence no-referrer.
export function Avatar({ person, className = "avatar" }: Props) {
  return person.photoURL ? (
    <img className={className} src={person.photoURL} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className={className}>{person.displayName.slice(0, 1).toUpperCase() || "–"}</span>
  );
}
