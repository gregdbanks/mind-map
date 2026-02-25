import { exportToMarkdown } from '../markdownExportUtils';
import type { Node } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const globalThis: any;

describe('exportToMarkdown', () => {
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;
  let mockClick: jest.Mock;
  let appendedElement: HTMLAnchorElement | null;
  let capturedBlobContent: string;
  const OriginalBlob = Blob;

  beforeEach(() => {
    jest.clearAllMocks();
    appendedElement = null;
    capturedBlobContent = '';
    mockClick = jest.fn();

    // Mock URL.createObjectURL / revokeObjectURL
    mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    mockRevokeObjectURL = jest.fn();
    (URL.createObjectURL as any) = mockCreateObjectURL;
    (URL.revokeObjectURL as any) = mockRevokeObjectURL;

    // Intercept Blob constructor to capture content
    (globalThis as any).Blob = class MockBlob extends OriginalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (parts && parts.length > 0) {
          capturedBlobContent = parts[0] as string;
        }
      }
    };

    // Mock document.createElement to track the anchor
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = mockClick;
        appendedElement = el as HTMLAnchorElement;
      }
      return el;
    });

    // Mock appendChild / removeChild on document.body
    jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    (globalThis as any).Blob = OriginalBlob;
  });

  function makeNode(id: string, text: string, parent: string | null): Node {
    return { id, text, x: 0, y: 0, collapsed: false, parent };
  }

  function buildNodes(...nodeList: Node[]): Map<string, Node> {
    const map = new Map<string, Node>();
    for (const n of nodeList) {
      map.set(n.id, n);
    }
    return map;
  }

  it('converts a single root node to a markdown heading', () => {
    const nodes = buildNodes(makeNode('root', 'Main Idea', null));

    exportToMarkdown(nodes);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(appendedElement).not.toBeNull();
    expect(appendedElement!.download).toMatch(/^mindmap-\d+\.md$/);
    expect(capturedBlobContent).toContain('# Main Idea');
  });

  it('creates correct markdown structure with root heading and child bullets', () => {
    const nodes = buildNodes(
      makeNode('root', 'Root', null),
      makeNode('child1', 'Child One', 'root'),
      makeNode('child2', 'Child Two', 'root'),
    );

    exportToMarkdown(nodes);

    // Root should be a heading
    expect(capturedBlobContent).toContain('# Root');
    // Children should be bullet items
    expect(capturedBlobContent).toContain('- Child One');
    expect(capturedBlobContent).toContain('- Child Two');
  });

  it('indents grandchildren with two spaces per depth level', () => {
    const nodes = buildNodes(
      makeNode('root', 'Root', null),
      makeNode('child', 'Child', 'root'),
      makeNode('grandchild', 'Grandchild', 'child'),
    );

    exportToMarkdown(nodes);

    const lines = capturedBlobContent.split('\n');
    // Root: "# Root"
    expect(lines[0]).toBe('# Root');
    // Child (depth 1): "- Child" (indent = 0 for depth-1)
    expect(lines[1]).toBe('- Child');
    // Grandchild (depth 2): "  - Grandchild" (indent = 2 spaces for depth-1=1)
    expect(lines[2]).toBe('  - Grandchild');
  });

  it('handles deeply nested structures (depth 4)', () => {
    const nodes = buildNodes(
      makeNode('r', 'Root', null),
      makeNode('a', 'Level1', 'r'),
      makeNode('b', 'Level2', 'a'),
      makeNode('c', 'Level3', 'b'),
    );

    exportToMarkdown(nodes);

    const lines = capturedBlobContent.split('\n');
    expect(lines[0]).toBe('# Root');
    expect(lines[1]).toBe('- Level1');
    expect(lines[2]).toBe('  - Level2');
    expect(lines[3]).toBe('    - Level3');
  });

  it('handles multiple root nodes sorted alphabetically', () => {
    const nodes = buildNodes(
      makeNode('r2', 'Zebra', null),
      makeNode('r1', 'Alpha', null),
    );

    exportToMarkdown(nodes);

    const lines = capturedBlobContent.split('\n');
    // Roots should be sorted alphabetically
    expect(lines[0]).toBe('# Alpha');
    // Empty line separates roots
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe('# Zebra');
  });

  it('produces content ending with a newline', () => {
    const nodes = buildNodes(makeNode('r', 'Root', null));
    exportToMarkdown(nodes);

    expect(capturedBlobContent.endsWith('\n')).toBe(true);
  });

  it('triggers a file download with the correct filename pattern', () => {
    const nodes = buildNodes(makeNode('r', 'Root', null));

    exportToMarkdown(nodes);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(appendedElement!.download).toMatch(/^mindmap-\d+\.md$/);
    expect(appendedElement!.href).toBe('blob:mock-url');
  });

  it('revokes the object URL after download', () => {
    const nodes = buildNodes(makeNode('r', 'Root', null));
    exportToMarkdown(nodes);

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('calls onSuccess callback after export', () => {
    const onSuccess = jest.fn();
    const nodes = buildNodes(makeNode('r', 'Root', null));

    exportToMarkdown(nodes, onSuccess);

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onSuccess is omitted', () => {
    const nodes = buildNodes(makeNode('r', 'Root', null));
    expect(() => exportToMarkdown(nodes)).not.toThrow();
  });

  it('creates the blob with correct MIME type', () => {
    let capturedType = '';
    (globalThis as any).Blob = class TypeCapturingBlob extends OriginalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (options?.type) {
          capturedType = options.type;
        }
      }
    };

    const nodes = buildNodes(makeNode('r', 'Root', null));
    exportToMarkdown(nodes);

    expect(capturedType).toBe('text/markdown;charset=utf-8');
  });

  it('handles empty node map without crashing', () => {
    const nodes = new Map<string, Node>();
    expect(() => exportToMarkdown(nodes)).not.toThrow();
  });
});
