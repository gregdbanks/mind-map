import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Landing } from '../Landing';

const renderLanding = () => {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );
};

describe('Landing', () => {
  it('renders hero headline text', () => {
    renderLanding();

    expect(screen.getByText('Map Your Mind,')).toBeInTheDocument();
    expect(screen.getByText('Master Your Knowledge')).toBeInTheDocument();
  });

  it('"Get Started Free" link has href="/signup"', () => {
    renderLanding();

    const getStartedLink = screen.getByRole('link', { name: 'Get Started Free' });
    expect(getStartedLink).toHaveAttribute('href', '/signup');
  });

  it('ThoughtNet logo link has href="/"', () => {
    renderLanding();

    // The logo is in the header — it is a Link with text "ThoughtNet"
    // There are multiple "ThoughtNet" elements (header logo + footer brand), so target the header link
    const logoLink = screen.getByRole('link', { name: 'ThoughtNet' });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders all 6 feature cards', () => {
    renderLanding();

    expect(screen.getByText('Visual Mind Mapping')).toBeInTheDocument();
    expect(screen.getByText('Cloud Sync')).toBeInTheDocument();
    expect(screen.getByText('Public Library')).toBeInTheDocument();
    expect(screen.getByText('Export Anywhere')).toBeInTheDocument();
    expect(screen.getByText('Collaboration Ready')).toBeInTheDocument();
    expect(screen.getByText('Smart Templates')).toBeInTheDocument();
  });

  it('footer renders with Library and Sign In links', () => {
    renderLanding();

    // Footer contains Library, Sign In, Sign Up links
    const footerLinks = screen.getAllByRole('link');

    const libraryLinks = footerLinks.filter(link => link.textContent === 'Library');
    expect(libraryLinks.length).toBeGreaterThanOrEqual(1);

    const signInLinks = footerLinks.filter(link => link.textContent === 'Sign In');
    expect(signInLinks.length).toBeGreaterThanOrEqual(1);

    // Check hrefs
    const footerLibrary = signInLinks.find(link => link.getAttribute('href') === '/login');
    expect(footerLibrary).toBeDefined();
  });

  it('"Browse Library" link has href="/library"', () => {
    renderLanding();

    const browseLink = screen.getByRole('link', { name: 'Browse Library' });
    expect(browseLink).toHaveAttribute('href', '/library');
  });
});

describe('HeroBg', () => {
  let appendChildSpy: jest.SpyInstance;
  let mockDestroy: jest.Mock;
  let mockInit: jest.Mock;

  beforeEach(() => {
    appendChildSpy = jest.spyOn(document.head, 'appendChild');
    mockDestroy = jest.fn();
    mockInit = jest.fn();
    delete window.UnicornStudio;
  });

  afterEach(() => {
    appendChildSpy.mockRestore();
    delete window.UnicornStudio;
    cleanup();
    // Remove any script elements appended during tests
    document.head.querySelectorAll('script[src*="unicornStudio"]').forEach(el => el.remove());
  });

  const findUnicornScripts = (spy: jest.SpyInstance): HTMLScriptElement[] =>
    spy.mock.calls
      .map(call => call[0])
      .filter(
        (el: Element) =>
          el.tagName === 'SCRIPT' &&
          (el as HTMLScriptElement).src.includes('unicornStudio')
      );

  it('injects the Unicorn Studio script into the DOM', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const scripts = findUnicornScripts(appendChildSpy);
    expect(scripts).toHaveLength(1);

    const script = scripts[0];
    expect(script.src).toContain(
      'cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js'
    );
    expect(script.async).toBe(true);
  });

  it('does not inject the script twice on re-render', () => {
    // First render — script is appended
    const { unmount } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    // Simulate script onload to set the module-level unicornScriptLoaded = true
    const firstScript = findUnicornScripts(appendChildSpy)[0];
    window.UnicornStudio = { init: mockInit, destroy: mockDestroy };
    firstScript.onload!(new Event('load'));

    // Unmount and re-render (same module, so unicornScriptLoaded stays true)
    unmount();
    appendChildSpy.mockClear();

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const secondRenderScripts = findUnicornScripts(appendChildSpy);
    expect(secondRenderScripts).toHaveLength(0);
  });

  it('calls destroy on unmount for cleanup', () => {
    // UnicornStudio is available and unicornScriptLoaded is true from prior test,
    // so the effect takes the early-return path and registers destroy as cleanup.
    window.UnicornStudio = { init: mockInit, destroy: mockDestroy };

    const { unmount } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    // If a script was still injected (unicornScriptLoaded was false), trigger onload
    // so the cleanup return is registered.
    const scripts = findUnicornScripts(appendChildSpy);
    if (scripts.length > 0 && scripts[0].onload) {
      scripts[0].onload(new Event('load'));
    }

    mockDestroy.mockClear();
    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });
});
