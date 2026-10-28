import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import parse from 'html-react-parser';
import '../../styles.css';
import { getPage } from './pages.js';

function Page() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Handle browser back and forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Smooth internal SPA navigation for all local links
  useEffect(() => {
    const handleLinkClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('//') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        anchor.target === '_blank'
      ) {
        return;
      }

      // Check if href has an in-page hash like "service-details.html#managed-it"
      const [pathPart, hashPart] = href.split('#');
      e.preventDefault();

      const normalizedPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
      const finalUrl = hashPart ? `${normalizedPath}#${hashPart}` : normalizedPath;

      window.history.pushState({}, '', finalUrl);
      setCurrentPath(normalizedPath);

      if (hashPart) {
        setTimeout(() => {
          const targetEl = document.getElementById(hashPart);
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo(0, 0);
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  const source = getPage(currentPath);
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1];

  // Dynamically load page script
  useEffect(() => {
    if (title) document.title = title;

    // Clean up previous script
    const oldScript = document.querySelector('script[data-nexora-app]');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.src = `/app.js?t=${Date.now()}`;
    script.setAttribute('data-nexora-app', 'true');
    script.async = false;
    document.body.append(script);

    return () => {
      script.remove();
    };
  }, [currentPath, title]);

  if (!body) {
    throw new Error(`Could not load page content for ${currentPath}.`);
  }

  return parse(body);
}

createRoot(document.getElementById('root')).render(
  <Page />
);
