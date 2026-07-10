'use client';

import { useServerInsertedHTML } from 'next/navigation';

export default function ThemeInitializer() {
  useServerInsertedHTML(() => {
    return (
      <script
        id="theme-initializer-script"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem('msme360_theme') === 'dark' || (!('msme360_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (_) {}
          `,
        }}
      />
    );
  });
  return null;
}
