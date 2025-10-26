// Mock for @gbdev20053/simple-comp-ui to handle CI environment
// This resolves the "Cannot find module" error in GitHub Actions

const React = require('react');

const MindMap = ({ data }) => (
  React.createElement('div', { 'data-testid': 'mind-map-component' }, [
    React.createElement('div', { 
      'data-testid': 'nodes-count', 
      key: 'nodes' 
    }, data?.nodes?.length || 0),
    React.createElement('div', { 
      'data-testid': 'links-count', 
      key: 'links' 
    }, data?.links?.length || 0)
  ])
);

module.exports = {
  MindMap,
  default: { MindMap }
};