import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import TemplateEditor from './TemplateEditor';
import Login from './Login';
import { onAuthStateChanged } from '../services/auth';
import { connectToEmulators } from '../services/firebase';

class ChatTemplates extends HTMLElement {
  connectedCallback() {
    const local = this.getAttribute('local') === 'true';
    connectToEmulators(local);
    const mountPoint = document.createElement('div');
    this.appendChild(mountPoint);

    const App = () => {
      const [user, setUser] = useState(null);

      useEffect(() => {
        const unsubscribe = onAuthStateChanged(setUser);
        return () => unsubscribe();
      }, []);

      if (!user) {
        return <Login />;
      }

      return <TemplateEditor />;
    };

    render(<App />, mountPoint);
  }
}

customElements.define('chat-templates', ChatTemplates);
