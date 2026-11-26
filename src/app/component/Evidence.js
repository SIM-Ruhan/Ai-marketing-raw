export default function Evidence({ urls }) {
  if (!urls?.length) return <span className="text-xs text-slate-400">No source page cited</span>;
  return (
    <span className="text-xs text-slate-500">
      Source:{' '}
      {urls.map((u, i) => (
        <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
          page {i + 1}{i < urls.length - 1 ? ', ' : ''}
        </a>
      ))}
    </span>
  );
}
