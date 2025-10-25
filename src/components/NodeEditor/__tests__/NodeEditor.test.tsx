import { render, fireEvent } from '@testing-library/react';
import { NodeEditor } from '../NodeEditor';

describe('NodeEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  
  const defaultProps = {
    nodeId: 'test-node-1',
    initialText: 'Test Node',
    x: 100,
    y: 100,
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock SVG element and methods
    const mockSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    jest.spyOn(document, 'querySelector').mockReturnValue(mockSVGElement);
    
    // Mock createSVGPoint
    mockSVGElement.createSVGPoint = jest.fn().mockReturnValue({
      x: 0,
      y: 0,
      matrixTransform: jest.fn().mockReturnValue({ x: 100, y: 100 }),
    });
    
    // Mock getScreenCTM - DOMMatrix not available in test env
    mockSVGElement.getScreenCTM = jest.fn().mockReturnValue({
      a: 1, b: 0, c: 0, d: 1, e: 0, f: 0
    } as any);
  });

  it('renders with initial text', () => {
    const { getByDisplayValue } = render(<NodeEditor {...defaultProps} />);
    expect(getByDisplayValue('Test Node')).toBeInTheDocument();
  });

  it('focuses input on mount', () => {
    const { getByDisplayValue } = render(<NodeEditor {...defaultProps} />);
    const input = getByDisplayValue('Test Node');
    expect(document.activeElement).toBe(input);
  });

  it('saves on form submit with valid text', () => {
    const { getByDisplayValue } = render(<NodeEditor {...defaultProps} />);
    const input = getByDisplayValue('Test Node');
    
    fireEvent.change(input, { target: { value: 'Updated Node' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(mockOnSave).toHaveBeenCalledWith('test-node-1', 'Updated Node');
  });

  it('cancels when text is empty', () => {
    const { getByDisplayValue } = render(<NodeEditor {...defaultProps} />);
    const input = getByDisplayValue('Test Node');
    
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(mockOnCancel).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('cancels on Escape key', () => {
    const { getByDisplayValue } = render(<NodeEditor {...defaultProps} />);
    const input = getByDisplayValue('Test Node');
    
    fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('saves on blur', () => {
    const { getByDisplayValue } = render(<NodeEditor {...defaultProps} />);
    const input = getByDisplayValue('Test Node');
    
    fireEvent.change(input, { target: { value: 'Blurred Node' } });
    fireEvent.blur(input);
    
    expect(mockOnSave).toHaveBeenCalledWith('test-node-1', 'Blurred Node');
  });

  it('trims whitespace from text', () => {
    const { getByDisplayValue } = render(<NodeEditor {...defaultProps} />);
    const input = getByDisplayValue('Test Node');
    
    fireEvent.change(input, { target: { value: '  Trimmed Node  ' } });
    fireEvent.submit(input.closest('form')!);
    
    expect(mockOnSave).toHaveBeenCalledWith('test-node-1', 'Trimmed Node');
  });

  it('positions correctly based on SVG coordinates', () => {
    const { container } = render(<NodeEditor {...defaultProps} />);
    const editorContainer = container.querySelector('.editorContainer');
    
    expect(editorContainer).toHaveStyle({
      left: '100px',
      top: '100px',
    });
  });

  it('returns null when SVG element is not found', () => {
    jest.spyOn(document, 'querySelector').mockReturnValue(null);
    
    const { container } = render(<NodeEditor {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });
});