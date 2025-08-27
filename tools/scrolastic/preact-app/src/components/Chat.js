import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { memo } from 'preact/compat';
import { marked } from 'marked';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { signOut } from '../services/auth';
import { auth } from '../services/firebase';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';
import AttachmentCodePage from './AttachmentCodePage';
import Snackbar from '@mui/material/Snackbar';

const drawerWidth = 240;

const ChatView = memo(({ messages, messageContainerRef }) => (
  <Box ref={messageContainerRef} sx={{ flex: 1, overflowY: 'auto', p: 2, height: 'calc(100% - 70px)' }}>
    {messages.map((message, index) => (
      <Paper
        key={index}
        sx={{
          p: 2,
          mb: 2,
          bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
          color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Typography variant="body1" dangerouslySetInnerHTML={{ __html: marked(`<strong>${message.sender}:</strong> ${message.text}`) }} />
      </Paper>
    ))}
  </Box>
));

const Chat = ({ chatService, style, chatTitle }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' or 'attachmentCode'
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messageContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const user = auth.currentUser;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handlePaste = (e) => {
    e.preventDefault();
    setSnackbarMessage('Pasting is not permitted... sorry please type your response');
    setSnackbarOpen(true);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut();
    handleClose();
  };

  const appendMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  useEffect(() => {
    chatService.getConversations().then(response => {
        setConversations(response.conversations);
        if (response.conversations.length > 0) {
            setSelectedConversation(response.conversations[response.conversations.length - 1]);
        }
    });
  }, [chatService]);

  useEffect(() => {
    if (selectedConversation) {
      setView('chat');
      chatService.getConversationHistory(selectedConversation.id).then(response => {
        setMessages(response.messages);
      });
    } else {
      setMessages([]);
    }
  }, [selectedConversation, chatService]);

  useEffect(() => {
    if (messageContainerRef.current) {
        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const messageText = newMessage;
    if (messageText.trim() === '') return;

    const userMessage = {
      text: messageText,
      sender: 'user',
    };
    appendMessage(userMessage);
    setNewMessage('');

    const handleResponse = (response) => {
        const botMessage = { text: response.message, sender: 'bot' };
        appendMessage(botMessage);
    };

    const handleError = (error) => {
        const botMessage = { text: `Message from server: ${error.message} please include this when contacting your admin/professor about this issue.`, sender: 'bot' };
        appendMessage(botMessage);
    };

    if (selectedConversation) {
        chatService.continueConversation(selectedConversation.id, messageText, messages)
            .then(handleResponse)
            .catch(handleError);
    } else {
        chatService.newConversation(messageText, messages)
            .then(response => {
                const newConvo = { id: response.conversationId, title: response.title };
                setSelectedConversation(newConvo);
                setConversations(prevConversations => [...prevConversations, newConvo]);
                handleResponse(response);
            })
            .catch(handleError);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const parseStyle = (styleStr) => {
    if (!styleStr) return {};
    return styleStr.split(';').reduce((acc, style) => {
      const [key, value] = style.split(':');
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {});
  };

  const containerStyle = {
    display: 'flex',
    height: '100vh',
    width: '100%',
    ...parseStyle(style),
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={containerStyle}>
        <AppBar position="absolute">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {chatTitle || 'Chat'}
            </Typography>
            {user && (
              <div>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar alt={user.displayName} src={user.photoURL} />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </div>
            )}
          </Toolbar>
        </AppBar>
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
        >
          <Box sx={{ width: drawerWidth }}>
            <List>
              <ListItem button onClick={() => {
                setSelectedConversation(null);
                setView('chat');
                setDrawerOpen(false);
              }}>
                <ListItemText primary="New Conversation" />
              </ListItem>
            </List>
            <Divider />
            <Typography variant="h6" sx={{ padding: 2 }}>Active Conversations</Typography>
            <List>
              {conversations.map(convo => (
                <ListItem button key={convo.id} onClick={() => {
                  setSelectedConversation(convo);
                  setView('chat');
                  setDrawerOpen(false);
                }} selected={selectedConversation?.id === convo.id}>
                  <ListItemText primary={convo.title} />
                </ListItem>
              ))}
            </List>
            <Divider />
            <List>
              <ListItem button onClick={() => {
                setView('attachmentCode');
                setDrawerOpen(false);
              }}>
                <ListItemText primary="Get Attachment Code" />
              </ListItem>
            </List>
          </Box>
        </Drawer>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 3, marginTop: '64px', height: 'calc(100% - 64px)', overflow: 'hidden' }}
        >
          {view === 'chat' ? <ChatView messages={messages} messageContainerRef={messageContainerRef} /> : <AttachmentCodePage chatService={chatService} conversationId={selectedConversation?.id} />}
          {view === 'chat' && (
            <form onSubmit={handleSendMessage} onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSendMessage(e);
                }
              }} style={{ display: 'flex', alignItems: 'center', marginTop: '1em' }}>
              <TextField
                fullWidth
                multiline
                inputRef={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onPaste={handlePaste}
                placeholder="Type your message..."
                variant="outlined"
              />
              <IconButton type="submit">
                <SendIcon />
              </IconButton>
            </form>
          )}
        </Box>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </ThemeProvider>
  );
};

export default Chat;
