import React from 'react';
import type { ContentBlock } from '@/data/smartTestV2/content';
import { cn } from '@/lib/utils';

const isAparat = (u: string) => /aparat\.com/.test(u);

export const MediaView: React.FC<{ media: NonNullable<ContentBlock['media']> }> = ({ media }) => (
  <>
    {media.filter((m) => (m.kind === 'text' ? !!m.caption : (m.url || (m.urls && m.urls.length)))).map((m, i) => (
      <div key={i} className="my-4">
        {m.kind === 'video' && m.url && (
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
            {isAparat(m.url) ? (
              <iframe src={m.url} allowFullScreen className="w-full h-full" title="video" />
            ) : (
              <video src={m.url} controls playsInline className="w-full h-full object-contain" />
            )}
          </div>
        )}
        {m.kind === 'image' && m.url && (
          <img src={m.url} alt={m.caption || ''} loading="lazy" className="w-full rounded-xl border border-border" />
        )}
        {m.kind === 'gallery' && m.urls && (
          <div className="grid grid-cols-2 gap-2">
            {m.urls.map((u, j) => (
              <img key={j} src={u} alt="" loading="lazy" className="w-full rounded-xl border border-border" />
            ))}
          </div>
        )}
        {m.kind === 'text' && m.caption && (
          <p className="text-sm text-muted-foreground leading-relaxed">{m.caption}</p>
        )}
        {m.kind !== 'text' && m.caption && (
          <p className="mt-2 text-xs text-muted-foreground">{m.caption}</p>
        )}
      </div>
    ))}
  </>
);

interface Props {
  block: ContentBlock;
  extraBody?: string[];
  children?: React.ReactNode;
  className?: string;
}

const BlockCard: React.FC<Props> = ({ block, extraBody, children, className }) => (
  <div dir="rtl" className={cn('space-y-4', className)}>
    <h2 className="text-xl sm:text-2xl font-bold leading-relaxed">{block.title}</h2>
    {[...(block.body || []), ...(extraBody || [])].map((p, i) => (
      <p key={i} className="text-sm sm:text-base leading-loose text-muted-foreground">{p}</p>
    ))}
    {block.media && block.media.length > 0 && <MediaView media={block.media} />}
    {children}
  </div>
);

export default BlockCard;
