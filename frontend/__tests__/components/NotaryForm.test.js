import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotaryForm from '../../src/components/NotaryForm';

// Mock the external dependencies
jest.mock('js-sha256', () => ({
  sha256: jest.fn().mockReturnValue('mocked-hash-value')
}));

jest.mock('@stacks/connect', () => ({
  showConnect: jest.fn(),
  makeSTXTokenTransfer: jest.fn()
}));

// Mock global alert
global.alert = jest.fn();

describe('NotaryForm Component', () => {
  const mockShowConnect = require('@stacks/connect').showConnect;
  const mockMakeSTXTokenTransfer = require('@stacks/connect').makeSTXTokenTransfer;
  const mockSha256 = require('js-sha256').sha256;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default behavior
    mockShowConnect.mockResolvedValue({});
    mockMakeSTXTokenTransfer.mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should render the form structure', () => {
      render(<NotaryForm />);

      const notaryDiv = screen.getByRole('generic', { hidden: true });
      expect(notaryDiv).toHaveClass('notary');
    });

    it('should render file input', () => {
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox'); // File inputs are rendered as textboxes in some test environments
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('should render notarize button as disabled initially', () => {
      render(<NotaryForm />);

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      expect(button).toBeDisabled();
    });

    it('should not display file name or hash initially', () => {
      render(<NotaryForm />);

      expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SHA-256:/)).not.toBeInTheDocument();
    });

    it('should render status area', () => {
      render(<NotaryForm />);

      const statusDiv = screen.getByRole('generic', { hidden: true });
      expect(statusDiv).toHaveClass('status');
      expect(statusDiv).toBeEmptyDOMElement();
    });
  });

  describe('File Selection and Hashing', () => {
    it('should handle file selection and display file name', async () => {
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });

      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('Selected: test-document.pdf')).toBeInTheDocument();
      });
    });

    it('should compute SHA-256 hash when file is selected', async () => {
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['test content'], 'document.txt');

      // Mock arrayBuffer and Uint8Array
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(8));
      global.Uint8Array = jest.fn().mockImplementation((buffer) => ({
        buffer,
        byteLength: 8
      }));

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(mockFile.arrayBuffer).toHaveBeenCalled();
        expect(mockSha256).toHaveBeenCalled();
        expect(screen.getByText('SHA-256: mocked-hash-value')).toBeInTheDocument();
      });
    });

    it('should enable notarize button after file selection', async () => {
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['content'], 'file.txt');

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
        expect(button).not.toBeDisabled();
      });
    });

    it('should handle file selection errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['content'], 'file.txt');

      // Mock arrayBuffer to throw an error
      mockFile.arrayBuffer = jest.fn().mockRejectedValue(new Error('File read error'));

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle empty file selection', () => {
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');

      // Simulate empty file selection
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/SHA-256:/)).not.toBeInTheDocument();
    });

    it('should handle multiple file selections (use first file)', async () => {
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      const mockFiles = [
        new File(['content1'], 'file1.txt'),
        new File(['content2'], 'file2.txt')
      ];

      fireEvent.change(fileInput, { target: { files: mockFiles } });

      await waitFor(() => {
        expect(screen.getByText('Selected: file1.txt')).toBeInTheDocument();
      });
    });
  });

  describe('Notarization Process', () => {
    beforeEach(async () => {
      // Set up a file first
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['content'], 'document.pdf');

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('SHA-256: mocked-hash-value')).toBeInTheDocument();
      });
    });

    it('should prevent notarization without file selection', () => {
      // Test with no file selected
      const { rerender } = render(<NotaryForm />);

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      expect(button).toBeDisabled();

      // Should not call alert when disabled button is somehow clicked
      fireEvent.click(button);
      expect(global.alert).not.toHaveBeenCalled();
    });

    it('should initiate wallet connection on notarize button click', async () => {
      const user = userEvent.setup();

      mockShowConnect.mockResolvedValue({ userSession: {} });

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      expect(mockShowConnect).toHaveBeenCalledWith({
        appName: 'Decentralized Notary',
        manifestPath: '/manifest.json'
      });
    });

    it('should update status during wallet connection', async () => {
      const user = userEvent.setup();

      mockShowConnect.mockImplementation(() => new Promise(() => {})); // Never resolves

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Opening wallet...')).toBeInTheDocument();
      });
    });

    it('should proceed to transaction after wallet connection', async () => {
      const user = userEvent.setup();

      mockShowConnect.mockResolvedValue({ userSession: {} });

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(mockMakeSTXTokenTransfer).toHaveBeenCalledWith({
          recipient: 'SP000000000000000000002Q6VF78',
          amount: '0',
          memo: 'mocked-hash-value',
          onFinish: expect.any(Function),
          onCancel: expect.any(Function)
        });
      });
    });

    it('should update status during transaction', async () => {
      const user = userEvent.setup();

      mockShowConnect.mockResolvedValue({ userSession: {} });
      mockMakeSTXTokenTransfer.mockImplementation(() => new Promise(() => {}));

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Requesting signature...')).toBeInTheDocument();
      });
    });

    it('should handle successful transaction completion', async () => {
      const user = userEvent.setup();
      const mockTxId = '0x1234567890abcdef';

      mockShowConnect.mockResolvedValue({ userSession: {} });
      mockMakeSTXTokenTransfer.mockImplementation(({ onFinish }) => {
        onFinish({ txId: mockTxId });
      });

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(`Submitted: ${mockTxId}`)).toBeInTheDocument();
      });
    });

    it('should display transaction link after successful submission', async () => {
      const user = userEvent.setup();
      const mockTxId = '0xabcdef1234567890';

      mockShowConnect.mockResolvedValue({ userSession: {} });
      mockMakeSTXTokenTransfer.mockImplementation(({ onFinish }) => {
        onFinish({ txId: mockTxId });
      });

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /View transaction on Hiro Explorer/ });
        expect(link).toHaveAttribute('href', `https://explorer.hiro.so/txid/${mockTxId}?network=mainnet`);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
      });
    });

    it('should store transaction ID in state', async () => {
      const user = userEvent.setup();
      const mockTxId = '0x987654321fedcba';

      mockShowConnect.mockResolvedValue({ userSession: {} });
      mockMakeSTXTokenTransfer.mockImplementation(({ onFinish }) => {
        onFinish({ txId: mockTxId });
      });

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      // Transaction ID should be stored (though we can't directly test state)
      await waitFor(() => {
        expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining(mockTxId));
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      // Set up a file first
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['content'], 'document.pdf');

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('SHA-256: mocked-hash-value')).toBeInTheDocument();
      });
    });

    it('should handle wallet connection cancellation', async () => {
      const user = userEvent.setup();

      mockShowConnect.mockResolvedValue({ userSession: {} });
      mockMakeSTXTokenTransfer.mockImplementation(({ onCancel }) => {
        onCancel();
      });

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('User cancelled')).toBeInTheDocument();
      });
    });

    it('should handle wallet connection errors', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockShowConnect.mockRejectedValue(new Error('Wallet connection failed'));

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      expect(global.alert).toHaveBeenCalledWith('Please select a file first');
      expect(consoleSpy).not.toHaveBeenCalled(); // Alert is shown instead

      consoleSpy.mockRestore();
    });

    it('should handle transaction errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorMessage = 'Transaction failed';

      mockShowConnect.mockResolvedValue({ userSession: {} });
      mockMakeSTXTokenTransfer.mockRejectedValue(new Error(errorMessage));

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle generic errors', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockShowConnect.mockRejectedValue('String error');

      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Error: String error')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith('String error');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('UI State Management', () => {
    it('should clear previous status messages', async () => {
      const user = userEvent.setup();

      // First attempt - error
      mockShowConnect.mockRejectedValueOnce(new Error('First error'));

      render(<NotaryForm />);

      // Set up file
      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['content'], 'document.pdf');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('SHA-256: mocked-hash-value')).toBeInTheDocument();
      });

      // First attempt
      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Error: First error')).toBeInTheDocument();
      });

      // Second attempt - success
      mockShowConnect.mockResolvedValueOnce({ userSession: {} });
      mockMakeSTXTokenTransfer.mockImplementationOnce(({ onFinish }) => {
        onFinish({ txId: '0x123' });
      });

      await user.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Error: First error')).not.toBeInTheDocument();
        expect(screen.getByText('Submitted: 0x123')).toBeInTheDocument();
      });
    });

    it('should maintain file selection across operations', async () => {
      const user = userEvent.setup();

      render(<NotaryForm />);

      // Select file
      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['content'], 'document.pdf');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('Selected: document.pdf')).toBeInTheDocument();
        expect(screen.getByText('SHA-256: mocked-hash-value')).toBeInTheDocument();
      });

      // Attempt notarization (will fail)
      mockShowConnect.mockRejectedValue(new Error('Connection failed'));
      const button = screen.getByRole('button', { name: 'Notarize via wallet (memo)' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Error: Connection failed')).toBeInTheDocument();
      });

      // File selection should still be visible
      expect(screen.getByText('Selected: document.pdf')).toBeInTheDocument();
      expect(screen.getByText('SHA-256: mocked-hash-value')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      expect(fileInput).toHaveAttribute('type', 'file');

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Notarize via wallet (memo)');
    });

    it('should provide feedback for disabled state', () => {
      render(<NotaryForm />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Notarize via wallet (memo)');
    });

    it('should display status information accessibly', async () => {
      const user = userEvent.setup();

      render(<NotaryForm />);

      // Set up file and attempt notarization
      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['content'], 'document.pdf');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('SHA-256: mocked-hash-value')).toBeInTheDocument();
      });

      mockShowConnect.mockRejectedValue(new Error('Test error'));
      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        const statusDiv = screen.getByRole('generic', { hidden: true });
        expect(statusDiv).toHaveClass('status');
        expect(statusDiv).toHaveTextContent('Error: Test error');
      });
    });
  });

  describe('Integration with External Libraries', () => {
    it('should use js-sha256 for hashing', async () => {
      render(<NotaryForm />);

      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['test data'], 'file.txt');

      mockFile.arrayBuffer = jest.fn().mockResolvedValue(
        new Uint8Array([116, 101, 115, 116, 32, 100, 97, 116, 97]).buffer
      );

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(mockSha256).toHaveBeenCalled();
      });
    });

    it('should integrate with Stacks Connect properly', async () => {
      const user = userEvent.setup();

      render(<NotaryForm />);

      // Set up file
      const fileInput = screen.getByRole('textbox');
      const mockFile = new File(['content'], 'document.pdf');
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(screen.getByText('SHA-256: mocked-hash-value')).toBeInTheDocument();
      });

      // Attempt notarization
      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockShowConnect).toHaveBeenCalled();
      expect(mockMakeSTXTokenTransfer).toHaveBeenCalled();
    });
  });
});
