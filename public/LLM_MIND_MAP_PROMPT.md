# Mind Map Generation Prompt

Use this single prompt with any LLM to generate comprehensive, well-structured mind maps with detailed notes.

---

## The Comprehensive Mind Map Prompt

```
Generate a COMPREHENSIVE mind map with detailed notes in JSON format for: [YOUR TOPIC HERE]

[If you have source material]: Source Material: [ATTACH YOUR PDF/DOCUMENT]

CRITICAL REQUIREMENTS:
- Be THOROUGHLY COMPREHENSIVE - capture EVERY concept, no matter how many nodes it takes
- Create DEEP, DETAILED hierarchy - as many levels as needed to fully represent the content
- Keep node text CONCISE (2-5 words) - but create nodes for ALL concepts
- Put extended explanations and details in notes, but don't skip creating nodes for concepts

REQUIRED JSON STRUCTURE:
{
  "nodes": [
    {
      "id": "unique-string-id",
      "text": "Short Title (2-5 words)",
      "x": 600,
      "y": 400,
      "parent": null,
      "collapsed": false,
      "color": "#FF9500"
    }
  ],
  "links": [
    {"source": "parent-id", "target": "child-id"}
  ],
  "notes": [
    {
      "id": "note-unique-id",
      "nodeId": "node-id",
      "content": "<p>ALL comprehensive details go here in HTML format</p>",
      "contentType": "tiptap",
      "plainText": "Plain text version of the content",
      "tags": ["relevant", "tags"],
      "isPinned": false,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}

STRUCTURE GUIDELINES:
1. Root node: Main topic at (600, 400)
2. Primary branches: As many as needed - no limits
3. Hierarchy levels: As deep as necessary (5, 10, 20+ levels if needed)
4. Positioning:
   - Level 1: 300-400px from root
   - Level 2: 200-300px from parent
   - Level 3+: 150-200px from parent
   - Continue spacing for ALL levels
   - Use radial layout and spread nodes to prevent overlap

CONTENT DISTRIBUTION:
- NODES: EVERY concept, topic, subtopic, detail that represents a distinct idea
- NOTES: Extended explanations, examples, procedures, best practices, and additional context
- Create a node for EVERY meaningful concept - don't consolidate to reduce node count

WHAT GOES IN NOTES:
- Complete definitions and explanations
- Step-by-step procedures
- Configuration details
- Examples and use cases
- Best practices
- Tools and services
- Minor subtopics
- Any detail too long for a node title

HTML FORMATTING:
- <p> for paragraphs
- <strong> for emphasis
- <ul> and <li> for lists
- <h3> for subsections
- Keep it clean and readable

COLOR SCHEME:
- Root: #FF9500 (orange)
- Categories: #4A90E2 (blue), #50C878 (green), #FF6B6B (red), #9B59B6 (purple), #F39C12 (amber)
- Subcategories: Lighter shades of parent
- Be consistent within related topics

QUALITY CHECK:
□ Have I captured EVERY concept from the source material?
□ Did I create nodes for ALL topics and subtopics?
□ Is the hierarchy complete and fully detailed?
□ Are all node titles concise (under 5 words)?
□ Does every node have comprehensive notes where applicable?
□ Have I gone deep enough (10+ levels if needed)?
□ Is NOTHING missing or consolidated?

Generate the complete JSON now with FULL comprehensive coverage - every concept gets a node.
```

---

## Usage

Simply copy the prompt above and replace `[YOUR TOPIC HERE]` with your subject. If you have a PDF or document, mention it in the source material line.

The result will be a clean, navigable mind map where:
- The visual structure provides clear overview
- Every node reveals rich details when clicked
- Nothing important is missed
- The map remains uncluttered

This single prompt handles all use cases - from simple topics to complex certification materials.