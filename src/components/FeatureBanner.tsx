import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface FeatureBannerProps {
  eyebrow: string;
  title: string;
  description: string;
  tags?: string[];
  cta: string;
  to: string;
  primary?: boolean;
}

const FeatureBanner: React.FC<FeatureBannerProps> = ({ eyebrow, title, description, tags = [], cta, to, primary }) => (
  <section className="container py-3">
    <Link
      to={to}
      className="group flex flex-col gap-6 rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-500 ease-smooth hover:-translate-y-0.5 hover:shadow-float md:flex-row md:items-center md:justify-between md:p-9"
    >
      <div className="max-w-2xl">
        <span className="text-xs font-medium text-muted-foreground">{eyebrow}</span>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>
      <span
        className={`inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full px-6 text-sm font-semibold transition-all duration-500 ease-smooth md:self-center ${
          primary ? "bg-primary text-primary-foreground" : "border border-border text-foreground group-hover:bg-muted"
        }`}
      >
        {cta}
        <ArrowLeft size={16} className="transition-transform duration-500 ease-smooth group-hover:-translate-x-1" />
      </span>
    </Link>
  </section>
);

export default FeatureBanner;
