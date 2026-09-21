import React from 'react';
import type { ContentBlock } from '@/data/smartTestV2/content';
import { cn } from '@/lib/utils';
import { Quote, Play, Images, BadgeCheck } from 'lucide-react';

const isAparat = (u: string) => /aparat\.com/.test(u);
const isArvanConfig = (u: string) => /arvanvod\.ir\/.+origin_config\.json/.test(u);

export const MediaView: React.FC<{ media: NonNullable<ContentBlock['media']> }> = ({ media }) => (
  <div className="space-y-5 sm:space-y-7">
    {media.filter((m) => (m.kind === 'text' ? !!m.caption : (m.url || (m.urls && m.urls.length)))).map((m, i) => (
      <figure key={i} className={cn('relative', m.kind === 'text' && 'border-r-4 border-primary pr-5 py-2')}>
        {m.kind === 'video' && m.url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-foreground shadow-2xl">
            <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 bg-background/90 text-foreground px-3 py-2 text-xs font-bold"><Play className="w-3.5 h-3.5" /> ویدیوی رضا رفیعی</span>
            {isArvanConfig(m.url) ? (
              <iframe src={`https://player.arvancloud.ir/index.html?config=${encodeURIComponent(m.url)}`} allowFullScreen allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" className="w-full h-full border-0" title="ویدیوی آموزشی" />
            ) : isAparat(m.url) ? (
              <iframe src={m.url} allowFullScreen className="w-full h-full" title="video" />
            ) : (
              <video src={m.url} controls playsInline className="w-full h-full object-contain" />
            )}
          </div>
        )}
        {m.kind === 'image' && m.url && (
          <img src={m.url} alt={m.caption || ''} loading="lazy" className="w-full max-h-[560px] object-cover rounded-lg" />
        )}
        {m.kind === 'gallery' && m.urls && (
          <div className="relative grid grid-cols-2 gap-2 sm:gap-4">
            <span className="absolute top-3 right-3 z-10 bg-background/90 text-foreground p-2 rounded-md"><Images className="w-4 h-4" /></span>
            {m.urls.map((u, j) => (
              <img key={j} src={u} alt="" loading="lazy" className={cn('w-full object-cover rounded-lg', j === 0 ? 'col-span-2 aspect-[16/8]' : 'aspect-square')} />
            ))}
          </div>
        )}
        {m.kind === 'text' && m.caption && (
          <div className="flex gap-3">
            <Quote className="w-6 h-6 text-primary shrink-0" />
            <blockquote className="text-base sm:text-lg font-bold leading-loose">{m.caption}</blockquote>
          </div>
        )}
        {m.kind !== 'text' && m.caption && (
          <figcaption className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"><BadgeCheck className="w-4 h-4 text-primary" />{m.caption}</figcaption>
        )}
      </figure>
    ))}
  </div>
);

interface Props {
  block: ContentBlock;
  extraBody?: string[];
  children?: React.ReactNode;
  className?: string;
}

const BlockCard: React.FC<Props> = ({ block, extraBody, children, className }) => (
  <section dir="rtl" className={cn('space-y-5 sm:space-y-7', className)}>
    <h2 className="text-2xl sm:text-4xl font-black leading-[1.55]">{block.title}</h2>
    {[...(block.body || []), ...(extraBody || [])].map((p, i) => (
      <p key={i} className={cn('text-sm sm:text-lg leading-loose max-w-3xl', i === 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>{p}</p>
    ))}
    {block.media && block.media.length > 0 && <MediaView media={block.media} />}
    {children}
  </section>
);

export default BlockCard;
