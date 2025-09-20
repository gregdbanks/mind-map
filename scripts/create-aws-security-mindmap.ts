interface NodeData {
  text: string
  x: number
  y: number
  children?: NodeData[]
}

const AWS_SECURITY_MINDMAP: NodeData = {
  text: 'AWS Security',
  x: 800,
  y: 600,
  children: [
    {
      text: 'Identity & Access Management (IAM)',
      x: 200,
      y: 100,
      children: [
        {
          text: 'Users & Groups',
          x: 50,
          y: 50,
          children: [
            { text: 'Root User Protection', x: 50, y: 30 },
            { text: 'MFA Requirements', x: 50, y: 60 },
            { text: 'Password Policies', x: 50, y: 90 },
            { text: 'Access Keys Rotation', x: 50, y: 120 },
          ],
        },
        {
          text: 'Roles & Policies',
          x: 50,
          y: 200,
          children: [
            { text: 'Least Privilege Principle', x: 50, y: 30 },
            { text: 'Service-Linked Roles', x: 50, y: 60 },
            { text: 'Permission Boundaries', x: 50, y: 90 },
            { text: 'Policy Conditions', x: 50, y: 120 },
          ],
        },
        {
          text: 'Federation & SSO',
          x: 50,
          y: 350,
          children: [
            { text: 'SAML 2.0', x: 50, y: 30 },
            { text: 'AWS SSO', x: 50, y: 60 },
            { text: 'External IdP Integration', x: 50, y: 90 },
          ],
        },
      ],
    },
    {
      text: 'Network Security',
      x: 600,
      y: 100,
      children: [
        {
          text: 'VPC Security',
          x: 50,
          y: 50,
          children: [
            { text: 'Security Groups', x: 50, y: 30 },
            { text: 'NACLs', x: 50, y: 60 },
            { text: 'VPC Flow Logs', x: 50, y: 90 },
            { text: 'PrivateLink', x: 50, y: 120 },
          ],
        },
        {
          text: 'Edge Security',
          x: 50,
          y: 200,
          children: [
            { text: 'AWS WAF', x: 50, y: 30 },
            { text: 'AWS Shield', x: 50, y: 60 },
            { text: 'CloudFront Security', x: 50, y: 90 },
            { text: 'Route 53 DNSSEC', x: 50, y: 120 },
          ],
        },
        {
          text: 'Network Isolation',
          x: 50,
          y: 350,
          children: [
            { text: 'Private Subnets', x: 50, y: 30 },
            { text: 'NAT Gateways', x: 50, y: 60 },
            { text: 'VPC Endpoints', x: 50, y: 90 },
          ],
        },
      ],
    },
    {
      text: 'Data Protection',
      x: 1000,
      y: 100,
      children: [
        {
          text: 'Encryption at Rest',
          x: 50,
          y: 50,
          children: [
            { text: 'KMS Integration', x: 50, y: 30 },
            { text: 'S3 Encryption', x: 50, y: 60 },
            { text: 'EBS Encryption', x: 50, y: 90 },
            { text: 'RDS Encryption', x: 50, y: 120 },
          ],
        },
        {
          text: 'Encryption in Transit',
          x: 50,
          y: 200,
          children: [
            { text: 'TLS/SSL Certificates', x: 50, y: 30 },
            { text: 'ACM Management', x: 50, y: 60 },
            { text: 'VPN Connections', x: 50, y: 90 },
          ],
        },
        {
          text: 'Data Classification',
          x: 50,
          y: 350,
          children: [
            { text: 'AWS Macie', x: 50, y: 30 },
            { text: 'S3 Object Tags', x: 50, y: 60 },
            { text: 'Resource Tagging', x: 50, y: 90 },
          ],
        },
      ],
    },
    {
      text: 'Compliance & Governance',
      x: 1400,
      y: 100,
      children: [
        {
          text: 'Compliance Programs',
          x: 50,
          y: 50,
          children: [
            { text: 'HIPAA', x: 50, y: 30 },
            { text: 'PCI DSS', x: 50, y: 60 },
            { text: 'SOC 2', x: 50, y: 90 },
            { text: 'GDPR', x: 50, y: 120 },
          ],
        },
        {
          text: 'Audit & Logging',
          x: 50,
          y: 200,
          children: [
            { text: 'CloudTrail', x: 50, y: 30 },
            { text: 'Config Rules', x: 50, y: 60 },
            { text: 'Access Analyzer', x: 50, y: 90 },
            { text: 'Security Hub', x: 50, y: 120 },
          ],
        },
        {
          text: 'Cost & Resource Management',
          x: 50,
          y: 350,
          children: [
            { text: 'AWS Organizations', x: 50, y: 30 },
            { text: 'Service Control Policies', x: 50, y: 60 },
            { text: 'Control Tower', x: 50, y: 90 },
          ],
        },
      ],
    },
    {
      text: 'Detection & Response',
      x: 200,
      y: 800,
      children: [
        {
          text: 'Threat Detection',
          x: 50,
          y: 50,
          children: [
            { text: 'GuardDuty', x: 50, y: 30 },
            { text: 'Detective', x: 50, y: 60 },
            { text: 'Macie Alerts', x: 50, y: 90 },
          ],
        },
        {
          text: 'Incident Response',
          x: 50,
          y: 200,
          children: [
            { text: 'Systems Manager', x: 50, y: 30 },
            { text: 'Automated Remediation', x: 50, y: 60 },
            { text: 'Lambda Functions', x: 50, y: 90 },
          ],
        },
      ],
    },
    {
      text: 'Infrastructure Security',
      x: 600,
      y: 800,
      children: [
        {
          text: 'Compute Security',
          x: 50,
          y: 50,
          children: [
            { text: 'EC2 Security Groups', x: 50, y: 30 },
            { text: 'Instance Metadata Service v2', x: 50, y: 60 },
            { text: 'Nitro Enclaves', x: 50, y: 90 },
            { text: 'Systems Manager Patch Manager', x: 50, y: 120 },
          ],
        },
        {
          text: 'Container Security',
          x: 50,
          y: 200,
          children: [
            { text: 'ECR Image Scanning', x: 50, y: 30 },
            { text: 'ECS Task Roles', x: 50, y: 60 },
            { text: 'Fargate Security', x: 50, y: 90 },
          ],
        },
      ],
    },
    {
      text: 'Application Security',
      x: 1000,
      y: 800,
      children: [
        {
          text: 'Secrets Management',
          x: 50,
          y: 50,
          children: [
            { text: 'Secrets Manager', x: 50, y: 30 },
            { text: 'Parameter Store', x: 50, y: 60 },
            { text: 'Rotation Policies', x: 50, y: 90 },
          ],
        },
        {
          text: 'API Security',
          x: 50,
          y: 200,
          children: [
            { text: 'API Gateway Auth', x: 50, y: 30 },
            { text: 'Lambda Authorizers', x: 50, y: 60 },
            { text: 'Cognito User Pools', x: 50, y: 90 },
          ],
        },
      ],
    },
  ],
}

async function createNode(
  mindMapId: string,
  node: NodeData,
  parentId?: string,
  baseX = 0,
  baseY = 0
): Promise<string> {
  const response = await fetch(`http://localhost:3001/api/mindmaps/${mindMapId}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: node.text,
      positionX: baseX + node.x,
      positionY: baseY + node.y,
      parentId,
      width: Math.max(150, node.text.length * 8),
      height: 60,
      backgroundColor: parentId ? '#f0f9ff' : '#3b82f6',
      textColor: parentId ? '#1e40af' : '#ffffff',
      fontSize: parentId ? 14 : 18,
      fontWeight: parentId ? 'normal' : 'bold',
      borderColor: parentId ? '#60a5fa' : '#2563eb',
      borderRadius: 8,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create node: ${node.text}`)
  }

  const createdNode = await response.json()

  // Create children recursively
  if (node.children) {
    for (const child of node.children) {
      await createNode(mindMapId, child, createdNode.id, baseX + node.x, baseY + node.y)
    }
  }

  return createdNode.id
}

async function createAWSSecurityMindMap() {
  try {
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

    // Create all nodes
    await createNode(mindMap.id, AWS_SECURITY_MINDMAP)

    console.log('AWS Security mind map created successfully!')
    console.log(`View it at: http://localhost:5173/mindmap/${mindMap.id}`)
  } catch (error) {
    console.error('Error creating AWS Security mind map:', error)
  }
}

// Run if called directly
if (require.main === module) {
  createAWSSecurityMindMap()
}

export { createAWSSecurityMindMap }