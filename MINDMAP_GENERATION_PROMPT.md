# Mind Map Generation Prompt Template

## Master Prompt for Mind Map Generation

Use this prompt with any AI language model to generate optimized mind maps from any content:

```
You are an expert mind map creator. Your task is to analyze the provided content and create a comprehensive, well-structured mind map in JSON format.

REQUIREMENTS:
1. Extract key concepts, organizing them hierarchically from general to specific
2. Create clear parent-child relationships that show logical connections
3. Use concise phrases (2-5 words ideal, max 10 words)
4. Ensure balanced distribution - aim for 3-7 child nodes per parent
5. Position nodes thoughtfully in 2D space for visual clarity
6. IMPORTANT: Create at least 4-5 levels of depth for complex topics
7. Include specific examples, tools, or services at the leaf nodes
8. When technical content mentions specific tools/services, include them as separate nodes

OUTPUT FORMAT:
{
  "version": "1.0",
  "exported": "[current ISO timestamp]",
  "mindMap": {
    "title": "[Descriptive title based on content]",
    "description": "[One-sentence summary of the content]"
  },
  "nodes": [
    {
      "id": "root",
      "text": "[Central concept]",
      "positionX": 500,
      "positionY": 300,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "[unique-id]",
      "text": "[concept text]",
      "parentId": "[parent's id or null]",
      "positionX": [number],
      "positionY": [number],
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    }
  ]
}

POSITIONING GUIDELINES:
- Root node: center (500, 300)
- First-level nodes: arrange in circle around root, 300px radius
  - For 6 nodes: angles at 0°, 60°, 120°, 180°, 240°, 300°
  - For 4 nodes: angles at 45°, 135°, 225°, 315°
  - Position: x = 500 + 300 * cos(angle), y = 300 + 300 * sin(angle)
- Second-level nodes: 250px from parent, spread in arc
  - Angle range: ±45° from parent's angle
  - Equal spacing within the arc
- Third-level nodes: 200px from parent
- Fourth-level nodes: 150px from parent
- Fifth-level nodes: 120px from parent
- CRITICAL: Siblings must be at least 150px apart
- Use radial layout, not linear positioning

ANALYSIS APPROACH:
1. Identify the main theme/topic
2. Extract 4-6 primary categories/branches
3. Break down each category into key points
4. Add supporting details as final level
5. Ensure logical flow and relationships

Content to analyze:
[INSERT CONTENT HERE]
```

## Optimized Variations by Content Type

### For Articles/Blog Posts
```
Create a mind map from this article. Focus on:
- Main argument/thesis as root
- Key points as primary branches
- Supporting evidence as sub-branches
- Examples and data as leaf nodes

[PASTE ARTICLE]
```

### For Technical Documentation
```
Create a mind map from this documentation. Structure it as:
- Technology/Tool name as root
- Core concepts as primary branches
- Features and capabilities
- Implementation details
- Best practices as outer nodes

[PASTE DOCUMENTATION]
```

### For Meeting Notes/Transcripts
```
Create a mind map from these notes. Organize by:
- Meeting topic as root
- Main discussion points as branches
- Decisions made
- Action items
- Key insights

[PASTE NOTES]
```

### For Educational Content
```
Create a mind map for studying this topic. Structure:
- Subject as root
- Main concepts as primary branches
- Definitions and explanations
- Examples and applications
- Key relationships between concepts

[PASTE CONTENT]
```

### For Project Planning
```
Create a project mind map. Include:
- Project name as root
- Major phases/milestones as branches
- Tasks and subtasks
- Dependencies and requirements
- Resources needed

[PASTE PROJECT DETAILS]
```

### For Technical Certifications/Exams
```
Create a comprehensive mind map for this certification content. Requirements:
- Main topic as root
- Major domains/sections as primary branches
- Key concepts and objectives as sub-branches
- IMPORTANT: Include specific tools, services, and technologies as individual nodes
- For each concept, add practical examples or use cases
- Create at least 4-5 levels of hierarchy
- Include implementation details at leaf nodes

DEPTH EXAMPLE for AWS Security content:
Domain 1: Threat Detection
├── Design incident response
│   ├── AWS Services
│   │   ├── GuardDuty
│   │   │   ├── Threat intelligence
│   │   │   └── Finding types
│   │   ├── Security Hub
│   │   │   ├── Compliance standards
│   │   │   └── Integration partners
│   │   └── Detective
│   │       ├── Graph analysis
│   │       └── Investigation workflows
│   ├── Incident Types
│   │   ├── Credential compromise
│   │   ├── Data exfiltration
│   │   └── Malware infection
│   └── Response Procedures
│       ├── Isolation techniques
│       ├── Evidence collection
│       └── Root cause analysis

COLOR CODING:
- Domains: #0066cc (blue)
- Tasks/Concepts: #00a86b (green)
- AWS Services: #ff6b6b (red)
- Features/Details: #4ecdc4 (teal)
- Best Practices: #95a99c (gray)

[PASTE CERTIFICATION/EXAM CONTENT]
```

## Example Output

Here's a sample output for a mind map about "AWS Security Best Practices":

```json
{
  "version": "1.0",
  "exported": "2024-01-15T10:30:00Z",
  "mindMap": {
    "title": "AWS Security Best Practices",
    "description": "Comprehensive security guidelines for AWS cloud infrastructure"
  },
  "nodes": [
    {
      "id": "root",
      "text": "AWS Security",
      "positionX": 500,
      "positionY": 300,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "iam",
      "text": "Identity & Access",
      "parentId": "root",
      "positionX": 200,
      "positionY": 100,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "iam-1",
      "text": "Least Privilege",
      "parentId": "iam",
      "positionX": -50,
      "positionY": 0,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "iam-1-1",
      "text": "IAM Policies",
      "parentId": "iam-1",
      "positionX": -250,
      "positionY": -50,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "iam-1-1-1",
      "text": "AWS Managed",
      "parentId": "iam-1-1",
      "positionX": -400,
      "positionY": -100,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "iam-1-1-2",
      "text": "Customer Managed",
      "parentId": "iam-1-1",
      "positionX": -400,
      "positionY": 0,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "iam-2",
      "text": "MFA Required",
      "parentId": "iam",
      "positionX": -50,
      "positionY": 100,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "iam-2-1",
      "text": "Virtual MFA",
      "parentId": "iam-2",
      "positionX": -250,
      "positionY": 50,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "iam-2-2",
      "text": "Hardware MFA",
      "parentId": "iam-2",
      "positionX": -250,
      "positionY": 150,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "network",
      "text": "Network Security",
      "parentId": "root",
      "positionX": 700,
      "positionY": 200,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "data",
      "text": "Data Protection",
      "parentId": "root",
      "positionX": 700,
      "positionY": 400,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    },
    {
      "id": "monitoring",
      "text": "Monitoring",
      "parentId": "root",
      "positionX": 300,
      "positionY": 400,
      "backgroundColor": "#0066cc",
      "textColor": "#ffffff"
    }
  ]
}
```

## Pro Tips for Better Mind Maps

### Content Preparation
1. **Clean the input**: Remove ads, navigation, footers
2. **Highlight key sections**: Mark important paragraphs
3. **Include context**: Add source title/author if relevant

### Prompt Customization
- Add "Focus on [specific aspect]" for targeted maps
- Specify "Maximum X nodes" for size control
- Request "Include page references" for study materials
- Ask for "Color coding by category" if needed

### Quality Checks
- Ensure all nodes have unique IDs
- Verify parent-child relationships are logical
- Check position values avoid overlaps
- Confirm text length is appropriate

### Iteration Strategy
1. Generate initial mind map
2. Review structure and completeness
3. Request additions: "Add more detail to [branch]"
4. Request reorganization: "Rebalance the [section]"

## Integration Workflow

1. **Prepare Content**
   - Copy text from source
   - Clean formatting
   - Note key sections

2. **Generate JSON**
   - Use appropriate prompt template
   - Paste content
   - Get JSON output

3. **Import to App**
   - Copy the JSON output
   - Save as `.json` file
   - Use Import JSON feature

4. **Refine in App**
   - Adjust positions
   - Add missing connections
   - Edit text as needed
   - Export final version

## Common Issues & Solutions

### Problem: Too many nodes
**Solution**: Add "Limit to 50 nodes total" to prompt

### Problem: Unbalanced tree
**Solution**: Specify "Ensure each branch has 3-5 sub-nodes"

### Problem: Overlapping positions
**Solution**: Include "Space nodes with 100px minimum gaps"

### Problem: Too detailed/verbose
**Solution**: Add "Use maximum 5 words per node"

### Problem: Missing relationships
**Solution**: Request "Show all logical connections between concepts"

---

## Quick Copy Templates

### Basic Generation
```
Create a mind map in JSON format from this content. Use the exact structure provided in the example, with a root node at (500,300) and logical positioning of child nodes.
```

### Detailed Analysis
```
Analyze this content deeply and create a comprehensive mind map. Include main concepts, supporting details, relationships, and examples. Output as properly formatted JSON with positioning data.
```

### Study Guide
```
Transform this educational content into a study mind map. Focus on key concepts, definitions, relationships, and examples that would help someone learn this topic. Format as JSON.
```