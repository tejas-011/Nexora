import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import parse from 'html-react-parser';
import '../../styles.css';
import { getPage } from './pages.js';

function Page() {
  const [currentLocation, setCurrentLocation] = useState(() => (
    window.location.pathname + window.location.search
  ));
  const currentPath = new URL(currentLocation, window.location.origin).pathname;

  // Handle browser back and forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentLocation(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Smooth internal SPA navigation for all local links
  useEffect(() => {
    const handleLinkClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element)) return;
      const anchor = e.target.closest('a');
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname
        && destination.search === window.location.search) return;

      e.preventDefault();
      const nextLocation = destination.pathname + destination.search;
      window.history.pushState({}, '', nextLocation + destination.hash);
      setCurrentLocation(nextLocation);

      if (destination.hash) {
        setTimeout(() => {
          const targetEl = document.getElementById(destination.hash.slice(1));
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
  }, [currentLocation, title]);

  if (!body) {
    throw new Error(`Could not load page content for ${currentPath}.`);
  }

  return parse(body);
}

createRoot(document.getElementById('root')).render(
  <Page />
);
