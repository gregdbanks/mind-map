# Mind Map Application Instructions

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating Mind Maps](#creating-mind-maps)
3. [Navigation & Controls](#navigation--controls)
4. [Sharing & Export](#sharing--export)
5. [Import & Backup](#import--backup)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Tips & Best Practices](#tips--best-practices)

## Getting Started

### First Time Setup
1. Navigate to the application homepage
2. You'll see a list of existing mind maps (empty on first use)
3. Click "Create New" to start your first mind map

### Quick Start
- **Create**: Click "Create New" → Enter title → Start mapping
- **Import**: Click "Import JSON" → Select a previously exported file
- **Open**: Click on any mind map in the list to view/edit

## Creating Mind Maps

### Basic Creation
1. **From Scratch**:
   - Click "Create New"
   - Enter a title (required)
   - Add an optional description
   - Click "Create"

2. **From Import**:
   - Click "Import JSON"
   - Select a `.json` file exported from this app
   - The mind map will be recreated with all nodes

### Adding Nodes
- **Double-click** on empty canvas to create a root node
- **Double-click** near an existing node to create a child
- Type your text and press **Enter** to save

### Node Relationships
- Nodes automatically connect to their parent
- Drag nodes to reposition while maintaining connections
- Child nodes follow a hierarchical structure

## Navigation & Controls

### Canvas Navigation
- **Pan**: 
  - Hold **Space** + drag mouse
  - Or use mouse wheel (horizontal/vertical)
- **Zoom**:
  - **Ctrl/Cmd + Mouse wheel**
  - Or use the **+/-** buttons
- **Reset View**: Click the "Reset" button to center

### Node Operations
- **Select**: Click on a node
- **Multi-select**: Ctrl/Cmd + Click multiple nodes
- **Edit**: Double-click a node
- **Delete**: Select node(s) and press **Delete**
- **Move**: Drag any node to reposition

## Sharing & Export

### Share Options
Click the **Share** button in the canvas view to access:

1. **🌐 Interactive HTML**
   - Downloads a self-contained HTML file
   - Works completely offline
   - Recipients can view without the app
   - Best for sharing with non-users

2. **💾 JSON File**
   - Exports data for backup or import
   - Preserves all node relationships
   - Can be imported to create a copy
   - Best for backup or moving between accounts

3. **📧 Email**
   - Downloads HTML and opens email client
   - Pre-filled with instructions
   - Recipients save and open the HTML file

### How to Share via Slack/Teams
1. Click Share → Interactive HTML
2. Upload the downloaded `.html` file to Slack/Teams
3. Recipients download and drag into browser

## Import & Backup

### Exporting for Backup
1. Open your mind map
2. Click Share → JSON File
3. Save the `.json` file
4. This preserves:
   - All nodes and text
   - Node positions
   - Parent-child relationships
   - Mind map metadata

### Importing a Backup
1. From the home page, click "Import JSON"
2. Select your saved `.json` file
3. A new mind map is created with all data
4. Original mind map remains unchanged

### Import Notes
- Creates a new copy (doesn't overwrite)
- Maintains all node relationships
- Generates new IDs for all items
- Works with exports from any version

## Keyboard Shortcuts

### Global Shortcuts
- **Space + Drag**: Pan the canvas
- **Ctrl/Cmd + A**: Select all nodes
- **Delete**: Delete selected nodes
- **Escape**: Clear selection/Cancel edit
- **Enter**: Save node text (when editing)

### Navigation
- **Mouse Wheel**: Scroll/Pan
- **Ctrl/Cmd + Mouse Wheel**: Zoom in/out

## Tips & Best Practices

### Organizing Your Mind Map
1. **Start with a central concept** as your root node
2. **Use short, clear phrases** in nodes
3. **Group related ideas** under common parents
4. **Limit child nodes** to 5-7 per parent for clarity
5. **Use consistent terminology** throughout

### Visual Organization
- Position primary branches evenly around the center
- Keep similar concepts at similar distances
- Use the Reset View button to recenter when lost
- Zoom out occasionally to see the full picture

### Performance Tips
- The app handles hundreds of nodes smoothly
- Auto-save ensures no data loss
- Changes sync in real-time
- Works offline once loaded

### Common Use Cases
1. **Project Planning**: Break down tasks and subtasks
2. **Note Taking**: Organize lecture or meeting notes
3. **Brainstorming**: Capture and connect ideas
4. **Study Guides**: Create visual learning materials
5. **Knowledge Base**: Document processes or systems

### Troubleshooting
- **Can't see nodes?** Click "Reset" to center view
- **Lost your work?** Check auto-save worked (it should)
- **Import failing?** Ensure JSON file is from this app
- **Sharing not working?** Try the HTML export option

## Advanced Features

### Batch Operations
- Select multiple nodes with Ctrl/Cmd+Click
- Delete multiple nodes at once
- Drag to reposition node groups

### Canvas State
- Zoom and pan positions are saved
- Each mind map remembers its view
- Reset view to default anytime

### Data Portability
- All exports are self-contained
- No external dependencies
- JSON format is human-readable
- HTML exports work offline

---

## Need Help?
- Check the tooltips on buttons
- Most actions are undoable
- Your work auto-saves
- Export regularly for backup