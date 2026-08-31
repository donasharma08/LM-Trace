export default function CompanyNote({ note }) {
  if (!note) return null;
  return (
    <div className="panel border-l-[3px] border-l-flag p-4 bg-flag/5">
      <span className="eyebrow text-flag">Repeat non-compliance on record</span>
      <p className="text-sm text-ink mt-1">{note}</p>
    </div>
  );
}
