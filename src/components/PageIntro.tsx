import type { ReactNode } from 'react';

interface PageIntroProps {
  title: string;
  intro?: string;
  meta?: ReactNode;
}

export default function PageIntro({ title, intro, meta }: PageIntroProps) {
  return (
    <header className="mb-8 border-b border-white/10 pb-6">
      <div className="mb-2 h-1 w-12 rounded-full bg-tunisian-red" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        {meta && <div className="text-sm text-white/50">{meta}</div>}
      </div>
      {intro && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">{intro}</p>}
    </header>
  );
}
