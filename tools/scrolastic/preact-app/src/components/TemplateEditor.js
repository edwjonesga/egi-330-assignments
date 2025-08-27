import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import { signOut } from '../services/auth';
import { auth } from '../services/firebase';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';
import { templateService } from '../services/templates';
import DocumentationPanel from './DocumentationPanel';

const drawerWidth = 240;

const TemplateEditor = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const user = auth.currentUser;

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

  useEffect(() => {
    templateService.getTemplates().then(setTemplates);
  }, []);

  useEffect(() => {
    const templateId = templateService.getTemplateFromUrl();
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [templates]);

  useEffect(() => {
    if (selectedTemplate) {
      setTemplateName(selectedTemplate.name);
      setTemplateContent(selectedTemplate.content);
      window.history.pushState({}, '', `/templates?id=${selectedTemplate.id}`);
    } else {
      setTemplateName('');
      setTemplateContent('');
      window.history.pushState({}, '', `/templates`);
    }
  }, [selectedTemplate]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setDrawerOpen(false);
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setDrawerOpen(false);
  };

  const handleSaveTemplate = async () => {
    const name = templateName;
    const id = name.toLowerCase().replace(/\s/g, '_');
    const template = {
      name,
      content: templateContent,
    };
    if (selectedTemplate) {
      await templateService.updateTemplate(selectedTemplate.id, template);
      setSelectedTemplate({ ...selectedTemplate, ...template });
    } else {
      const existingTemplate = templates.find(t => t.name === name);
      if (existingTemplate) {
        alert('A template with this name already exists.');
        return;
      }
      const newTemplate = await templateService.createTemplate({ id, ...template });
      setSelectedTemplate(newTemplate);
    }
    templateService.getTemplates().then(setTemplates);
    setSnackbarOpen(true);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
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
              Template Editor
            </Typography>
            <Button color="inherit" onClick={handleSaveTemplate}>Save</Button>
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
            <Box sx={{ display: 'flex', alignItems: 'center', padding: 1 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>Templates</Typography>
              <IconButton onClick={handleNewTemplate}>
                <AddIcon />
              </IconButton>
            </Box>
            <List>
              {templates.map(template => (
                <ListItem button key={template.id} onClick={() => handleSelectTemplate(template)} selected={selectedTemplate?.id === template.id}>
                  <ListItemText primary={template.name} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 3, marginTop: '64px', height: 'calc(100% - 64px)', overflow: 'hidden' }}
        >
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <TextField
                fullWidth
                label="Template Name"
                value={templateName}
                onInput={e => setTemplateName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={20}
                label="Template Content"
                value={templateContent}
                onInput={e => setTemplateContent(e.target.value)}
                sx={{ mb: 2, flexGrow: 1 }}
              />
            </Grid>
            <Grid item xs={4} sx={{ height: '100%' }}>
              <DocumentationPanel selectedTemplate={selectedTemplate} />
            </Grid>
          </Grid>
        </Box>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message="Template saved"
        />
      </Box>
    </ThemeProvider>
  );
};

export default TemplateEditor;
