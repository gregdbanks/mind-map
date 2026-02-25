import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateModal } from '../TemplateModal';
import { templates } from '../../../data/templates';

describe('TemplateModal', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();

  const renderModal = () =>
    render(<TemplateModal onSelect={mockOnSelect} onClose={mockOnClose} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "New from Template" heading', () => {
    renderModal();

    expect(screen.getByText('New from Template')).toBeInTheDocument();
  });

  it('renders all templates from the data file', () => {
    renderModal();

    // Each template renders its name inside an h3
    const templateNames = templates.map((t) => t.name);
    templateNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });

    // Verify exact count by checking the number of template descriptions rendered
    const descriptions = templates.map((t) => t.description);
    descriptions.forEach((desc) => {
      expect(screen.getByText(desc)).toBeInTheDocument();
    });
  });

  it('each template card shows name and description', () => {
    renderModal();

    templates.forEach((template) => {
      expect(screen.getByText(template.name)).toBeInTheDocument();
      expect(screen.getByText(template.description)).toBeInTheDocument();
    });
  });

  it('clicking a card selects it (applies selected class)', () => {
    renderModal();

    const firstTemplateName = templates[0].name;
    const card = screen.getByText(firstTemplateName).closest('button');
    expect(card).toBeTruthy();

    fireEvent.click(card!);

    // After selection, the card should have the selected CSS module class
    expect(card!.className).toContain('cardSelected');
  });

  it('"Use Template" button is disabled when nothing is selected', () => {
    renderModal();

    const useButton = screen.getByText('Use Template');
    expect(useButton).toBeDisabled();
  });

  it('after selecting a template, "Use Template" is enabled', () => {
    renderModal();

    // Select the first template
    const card = screen.getByText(templates[0].name).closest('button');
    fireEvent.click(card!);

    const useButton = screen.getByText('Use Template');
    expect(useButton).not.toBeDisabled();
  });

  it('clicking "Use Template" calls onSelect with the selected template', () => {
    renderModal();

    const targetTemplate = templates[2]; // pick an arbitrary template
    const card = screen.getByText(targetTemplate.name).closest('button');
    fireEvent.click(card!);

    const useButton = screen.getByText('Use Template');
    fireEvent.click(useButton);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(targetTemplate);
  });

  it('Cancel button calls onClose', () => {
    renderModal();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('clicking overlay calls onClose', () => {
    const { container } = renderModal();

    // The overlay is the outermost div with the overlay className
    const overlay = container.firstChild as HTMLElement;
    // Click directly on the overlay (not on a child)
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('close (X) button calls onClose', () => {
    renderModal();

    // The close button renders &times; which is the multiplication sign character
    const closeButton = screen.getByText('\u00D7');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
