const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// In-memory ledger of security events
const auditLogs = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    event_type: 'SYSTEM_START',
    username: 'system',
    ip_address: '127.0.0.1',
    status: 'SUCCESS',
    description: 'Audit log microservice initialized successfully.'
  }
];

let logIdCounter = 2;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', service: 'Node.js Security Audit & Notification Service' });
});

// Write to Audit Log
app.post('/api/audit-log', (req, res) => {
  const { event_type, username, ip_address, status, description } = req.body;

  if (!event_type || !username) {
    return res.status(400).json({ error: 'Missing required audit parameters (event_type, username).' });
  }

  const logEntry = {
    id: logIdCounter++,
    timestamp: new Date().toISOString(),
    event_type,
    username,
    ip_address: ip_address || req.ip || 'unknown',
    status: status || 'INFO',
    description: description || ''
  };

  auditLogs.push(logEntry);
  
  // Keep logs at a reasonable size
  if (auditLogs.length > 500) {
    auditLogs.shift();
  }

  console.log(`[AUDIT LOG] [${logEntry.status}] ${logEntry.event_type} - User: ${logEntry.username} - ${logEntry.description}`);
  res.status(201).json({ message: 'Audit entry added', entry: logEntry });
});

// Fetch Audit Logs (Admin only - verified via Django token check in frontend/backend)
app.get('/api/audit-logs', (req, res) => {
  // Sort logs by timestamp descending
  const sortedLogs = [...auditLogs].reverse();
  res.json(sortedLogs);
});

// Dispatch OTP / Notifications (Cross-service demonstration)
app.post('/api/dispatch-notification', (req, res) => {
  const { method, recipient, code, type } = req.body;

  if (!method || !recipient || !code) {
    return res.status(400).json({ error: 'Missing notification details (method, recipient, code).' });
  }

  console.log('\n==================================================');
  console.log(`>>> [DISPATCHING OTP] Method: ${method.toUpperCase()} | Type: ${type || 'PASSWORD_RECOVERY'}`);
  console.log(`>>> To: ${recipient}`);
  console.log(`>>> Security Code: [ ${code} ]`);
  console.log(`>>> Message: "Your verification code is ${code}. It expires in 10 minutes."`);
  console.log('==================================================\n');

  // Push to audit log
  const logEntry = {
    id: logIdCounter++,
    timestamp: new Date().toISOString(),
    event_type: `OTP_DISPATCH_${method.toUpperCase()}`,
    username: recipient,
    ip_address: req.ip || '127.0.0.1',
    status: 'SUCCESS',
    description: `Dispatched ${type || 'OTP'} code to ${recipient} via Node.js microservice.`
  };
  auditLogs.push(logEntry);

  res.json({ success: true, message: `Notification dispatched successfully to ${recipient}.` });
});

app.listen(PORT, () => {
  console.log(`Node.js microservice is running on http://localhost:${PORT}`);
});
