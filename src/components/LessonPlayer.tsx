function youtubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/watch\?v=([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function LessonPlayer({ url, title }: { url: string; title: string }) {
  if (!url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl2 border border-dashed border-white/10 bg-ink-900/60 text-center text-sm text-slate-500">
        <div>
          <p>Видео для этого урока ещё не загружено.</p>
          <p className="mt-1 text-xs">Ссылка добавляется в админке.</p>
        </div>
      </div>
    );
  }

  const yt = youtubeId(url);
  if (yt) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl2 border border-white/5 bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${yt}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return (
      <video
        className="aspect-video w-full rounded-xl2 border border-white/5 bg-black"
        controls
        preload="metadata"
        src={url}
      />
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl2 border border-white/5 bg-black">
      <iframe className="h-full w-full" src={url} title={title} allowFullScreen />
    </div>
  );
}
