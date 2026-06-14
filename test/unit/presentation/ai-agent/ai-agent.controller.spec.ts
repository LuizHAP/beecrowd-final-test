import { AiAgentController } from '@/ai-agent/ai-agent.controller';

describe('AiAgentController', () => {
  let controller: AiAgentController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      process: jest.fn(),
      getLogs: jest.fn(),
    };
    controller = new AiAgentController(mockService);
  });

  describe('chat', () => {
    it('returns error when message is missing', async () => {
      const result = await controller.chat({ message: '' as any });
      expect(result.response).toBe('Message is required');
      expect(result.log).toBeNull();
    });

    it('returns error when message is not a string', async () => {
      const result = await controller.chat({ message: 123 as any });
      expect(result.response).toBe('Message is required');
      expect(result.log).toBeNull();
    });

    it('delegates to aiService.process with message only', async () => {
      const mockResult = { response: 'Hello!', log: { intent: 'GENERAL_HELP' } };
      mockService.process.mockResolvedValue(mockResult);

      const result = await controller.chat({ message: 'Hello' });

      expect(mockService.process).toHaveBeenCalledWith('Hello', undefined);
      expect(result).toEqual(mockResult);
    });

    it('delegates to aiService.process with message and orderId', async () => {
      const mockResult = { response: 'Order status: PENDING', log: { intent: 'CHECK_STATUS' } };
      mockService.process.mockResolvedValue(mockResult);

      const result = await controller.chat({ message: 'Status?', orderId: 'order-1' });

      expect(mockService.process).toHaveBeenCalledWith('Status?', 'order-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getLogs', () => {
    it('returns logs with default limit', async () => {
      const mockLogs: Array<{ id: string; intent: string }> = [{ id: 'log-1', intent: 'GENERAL_HELP' }];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs();

      expect(mockService.getLogs).toHaveBeenCalledWith(50, undefined, undefined);
      expect(result).toEqual({ logs: mockLogs });
    });

    it('returns logs with custom limit', async () => {
      const mockLogs: Array<{ id: string; intent: string }> = [{ id: 'log-1', intent: 'GENERAL_HELP' }];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs('10');

      expect(mockService.getLogs).toHaveBeenCalledWith(10, undefined, undefined);
      expect(result).toEqual({ logs: mockLogs });
    });

    it('filters by intent', async () => {
      const mockLogs: Array<{ id: string; intent: string }> = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs(undefined, 'CANCEL_ORDER');

      expect(mockService.getLogs).toHaveBeenCalledWith(50, 'CANCEL_ORDER', undefined);
      expect(result).toEqual({ logs: mockLogs });
    });

    it('filters by injection true', async () => {
      const mockLogs: Array<{ id: string; intent: string }> = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs(undefined, undefined, 'true');

      expect(mockService.getLogs).toHaveBeenCalledWith(50, undefined, true);
      expect(result).toEqual({ logs: mockLogs });
    });

    it('filters by injection false', async () => {
      const mockLogs: Array<{ id: string; intent: string }> = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs(undefined, undefined, 'false');

      expect(mockService.getLogs).toHaveBeenCalledWith(50, undefined, false);
      expect(result).toEqual({ logs: mockLogs });
    });

    it('passes undefined for injection when not provided', async () => {
      const mockLogs: Array<{ id: string; intent: string }> = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs();

      expect(mockService.getLogs).toHaveBeenCalledWith(50, undefined, undefined);
      expect(result).toEqual({ logs: mockLogs });
    });
  });
});
