import { render, screen } from '@testing-library/react';
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
