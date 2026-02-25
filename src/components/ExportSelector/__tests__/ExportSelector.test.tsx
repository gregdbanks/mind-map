import { render, screen, fireEvent } from '@testing-library/react';
import { ExportSelector } from '../ExportSelector';
import type { MindMapState } from '../../../types';
import { exportToJSON, exportToSVG } from '../../../utils/exportUtils';

// Mock export utility modules
jest.mock('../../../utils/exportUtils', () => ({
  exportToJSON: jest.fn(),
  exportToSVG: jest.fn(),
  exportToPNG: jest.fn(),
  exportToPDF: jest.fn(),
}));

jest.mock('../../../utils/markdownExportUtils', () => ({
  exportToMarkdown: jest.fn(),
}));

// Mock UpgradeModal to simplify assertions
jest.mock('../../UpgradeModal', () => ({
  UpgradeModal: ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div data-testid="upgrade-modal">
      <span>{title}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const createMockState = (): MindMapState => ({
  nodes: new Map([
    ['root', { id: 'root', text: 'Root', collapsed: false, parent: null }],
    ['child1', { id: 'child1', text: 'Child 1', collapsed: false, parent: 'root' }],
  ]),
  links: [{ source: 'root', target: 'child1' }],
  selectedNodeId: null,
  editingNodeId: null,
  lastModified: new Date(),
  isDirty: false,
});

const createDefaultProps = (overrides: Record<string, unknown> = {}) => ({
  svgRef: { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') } as React.RefObject<SVGSVGElement>,
  getMainGroupBBox: jest.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
  canvasBackground: 'white' as const,
  state: createMockState(),
  notes: new Map(),
  onExportSuccess: jest.fn(),
  isPro: false,
  ...overrides,
});

describe('ExportSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the export button', () => {
    render(<ExportSelector {...createDefaultProps()} />);

    const button = screen.getByRole('button', { name: 'Export mind map' });
    expect(button).toBeInTheDocument();
  });

  it('opens dropdown with format options when export button is clicked', () => {
    render(<ExportSelector {...createDefaultProps()} />);

    const button = screen.getByRole('button', { name: 'Export mind map' });
    fireEvent.click(button);

    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('SVG')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
  });

  it('shows Pro badge and lock indicator on locked formats when isPro is false', () => {
    const { container } = render(<ExportSelector {...createDefaultProps({ isPro: false })} />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: 'Export mind map' }));

    // Pro badges should appear for SVG, PNG, PDF, Markdown (4 total)
    const proBadges = screen.getAllByText('Pro');
    expect(proBadges).toHaveLength(4);

    // Lock icons should appear (the Lock lucide icon renders with class lockIcon)
    const lockIcons = container.querySelectorAll('[class*="lockIcon"]');
    expect(lockIcons).toHaveLength(4);
  });

  it('shows no lock indicators when isPro is true', () => {
    const { container } = render(<ExportSelector {...createDefaultProps({ isPro: true })} />);

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: 'Export mind map' }));

    // No Pro badges
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();

    // No lock icons
    const lockIcons = container.querySelectorAll('[class*="lockIcon"]');
    expect(lockIcons).toHaveLength(0);
  });

  it('JSON is always available and never locked', () => {
    render(<ExportSelector {...createDefaultProps({ isPro: false })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Export mind map' }));

    // Find the JSON button
    const jsonButton = screen.getByText('JSON').closest('button');
    expect(jsonButton).not.toBeNull();

    // JSON button should not have a locked class
    expect(jsonButton?.className).not.toMatch(/locked/i);

    // Clicking JSON should call the export, not show upgrade modal
    fireEvent.click(jsonButton!);

    expect(exportToJSON).toHaveBeenCalled();
    expect(screen.queryByTestId('upgrade-modal')).not.toBeInTheDocument();
  });

  it('clicking a locked format when not Pro triggers upgrade flow instead of export', () => {
    render(<ExportSelector {...createDefaultProps({ isPro: false })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Export mind map' }));

    // Click the SVG option (locked for free users)
    const svgButton = screen.getByText('SVG').closest('button');
    fireEvent.click(svgButton!);

    // Upgrade modal should appear
    expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Export')).toBeInTheDocument();

    // Export function should NOT have been called
    expect(exportToSVG).not.toHaveBeenCalled();
  });

  it('shows descriptions for each format option', () => {
    render(<ExportSelector {...createDefaultProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Export mind map' }));

    expect(screen.getByText('Editable data — re-import later')).toBeInTheDocument();
    expect(screen.getByText('Vector graphic — scalable')).toBeInTheDocument();
    expect(screen.getByText('Image — 2x retina quality')).toBeInTheDocument();
    expect(screen.getByText('Document — print-ready')).toBeInTheDocument();
    expect(screen.getByText('Text outline — bullets & headings')).toBeInTheDocument();
  });

  it('sets aria-expanded attribute correctly on toggle', () => {
    render(<ExportSelector {...createDefaultProps()} />);

    const button = screen.getByRole('button', { name: 'Export mind map' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
