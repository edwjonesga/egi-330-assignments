import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinearProgress from '@mui/material/LinearProgress';

const FIVE_MINUTES = 5 * 60;

const AttachmentCodePage = ({ chatService }) => {
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(FIVE_MINUTES);

  const fetchCode = () => {
    setLoading(true);
    setError(null);
    chatService.getAttachmentCode()
      .then(response => {
        setCode(response.code);
        setTimeLeft(FIVE_MINUTES);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCode();
  }, [chatService]);

  useEffect(() => {
    if (timeLeft > 0 && code) {
      const timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const obfuscatedCode = code ? `${code.substring(0, 8)}...${code.substring(code.length - 8)}` : '';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / FIVE_MINUTES) * 100;

  return (
    <Box sx={{ p: 3, color: 'text.primary' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>Get Attachment Code</Typography>
        <Button variant="outlined" onClick={fetchCode} startIcon={<RefreshIcon />} disabled={loading}>
          Refresh
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {code && (
        <Box>
          <Typography variant="body1" gutterBottom>
            This code authorizes the bearer to upload attachments as you. It expires after 5 minutes or a single use. Please protect it.
          </Typography>
          {timeLeft > 0 ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2 }}>
                <Typography variant="h6" component="pre" sx={{ fontFamily: 'monospace', bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                  {obfuscatedCode}
                </Typography>
                <Button variant="contained" onClick={handleCopy} startIcon={<ContentCopyIcon />}>
                  Copy
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress variant="determinate" value={progress} sx={{ width: '100%' }} />
                <Typography variant="body2" color="text.secondary">{`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="h6" color="error" sx={{ my: 2 }}>
              Attachment code has expired. Please refresh to get a new one.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AttachmentCodePage;
