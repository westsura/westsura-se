/** Felruta med en lista över det som krockar. */
export default function Konflikter({ fel, konflikter }: { fel: string; konflikter: string[] }) {
  return (
    <div className="notice notice--fel field--full" role="alert">
      <strong>{fel}</strong>
      {!!konflikter.length && <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{konflikter.map((k) => <li key={k}>{k}</li>)}</ul>}
    </div>
  );
}
