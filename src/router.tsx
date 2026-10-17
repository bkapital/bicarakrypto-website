import React, { createContext, useContext, useEffect, useState } from 'react';

interface RouterContextType {
  currentPath: string;
  navigate: (to: string, e?: React.MouseEvent) => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  navigate: () => {},
});

export const useRouter = () => useContext(RouterContext);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:') || to.startsWith('tel:')) {
      window.open(to, '_blank', 'noopener,noreferrer');
      return;
    }

    // Support hash navigation on same or different page
    const [path, hash] = to.split('#');
    const targetPath = path || '/';

    if (targetPath !== currentPath) {
      window.history.pushState({}, '', to);
      setCurrentPath(targetPath);
      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (hash) {
      window.history.pushState({}, '', to);
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Link: React.FC<{
  to: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
}> = ({ to, children, className = '', target, rel, onClick }) => {
  const { navigate } = useRouter();

  const isExternal = to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:') || to.startsWith('tel:');

  if (isExternal) {
    return (
      <a
        href={to}
        target={target || '_blank'}
        rel={rel || 'noopener noreferrer'}
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (onClick) onClick();
        navigate(to, e);
      }}
    >
      {children}
    </a>
  );
};
