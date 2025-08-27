import { h } from 'preact';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Code from '@mui/material/Chip';

const DocumentationPanel = ({ selectedTemplate }) => {
    const templateId = selectedTemplate ? selectedTemplate.id : 'your-template-id';

    const exampleCode =
`<chat-box template-id="${templateId}" chat-id="some-chat-id">
  <context>This is some string context.</context>
  <json-context>
    {
      "course": "CS101",
      "assignment": "Lab 1"
    }
  </json-context>
</chat-box>`;

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
            <Typography variant="h5" gutterBottom>Template Documentation</Typography>

            <Typography variant="h6" gutterBottom>Available Placeholders</Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Placeholder</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell><Code label="${user}" /></TableCell>
                            <TableCell>The authenticated Firebase user object.</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><Code label="${context}" /></TableCell>
                            <TableCell>A string provided in the <Code label="<context>" /> tag of the chat-box component.</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><Code label="${jsoncontext}" /></TableCell>
                            <TableCell>A JSON object provided in the <Code label="<json-context>" /> tag.</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><Code label="${history}" /></TableCell>
                            <TableCell>An array of previous messages in the conversation.</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><Code label="${attachments}" /></TableCell>
                            <TableCell>An array of JSON objects from uploaded attachments.</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Accessing Object Properties</Typography>
            <Typography paragraph>
                You can access nested properties of objects using dot notation.
            </Typography>
            <Code label="Example: ${user.token.name}" />
            <Typography paragraph sx={{ mt: 1 }}>
                This will be replaced with the display name of the current user.
            </Typography>

            <Typography variant="h6" gutterBottom>The <Code label="${user}" /> Object</Typography>
            <Typography paragraph>
                The <Code label="${user}" /> object contains information about the currently authenticated user. Most of the useful information is nested within the <Code label="token" /> property. Some useful fields are:
            </Typography>
            <ul>
                <li><Code label="user.uid" />: The user's unique ID.</li>
                <li><Code label="user.token.name" />: The user's display name.</li>
                <li><Code label="user.token.email" />: The user's email address.</li>
                <li><Code label="user.token.picture" />: The URL of the user's profile picture.</li>
            </ul>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Accessing Array Elements</Typography>
            <Typography paragraph>
                You can access elements of an array using square bracket notation. You can use positive indices (starting from 0) or negative indices (starting from -1 to access the last element).
            </Typography>
            <Code label="Example: ${history[0].text}" />
            <Typography paragraph sx={{ mt: 1 }}>
                This will get the text of the very first message in the conversation history.
            </Typography>
            <Code label="Example: ${history[-1].text}" />
            <Typography paragraph sx={{ mt: 1 }}>
                This will get the text of the most recent message in the conversation history.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Filtering Arrays</Typography>
            <Typography paragraph>
                You can filter an array to find specific items using the <Code label="[key=value]" /> syntax.
            </Typography>
            <Code label="Example: ${history[sender=user][-1].text}" />
            <Typography paragraph sx={{ mt: 1 }}>
                This will find all messages sent by the user, then get the text of the last one.
            </Typography>
            <Code label="Example: ${attachments[fileName=test.java][0].content}" />
            <Typography paragraph sx={{ mt: 1 }}>
                This will find all attachments with the file name "test.java", then get the content of the first one.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Using Context</Typography>
            <Typography paragraph>
                You can provide custom context to the chat bot by adding <Code label="<context>" /> and <Code label="<json-context>" /> tags inside the <Code label="<chat-box>" /> component in your HTML.
            </Typography>
            <Paper elevation={2} sx={{ p: 2, my: 1, bgcolor: 'background.paper' }}>
                <pre sx={{ color: 'text.primary', bgcolor: 'background.paper' }}>
                    <code>
                        {exampleCode}
                    </code>
                </pre>
            </Paper>
            <Typography paragraph>
                You can then access this data in your templates:
            </Typography>
            <ul>
                <li><Code label="${context}" /> will be replaced with "This is some string context.".</li>
                <li><Code label="${jsoncontext.course}" /> will be replaced with "CS101".</li>
            </ul>
        </Paper>
    );
};

export default DocumentationPanel;
