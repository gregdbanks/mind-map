const AWS_SECURITY_MINDMAP = {
  text: 'AWS Security',
  children: [
    {
      text: 'Identity & Access Management (IAM)',
      children: [
        {
          text: 'Users & Groups',
          children: [
            { text: 'Root User Protection' },
            { text: 'MFA Requirements' },
            { text: 'Password Policies' },
            { text: 'Access Keys Rotation' },
          ],
        },
        {
          text: 'Roles & Policies',
          children: [
            { text: 'Least Privilege Principle' },
            { text: 'Service-Linked Roles' },
            { text: 'Permission Boundaries' },
            { text: 'Policy Conditions' },
          ],
        },
        {
          text: 'Federation & SSO',
          children: [
            { text: 'SAML 2.0' },
            { text: 'AWS SSO' },
            { text: 'External IdP Integration' },
          ],
        },
      ],
    },
    {
      text: 'Network Security',
      children: [
        {
          text: 'VPC Security',
          children: [
            { text: 'Security Groups' },
            { text: 'NACLs' },
            { text: 'VPC Flow Logs' },
            { text: 'PrivateLink' },
          ],
        },
        {
          text: 'Edge Security',
          children: [
            { text: 'AWS WAF' },
            { text: 'AWS Shield' },
            { text: 'CloudFront Security' },
            { text: 'Route 53 DNSSEC' },
          ],
        },
        {
          text: 'Network Isolation',
          children: [
            { text: 'Private Subnets' },
            { text: 'NAT Gateways' },
            { text: 'VPC Endpoints' },
          ],
        },
      ],
    },
    {
      text: 'Data Protection',
      children: [
        {
          text: 'Encryption at Rest',
          children: [
            { text: 'KMS Integration' },
            { text: 'S3 Encryption' },
            { text: 'EBS Encryption' },
            { text: 'RDS Encryption' },
          ],
        },
        {
          text: 'Encryption in Transit',
          children: [
            { text: 'TLS/SSL Certificates' },
            { text: 'ACM Management' },
            { text: 'VPN Connections' },
          ],
        },
        {
          text: 'Data Classification',
          children: [
            { text: 'AWS Macie' },
            { text: 'S3 Object Tags' },
            { text: 'Resource Tagging' },
          ],
        },
      ],
    },
    {
      text: 'Compliance & Governance',
      children: [
        {
          text: 'Compliance Programs',
          children: [
            { text: 'HIPAA' },
            { text: 'PCI DSS' },
            { text: 'SOC 2' },
            { text: 'GDPR' },
          ],
        },
        {
          text: 'Audit & Logging',
          children: [
            { text: 'CloudTrail' },
            { text: 'Config Rules' },
            { text: 'Access Analyzer' },
            { text: 'Security Hub' },
          ],
        },
        {
          text: 'Cost & Resource Management',
          children: [
            { text: 'AWS Organizations' },
            { text: 'Service Control Policies' },
            { text: 'Control Tower' },
          ],
        },
      ],
    },
    {
      text: 'Detection & Response',
      children: [
        {
          text: 'Threat Detection',
          children: [
            { text: 'GuardDuty' },
            { text: 'Detective' },
            { text: 'Macie Alerts' },
          ],
        },
        {
          text: 'Incident Response',
          children: [
            { text: 'Systems Manager' },
            { text: 'Automated Remediation' },
            { text: 'Lambda Functions' },
          ],
        },
      ],
    },
    {
      text: 'Infrastructure Security',
      children: [
        {
          text: 'Compute Security',
          children: [
            { text: 'EC2 Security Groups' },
            { text: 'Instance Metadata Service v2' },
            { text: 'Nitro Enclaves' },
            { text: 'Systems Manager Patch Manager' },
          ],
        },
        {
          text: 'Container Security',
          children: [
            { text: 'ECR Image Scanning' },
            { text: 'ECS Task Roles' },
            { text: 'Fargate Security' },
          ],
        },
      ],
    },
    {
      text: 'Application Security',
      children: [
        {
          text: 'Secrets Management',
          children: [
            { text: 'Secrets Manager' },
            { text: 'Parameter Store' },
            { text: 'Rotation Policies' },
          ],
        },
        {
          text: 'API Security',
          children: [
            { text: 'API Gateway Auth' },
            { text: 'Lambda Authorizers' },
            { text: 'Cognito User Pools' },
          ],
        },
      ],
    },
  ],
}

// Calculate positions using a radial layout
function calculateRadialPositions(node, centerX = 800, centerY = 600, radius = 300, startAngle = 0, endAngle = 2 * Math.PI, level = 0) {
  const result = {
    ...node,
    x: centerX,
    y: centerY,
    level,
  }

  if (node.children && node.children.length > 0) {
    const angleStep = (endAngle - startAngle) / node.children.length
    const childRadius = radius * (level === 0 ? 1 : 0.7)
    
    result.children = node.children.map((child, index) => {
      const angle = startAngle + angleStep * (index + 0.5)
      const childX = centerX + childRadius * Math.cos(angle)
      const childY = centerY + childRadius * Math.sin(angle)
      
      // For deeper levels, use a smaller section of the circle
      const childStartAngle = angle - angleStep * 0.4
      const childEndAngle = angle + angleStep * 0.4
      
      return calculateRadialPositions(
        child,
        childX,
        childY,
        childRadius * 0.6,
        level === 0 ? childStartAngle : angle - Math.PI / 6,
        level === 0 ? childEndAngle : angle + Math.PI / 6,
        level + 1
      )
    })
  }

  return result
}

async function createNode(mindMapId, node, parentId = null) {
  const nodeData = {
    text: node.text,
    positionX: Math.round(node.x),
    positionY: Math.round(node.y),
    parentId,
    width: Math.max(150, node.text.length * 8),
    height: 60,
    backgroundColor: node.level === 0 ? '#1e40af' : node.level === 1 ? '#3b82f6' : node.level === 2 ? '#60a5fa' : '#93bbfc',
    textColor: node.level > 2 ? '#1e40af' : '#ffffff',
    fontSize: node.level === 0 ? 20 : node.level === 1 ? 16 : 14,
    fontWeight: node.level <= 1 ? 'bold' : 'normal',
    borderColor: node.level === 0 ? '#1e3a8a' : node.level === 1 ? '#2563eb' : '#3b82f6',
    borderWidth: node.level === 0 ? 3 : 2,
    borderRadius: 8,
  }

  const response = await fetch(`http://localhost:3001/api/mindmaps/${mindMapId}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodeData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create node: ${node.text} - ${error}`)
  }

  const createdNode = await response.json()

  // Create children recursively
  if (node.children) {
    for (const child of node.children) {
      await createNode(mindMapId, child, createdNode.id)
    }
  }

  return createdNode.id
}

async function createAWSSecurityMindMap() {
  try {
    // Delete the old mind map first
    const existingMindMaps = await fetch('http://localhost:3001/api/mindmaps').then(r => r.json())
    const oldMap = existingMindMaps.find(m => m.title === 'AWS Security Best Practices')
    if (oldMap) {
      await fetch(`http://localhost:3001/api/mindmaps/${oldMap.id}`, { method: 'DELETE' })
      console.log('Deleted old mind map')
    }

    // Create the mind map
    const mindMapResponse = await fetch('http://localhost:3001/api/mindmaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'AWS Security Best Practices',
        description: 'Comprehensive overview of AWS security services, practices, and compliance requirements',
      }),
    })

    if (!mindMapResponse.ok) {
      throw new Error('Failed to create mind map')
    }

    const mindMap = await mindMapResponse.json()
    console.log('Created mind map:', mindMap.id)

    // Calculate positions for all nodes
    const positionedTree = calculateRadialPositions(AWS_SECURITY_MINDMAP)
    
    // Create all nodes
    await createNode(mindMap.id, positionedTree)

    // Update canvas to center on the mind map
    await fetch(`http://localhost:3001/api/mindmaps/${mindMap.id}/canvas`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zoom: 0.6,
        panX: -400,
        panY: -300,
      }),
    })

    console.log('AWS Security mind map created successfully!')
    console.log(`View it at: http://localhost:5173/mindmap/${mindMap.id}`)
    
    return mindMap.id
  } catch (error) {
    console.error('Error creating AWS Security mind map:', error)
  }
}

// Run the function
createAWSSecurityMindMap()