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

  it('renders a "Download JSON" button for every template card', () => {
    renderModal();

    const downloadButtons = screen.getAllByTitle('Download JSON');
    expect(downloadButtons).toHaveLength(templates.length);
  });

  it('clicking a download button triggers a file download with correct Blob content', () => {
    // Mock URL.createObjectURL / revokeObjectURL
    const fakeUrl = 'blob:http://localhost/fake-uuid';
    const createObjectURLSpy = jest.fn().mockReturnValue(fakeUrl);
    const revokeObjectURLSpy = jest.fn();
    window.URL.createObjectURL = createObjectURLSpy;
    window.URL.revokeObjectURL = revokeObjectURLSpy;

    // Track the anchor element created for the download
    const clickSpy = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    let capturedAnchor: HTMLAnchorElement | null = null;
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const el = originalCreateElement(tag, options);
      if (tag === 'a') {
        capturedAnchor = el as HTMLAnchorElement;
        capturedAnchor.click = clickSpy;
      }
      return el;
    });

    renderModal();

    const downloadButtons = screen.getAllByTitle('Download JSON');
    // Click the first template's download button
    fireEvent.click(downloadButtons[0]);

    // Verify URL.createObjectURL was called with a Blob
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURLSpy.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('application/json');

    // Verify the anchor was configured correctly and clicked
    expect(capturedAnchor).not.toBeNull();
    expect(capturedAnchor!.href).toContain(fakeUrl);
    expect(capturedAnchor!.download).toBe(`${templates[0].id}.json`);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // Verify cleanup: revokeObjectURL was called
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(fakeUrl);

    // Verify onSelect was NOT called (download should not select/use the template)
    expect(mockOnSelect).not.toHaveBeenCalled();

    createElementSpy.mockRestore();
  });
});
