export default function VercelTestPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#0f0',
      fontFamily: 'monospace',
      fontSize: '24px',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1>✅ HRMS Vercel Deployment OK</h1>
      <p style={{ fontSize: '16px', marginTop: '20px', color: '#888' }}>
        This is a minimal test route to verify Vercel deployment is working.
      </p>
      <p style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
        Route: /vercel-test
      </p>
      <p style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
        Time: {new Date().toISOString()}
      </p>
    </div>
  );
}
