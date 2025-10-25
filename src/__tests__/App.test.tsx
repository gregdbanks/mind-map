import { render, waitFor } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('should render without crashing', async () => {
    const { container } = render(<App />);
    expect(container.querySelector('.App')).toBeInTheDocument();
    
    // Wait for the canvas to load (it might show loading state initially)
    await waitFor(() => {
      const canvas = container.querySelector('svg') || container.querySelector('div');
      expect(canvas).toBeInTheDocument();
    });
  });
});