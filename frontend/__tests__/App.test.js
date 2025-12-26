import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

// Mock the components to isolate App testing
jest.mock('../src/components/NotaryForm', () => {
  return function MockNotaryForm() {
    return <div data-testid="notary-form">NotaryForm Component</div>;
  };
});

jest.mock('../src/components/NotarizeWithContract', () => {
  return function MockNotarizeWithContract() {
    return <div data-testid="notarize-contract">NotarizeWithContract Component</div>;
  };
});

jest.mock('../src/components/VerifyPage', () => {
  return function MockVerifyPage() {
    return <div data-testid="verify-page">VerifyPage Component</div>;
  };
});

describe('App Component', () => {
  it('should render the main application structure', () => {
    render(<App />);

    // Check main container
    const appDiv = screen.getByRole('generic', { hidden: true });
    expect(appDiv).toHaveClass('app');
  });

  it('should render the header with title and description', () => {
    render(<App />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Decentralized Digital Notary');

    const description = screen.getByText('Hash a file locally and notarize on Stacks (Bitcoin L2).');
    expect(description).toBeInTheDocument();
  });

  it('should render the main content area', () => {
    render(<App />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('should render all three main sections', () => {
    render(<App />);

    // Check for three sections
    const sections = screen.getAllByRole('generic', { hidden: true }).filter(
      element => element.tagName === 'SECTION'
    );
    expect(sections).toHaveLength(3);
  });

  it('should render the Quick Notarize section with NotaryForm', () => {
    render(<App />);

    const quickSection = screen.getByRole('heading', { level: 2, name: 'Quick notarize (wallet memo)' });
    expect(quickSection).toBeInTheDocument();

    const notaryForm = screen.getByTestId('notary-form');
    expect(notaryForm).toBeInTheDocument();
    expect(notaryForm).toHaveTextContent('NotaryForm Component');
  });

  it('should render the Contract Notarize section with NotarizeWithContract', () => {
    render(<App />);

    const contractSection = screen.getByRole('heading', { level: 2, name: 'Notarize with contract' });
    expect(contractSection).toBeInTheDocument();

    const notarizeContract = screen.getByTestId('notarize-contract');
    expect(notarizeContract).toBeInTheDocument();
    expect(notarizeContract).toHaveTextContent('NotarizeWithContract Component');
  });

  it('should render the Verify section with VerifyPage', () => {
    render(<App />);

    const verifySection = screen.getByRole('heading', { level: 2, name: 'Verify a document / hash' });
    expect(verifySection).toBeInTheDocument();

    const verifyPage = screen.getByTestId('verify-page');
    expect(verifyPage).toBeInTheDocument();
    expect(verifyPage).toHaveTextContent('VerifyPage Component');
  });

  it('should apply proper spacing between sections', () => {
    render(<App />);

    const sections = screen.getAllByRole('generic', { hidden: true }).filter(
      element => element.tagName === 'SECTION'
    );

    // First two sections should have marginBottom
    expect(sections[0]).toHaveStyle({ marginBottom: '24px' });
    expect(sections[1]).toHaveStyle({ marginBottom: '24px' });
    // Third section should not have bottom margin
    expect(sections[2]).not.toHaveStyle({ marginBottom: '24px' });
  });

  it('should have proper semantic structure', () => {
    render(<App />);

    // Should have header, main, and sections
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Should have proper heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2s = screen.getAllByRole('heading', { level: 2 });

    expect(h1).toBeInTheDocument();
    expect(h2s).toHaveLength(3);
  });

  it('should render all components without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('should maintain component isolation', () => {
    render(<App />);

    // Each component should be rendered separately
    expect(screen.getByTestId('notary-form')).toBeInTheDocument();
    expect(screen.getByTestId('notarize-contract')).toBeInTheDocument();
    expect(screen.getByTestId('verify-page')).toBeInTheDocument();

    // Components should not interfere with each other
    expect(screen.getAllByTestId(/notary-form|notarize-contract|verify-page/)).toHaveLength(3);
  });
});
