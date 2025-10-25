import type { Node, Link } from '../types/mindMap';

// AWS Security Certification Study Guide Mind Map
export const demoNodes: Node[] = [
  {
    "id": "root",
    "text": "AWS Certified Security - Specialty (SCS-C02)",
    "x": 600,
    "y": 400,
    "parent": null,
    "collapsed": false,
    "color": "#2C3E50"
  },
  {
    "id": "domain1",
    "text": "Domain 1: Threat Detection & Incident Response (14%)",
    "x": 900,
    "y": 200,
    "parent": "root",
    "collapsed": false,
    "color": "#E74C3C"
  },
  {
    "id": "d1-task1",
    "text": "Design & Implement Incident Response Plan",
    "x": 1150,
    "y": 100,
    "parent": "domain1",
    "collapsed": false,
    "color": "#E74C3C"
  },
  {
    "id": "d1-t1-k1",
    "text": "AWS Security Finding Format (ASFF)",
    "x": 1350,
    "y": 50,
    "parent": "d1-task1",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "d1-t1-k2",
    "text": "Playbooks & Runbooks",
    "x": 1350,
    "y": 100,
    "parent": "d1-task1",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "d1-t1-k3",
    "text": "Security Hub, GuardDuty, Detective",
    "x": 1350,
    "y": 150,
    "parent": "d1-task1",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "d1-task2",
    "text": "Detect Security Threats & Anomalies",
    "x": 1150,
    "y": 250,
    "parent": "domain1",
    "collapsed": false,
    "color": "#E74C3C"
  },
  {
    "id": "d1-t2-k1",
    "text": "CloudWatch Metrics & Dashboards",
    "x": 1350,
    "y": 200,
    "parent": "d1-task2",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "d1-t2-k2",
    "text": "Amazon Athena Queries",
    "x": 1350,
    "y": 250,
    "parent": "d1-task2",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "d1-t2-k3",
    "text": "Correlation Techniques",
    "x": 1350,
    "y": 300,
    "parent": "d1-task2",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "d1-task3",
    "text": "Respond to Compromised Resources",
    "x": 1150,
    "y": 400,
    "parent": "domain1",
    "collapsed": false,
    "color": "#E74C3C"
  },
  {
    "id": "d1-t3-k1",
    "text": "Resource Isolation",
    "x": 1350,
    "y": 350,
    "parent": "d1-task3",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "d1-t3-k2",
    "text": "Forensic Data Capture",
    "x": 1350,
    "y": 400,
    "parent": "d1-task3",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "d1-t3-k3",
    "text": "S3 Object Lock & Lifecycle",
    "x": 1350,
    "y": 450,
    "parent": "d1-task3",
    "collapsed": false,
    "color": "#EC7063"
  },
  {
    "id": "domain2",
    "text": "Domain 2: Security Logging & Monitoring (18%)",
    "x": 950,
    "y": 600,
    "parent": "root",
    "collapsed": false,
    "color": "#3498DB"
  },
  {
    "id": "d2-task1",
    "text": "Design Monitoring & Alerting",
    "x": 1200,
    "y": 550,
    "parent": "domain2",
    "collapsed": false,
    "color": "#3498DB"
  },
  {
    "id": "d2-t1-k1",
    "text": "CloudWatch & EventBridge",
    "x": 1400,
    "y": 500,
    "parent": "d2-task1",
    "collapsed": false,
    "color": "#5DADE2"
  },
  {
    "id": "d2-t1-k2",
    "text": "Lambda & SNS Automation",
    "x": 1400,
    "y": 550,
    "parent": "d2-task1",
    "collapsed": false,
    "color": "#5DADE2"
  },
  {
    "id": "d2-t1-k3",
    "text": "Metrics & Thresholds",
    "x": 1400,
    "y": 600,
    "parent": "d2-task1",
    "collapsed": false,
    "color": "#5DADE2"
  },
  {
    "id": "d2-task2",
    "text": "Troubleshoot Monitoring",
    "x": 1200,
    "y": 700,
    "parent": "domain2",
    "collapsed": false,
    "color": "#3498DB"
  },
  {
    "id": "d2-task3",
    "text": "Design Logging Solution",
    "x": 1200,
    "y": 850,
    "parent": "domain2",
    "collapsed": false,
    "color": "#3498DB"
  },
  {
    "id": "d2-t3-k1",
    "text": "VPC Flow Logs & CloudTrail",
    "x": 1400,
    "y": 800,
    "parent": "d2-task3",
    "collapsed": false,
    "color": "#5DADE2"
  },
  {
    "id": "d2-t3-k2",
    "text": "Log Storage & Lifecycle",
    "x": 1400,
    "y": 850,
    "parent": "d2-task3",
    "collapsed": false,
    "color": "#5DADE2"
  },
  {
    "id": "d2-t3-k3",
    "text": "CloudWatch Logs",
    "x": 1400,
    "y": 900,
    "parent": "d2-task3",
    "collapsed": false,
    "color": "#5DADE2"
  },
  {
    "id": "domain3",
    "text": "Domain 3: Infrastructure Security (20%)",
    "x": 600,
    "y": 700,
    "parent": "root",
    "collapsed": false,
    "color": "#16A085"
  },
  {
    "id": "d3-task1",
    "text": "Edge Services Security",
    "x": 350,
    "y": 650,
    "parent": "domain3",
    "collapsed": false,
    "color": "#16A085"
  },
  {
    "id": "d3-t1-k1",
    "text": "AWS WAF & Shield",
    "x": 150,
    "y": 600,
    "parent": "d3-task1",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-t1-k2",
    "text": "CloudFront & Route 53",
    "x": 150,
    "y": 650,
    "parent": "d3-task1",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-t1-k3",
    "text": "OWASP Top 10 & DDoS",
    "x": 150,
    "y": 700,
    "parent": "d3-task1",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-task2",
    "text": "Network Security Controls",
    "x": 350,
    "y": 800,
    "parent": "domain3",
    "collapsed": false,
    "color": "#16A085"
  },
  {
    "id": "d3-t2-k1",
    "text": "Security Groups & NACLs",
    "x": 150,
    "y": 750,
    "parent": "d3-task2",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-t2-k2",
    "text": "AWS Network Firewall",
    "x": 150,
    "y": 800,
    "parent": "d3-task2",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-t2-k3",
    "text": "Transit Gateway & VPC Endpoints",
    "x": 150,
    "y": 850,
    "parent": "d3-task2",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-t2-k4",
    "text": "VPN & Direct Connect",
    "x": 150,
    "y": 900,
    "parent": "d3-task2",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-task3",
    "text": "Compute Security Controls",
    "x": 350,
    "y": 950,
    "parent": "domain3",
    "collapsed": false,
    "color": "#16A085"
  },
  {
    "id": "d3-t3-k1",
    "text": "EC2 AMI Hardening",
    "x": 150,
    "y": 950,
    "parent": "d3-task3",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-t3-k2",
    "text": "Amazon Inspector",
    "x": 150,
    "y": 1000,
    "parent": "d3-task3",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d3-t3-k3",
    "text": "IAM Instance Roles",
    "x": 150,
    "y": 1050,
    "parent": "d3-task3",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "domain4",
    "text": "Domain 4: Identity & Access Management (16%)",
    "x": 250,
    "y": 400,
    "parent": "root",
    "collapsed": false,
    "color": "#8E44AD"
  },
  {
    "id": "d4-task1",
    "text": "Design Authentication",
    "x": 50,
    "y": 300,
    "parent": "domain4",
    "collapsed": false,
    "color": "#8E44AD"
  },
  {
    "id": "d4-t1-k1",
    "text": "IAM Identity Center (SSO)",
    "x": -150,
    "y": 250,
    "parent": "d4-task1",
    "collapsed": false,
    "color": "#AF7AC5"
  },
  {
    "id": "d4-t1-k2",
    "text": "Amazon Cognito",
    "x": -150,
    "y": 300,
    "parent": "d4-task1",
    "collapsed": false,
    "color": "#AF7AC5"
  },
  {
    "id": "d4-t1-k3",
    "text": "MFA & STS Temporary Credentials",
    "x": -150,
    "y": 350,
    "parent": "d4-task1",
    "collapsed": false,
    "color": "#AF7AC5"
  },
  {
    "id": "d4-task2",
    "text": "Design Authorization",
    "x": 50,
    "y": 450,
    "parent": "domain4",
    "collapsed": false,
    "color": "#8E44AD"
  },
  {
    "id": "d4-t2-k1",
    "text": "IAM Policy Types",
    "x": -150,
    "y": 400,
    "parent": "d4-task2",
    "collapsed": false,
    "color": "#AF7AC5"
  },
  {
    "id": "d4-t2-k2",
    "text": "RBAC & ABAC Strategies",
    "x": -150,
    "y": 450,
    "parent": "d4-task2",
    "collapsed": false,
    "color": "#AF7AC5"
  },
  {
    "id": "d4-t2-k3",
    "text": "Principle of Least Privilege",
    "x": -150,
    "y": 500,
    "parent": "d4-task2",
    "collapsed": false,
    "color": "#AF7AC5"
  },
  {
    "id": "d4-t2-k4",
    "text": "IAM Policy Simulator",
    "x": -150,
    "y": 550,
    "parent": "d4-task2",
    "collapsed": false,
    "color": "#AF7AC5"
  },
  {
    "id": "domain5",
    "text": "Domain 5: Data Protection (18%)",
    "x": 300,
    "y": 150,
    "parent": "root",
    "collapsed": false,
    "color": "#E67E22"
  },
  {
    "id": "d5-task1",
    "text": "Data in Transit Protection",
    "x": 50,
    "y": 50,
    "parent": "domain5",
    "collapsed": false,
    "color": "#E67E22"
  },
  {
    "id": "d5-t1-k1",
    "text": "TLS & VPN Concepts",
    "x": -150,
    "y": 0,
    "parent": "d5-task1",
    "collapsed": false,
    "color": "#F39C12"
  },
  {
    "id": "d5-t1-k2",
    "text": "Session Manager",
    "x": -150,
    "y": 50,
    "parent": "d5-task1",
    "collapsed": false,
    "color": "#F39C12"
  },
  {
    "id": "d5-t1-k3",
    "text": "Certificate Management",
    "x": -150,
    "y": 100,
    "parent": "d5-task1",
    "collapsed": false,
    "color": "#F39C12"
  },
  {
    "id": "d5-task2",
    "text": "Data at Rest Protection",
    "x": 50,
    "y": 200,
    "parent": "domain5",
    "collapsed": false,
    "color": "#E67E22"
  },
  {
    "id": "d5-t2-k1",
    "text": "Server-Side & Client-Side Encryption",
    "x": -200,
    "y": 150,
    "parent": "d5-task2",
    "collapsed": false,
    "color": "#F39C12"
  },
  {
    "id": "d5-t2-k2",
    "text": "AWS KMS & CloudHSM",
    "x": -200,
    "y": 200,
    "parent": "d5-task2",
    "collapsed": false,
    "color": "#F39C12"
  },
  {
    "id": "d5-t2-k3",
    "text": "S3 Block Public Access",
    "x": -200,
    "y": 250,
    "parent": "d5-task2",
    "collapsed": false,
    "color": "#F39C12"
  },
  {
    "id": "domain6",
    "text": "Domain 6: Management & Security Governance (14%)",
    "x": 600,
    "y": 100,
    "parent": "root",
    "collapsed": false,
    "color": "#1ABC9C"
  },
  {
    "id": "d6-task1",
    "text": "Centralize Account Management",
    "x": 850,
    "y": 0,
    "parent": "domain6",
    "collapsed": false,
    "color": "#1ABC9C"
  },
  {
    "id": "d6-t1-k1",
    "text": "AWS Organizations",
    "x": 1050,
    "y": -50,
    "parent": "d6-task1",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d6-t1-k2",
    "text": "AWS Control Tower",
    "x": 1050,
    "y": 0,
    "parent": "d6-task1",
    "collapsed": false,
    "color": "#48C9B0"
  },
  {
    "id": "d6-t1-k3",
    "text": "Service Control Policies",
    "x": 1050,
    "y": 50,
    "parent": "d6-task1",
    "collapsed": false,
    "color": "#48C9B0"
  }
];

export const demoLinks: Link[] = [
  {"source": "root", "target": "domain1"},
  {"source": "root", "target": "domain2"},
  {"source": "root", "target": "domain3"},
  {"source": "root", "target": "domain4"},
  {"source": "root", "target": "domain5"},
  {"source": "root", "target": "domain6"},
  {"source": "domain1", "target": "d1-task1"},
  {"source": "domain1", "target": "d1-task2"},
  {"source": "domain1", "target": "d1-task3"},
  {"source": "d1-task1", "target": "d1-t1-k1"},
  {"source": "d1-task1", "target": "d1-t1-k2"},
  {"source": "d1-task1", "target": "d1-t1-k3"},
  {"source": "d1-task2", "target": "d1-t2-k1"},
  {"source": "d1-task2", "target": "d1-t2-k2"},
  {"source": "d1-task2", "target": "d1-t2-k3"},
  {"source": "d1-task3", "target": "d1-t3-k1"},
  {"source": "d1-task3", "target": "d1-t3-k2"},
  {"source": "d1-task3", "target": "d1-t3-k3"},
  {"source": "domain2", "target": "d2-task1"},
  {"source": "domain2", "target": "d2-task2"},
  {"source": "domain2", "target": "d2-task3"},
  {"source": "d2-task1", "target": "d2-t1-k1"},
  {"source": "d2-task1", "target": "d2-t1-k2"},
  {"source": "d2-task1", "target": "d2-t1-k3"},
  {"source": "d2-task3", "target": "d2-t3-k1"},
  {"source": "d2-task3", "target": "d2-t3-k2"},
  {"source": "d2-task3", "target": "d2-t3-k3"},
  {"source": "domain3", "target": "d3-task1"},
  {"source": "domain3", "target": "d3-task2"},
  {"source": "domain3", "target": "d3-task3"},
  {"source": "d3-task1", "target": "d3-t1-k1"},
  {"source": "d3-task1", "target": "d3-t1-k2"},
  {"source": "d3-task1", "target": "d3-t1-k3"},
  {"source": "d3-task2", "target": "d3-t2-k1"},
  {"source": "d3-task2", "target": "d3-t2-k2"},
  {"source": "d3-task2", "target": "d3-t2-k3"},
  {"source": "d3-task2", "target": "d3-t2-k4"},
  {"source": "d3-task3", "target": "d3-t3-k1"},
  {"source": "d3-task3", "target": "d3-t3-k2"},
  {"source": "d3-task3", "target": "d3-t3-k3"},
  {"source": "domain4", "target": "d4-task1"},
  {"source": "domain4", "target": "d4-task2"},
  {"source": "d4-task1", "target": "d4-t1-k1"},
  {"source": "d4-task1", "target": "d4-t1-k2"},
  {"source": "d4-task1", "target": "d4-t1-k3"},
  {"source": "d4-task2", "target": "d4-t2-k1"},
  {"source": "d4-task2", "target": "d4-t2-k2"},
  {"source": "d4-task2", "target": "d4-t2-k3"},
  {"source": "d4-task2", "target": "d4-t2-k4"},
  {"source": "domain5", "target": "d5-task1"},
  {"source": "domain5", "target": "d5-task2"},
  {"source": "d5-task1", "target": "d5-t1-k1"},
  {"source": "d5-task1", "target": "d5-t1-k2"},
  {"source": "d5-task1", "target": "d5-t1-k3"},
  {"source": "d5-task2", "target": "d5-t2-k1"},
  {"source": "d5-task2", "target": "d5-t2-k2"},
  {"source": "d5-task2", "target": "d5-t2-k3"},
  {"source": "domain6", "target": "d6-task1"},
  {"source": "d6-task1", "target": "d6-t1-k1"},
  {"source": "d6-task1", "target": "d6-t1-k2"},
  {"source": "d6-task1", "target": "d6-t1-k3"}
];