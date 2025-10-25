import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { MindMapProvider } from '../context/MindMapContext';

interface AllTheProvidersProps {
  children: ReactNode;
}

export const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <MindMapProvider>{children}</MindMapProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };