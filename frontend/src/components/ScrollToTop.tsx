import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window to the top whenever the route path changes. Renders
 * nothing. Used because react-router v7's `<ScrollRestoration />` requires
 * the data-router API; this works with a plain `<BrowserRouter>`.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
