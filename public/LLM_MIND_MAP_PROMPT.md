# LLM Prompt for Mind Map JSON Generation

Use this prompt with any LLM (OpenAI, Anthropic, etc.) to generate mind maps in the correct JSON format:

---

## Basic Prompt Template

```
Generate a mind map in JSON format for: [YOUR TOPIC HERE]

Requirements:
1. Create a hierarchical structure with multiple levels of depth (2-4 levels recommended)
2. Include meaningful positioning (x,y coordinates) that create good visual spacing
3. Root node should be centered around (600, 400)
4. Branch main topics radially around the root
5. Use parent-child relationships to show hierarchy
6. Include subtopics under main topics to demonstrate depth

JSON Format:
{
  "nodes": [
    {
      "id": "root",
      "text": "Main Topic",
      "x": 600,
      "y": 400,
      "parent": null,
      "collapsed": false,
      "color": "#4ECDC4"
    },
    {
      "id": "subtopic1",
      "text": "Subtopic 1",
      "x": 400,
      "y": 300,
      "parent": "root",
      "collapsed": false,
      "color": "#FF6B6B"
    },
    {
      "id": "detail1",
      "text": "Detail",
      "x": 250,
      "y": 250,
      "parent": "subtopic1",
      "collapsed": false
    }
  ],
  "links": [
    {"source": "root", "target": "subtopic1"},
    {"source": "subtopic1", "target": "detail1"}
  ]
}

Positioning Guidelines:
- Root: Center around (600, 400)
- Main branches: 200-300px from center in different directions
- Sub-topics: 150-200px from their parent
- Spread nodes to avoid overlap
- Use angles to create radial layouts

Color Guidelines (Optional):
- Use different colors for different categories/themes
- Suggested color palette: #FF6B6B (red), #4ECDC4 (teal), #45B7D1 (blue), #96CEB4 (green), #FECA57 (yellow), #DDA0DD (purple)
- Keep colors accessible and readable with dark text
- You can omit the color property to use default theme colors

Example Structure for "Project Management":
- Root: "Project Management"
  - Planning
    - Requirements Gathering
    - Risk Assessment
    - Timeline Creation
  - Execution
    - Task Assignment
    - Progress Tracking
  - Monitoring
    - KPI Tracking
    - Quality Control

Generate the complete JSON now:
```

---

## Enhanced Prompt for Study Guides & Comprehensive Content

For detailed study guides, certification materials, or complex topics, use this enhanced version with PDF attachment:

```
Generate a comprehensive mind map in JSON format for: [YOUR TOPIC/CERTIFICATION HERE]

Source Material: [ATTACH YOUR PDF STUDY GUIDE]

CRITICAL: You must use the EXACT JSON structure specified below. Do not use alternative property names.

REQUIRED JSON STRUCTURE (follow this exactly):
{
  "nodes": [
    {
      "id": "unique-string-id",
      "text": "Node content",
      "x": 600,
      "y": 400,
      "parent": null,
      "collapsed": false,
      "color": "#4ECDC4"
    }
  ],
  "links": [
    {"source": "parent-id", "target": "child-id"}
  ]
}

IMPORTANT RULES:
- Use "text" NOT "label" for node content
- Use "links" NOT "edges" for connections
- Only include these properties: id, text, x, y, parent, collapsed, color
- Do not add extra properties like "size" or "label"
- All nodes must have "parent" property (null for root node)
- Every parent-child relationship must have a corresponding link

Content Requirements:
1. Analyze the attached PDF and extract ALL major domains, topics, and subtopics
2. Create a deep hierarchical structure (3-5 levels) that reflects the content organization
3. Root node: Main topic/certification name, centered at (600, 400)
4. Level 1: Major domains/sections radiating from center (300-400px away)
5. Level 2: Key topics under each domain (200-300px from parent)
6. Level 3+: Specific services, concepts, or details (150-200px from parent)
7. Use strategic positioning to avoid overlap and create clear visual flow
8. Apply color coding by domain/category for better organization

Color Strategy:
- Use hex color codes (e.g., "#FF6B6B")
- Use consistent colors for related domains
- Differentiate service types with distinct color families
- Keep accessibility in mind with good contrast

Structural Guidelines:
- Group related concepts spatially
- Use radial layout from center for main domains
- Create sub-clusters for detailed topics
- Ensure logical flow and visual hierarchy

Generate the complete JSON now, ensuring ALL content from the PDF is represented and following the EXACT structure specified above:
```

---

## Example Prompt Usage

**For "Learning JavaScript":**
```
Generate a mind map in JSON format for: Learning JavaScript for Web Development

[Include the basic requirements and format above]
```

**For "AWS Security Certification Study Guide":**
```
Generate a comprehensive mind map in JSON format for: AWS Certified Security - Specialty

Source Material: [ATTACH YOUR PDF STUDY GUIDE]

[Include the enhanced requirements and exact JSON structure above]
```

**For "Course with PDF Materials":**
```
Generate a comprehensive mind map in JSON format for: [Course Name]

Source Material: [ATTACH YOUR COURSE PDF MATERIALS]

[Include the enhanced requirements and exact JSON structure above]
```

---

## Expected Output

The LLM will generate a properly formatted JSON that can be directly pasted into your mind map import modal, creating an instant, well-structured mind map with appropriate spacing and hierarchy.