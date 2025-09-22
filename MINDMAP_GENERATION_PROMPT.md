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
6. Maximum depth of 4 levels to maintain readability

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
      "color": "#3b82f6"
    },
    {
      "id": "[unique-id]",
      "text": "[concept text]",
      "parentId": "[parent's id or null]",
      "positionX": [number],
      "positionY": [number],
      "color": "#3b82f6"
    }
  ]
}

POSITIONING GUIDELINES:
- Root node: center (500, 300)
- First-level nodes: arrange in circle around root, 200px radius
- Second-level nodes: 150px from parent, angled outward
- Third-level nodes: 120px from parent
- Avoid overlapping - maintain 50px minimum between siblings

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
      "color": "#3b82f6"
    },
    {
      "id": "iam",
      "text": "Identity & Access",
      "parentId": "root",
      "positionX": 300,
      "positionY": 200,
      "color": "#3b82f6"
    },
    {
      "id": "iam-1",
      "text": "Least Privilege",
      "parentId": "iam",
      "positionX": 150,
      "positionY": 150,
      "color": "#3b82f6"
    },
    {
      "id": "iam-2",
      "text": "MFA Required",
      "parentId": "iam",
      "positionX": 150,
      "positionY": 250,
      "color": "#3b82f6"
    },
    {
      "id": "network",
      "text": "Network Security",
      "parentId": "root",
      "positionX": 700,
      "positionY": 200,
      "color": "#3b82f6"
    },
    {
      "id": "data",
      "text": "Data Protection",
      "parentId": "root",
      "positionX": 700,
      "positionY": 400,
      "color": "#3b82f6"
    },
    {
      "id": "monitoring",
      "text": "Monitoring",
      "parentId": "root",
      "positionX": 300,
      "positionY": 400,
      "color": "#3b82f6"
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