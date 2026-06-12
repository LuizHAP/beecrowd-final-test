import { startBackgroundJob } from '@/lib/background-job';

// Start background job on server startup
startBackgroundJob();

export default function Home() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>E-Commerce AI Support</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>
        API endpoints available at:
      </p>
      <ul style={{ fontFamily: 'monospace', fontSize: 14 }}>
        <li><code>POST /api/orders</code> — Create order</li>
        <li><code>GET /api/orders</code> — List orders (optional ?status=)</li>
        <li><code>GET /api/orders/:id</code> — Get order details</li>
        <li><code>DELETE /api/orders/:id</code> — Cancel order</li>
        <li><code>POST /api/ai/chat</code> — AI support agent</li>
        <li><code>GET /api/ai/logs</code> — AI observability logs</li>
        <li><code>GET /api/health</code> — Health check</li>
      </ul>
    </main>
  );
}
