import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import Chat from './Chat';
import Login from './Login';
import { onAuthStateChanged } from '../services/auth';
import { chatService } from '../services/chat';
import { connectToEmulators } from '../services/firebase';

class ChatBox extends HTMLElement {
  // Use a private field to track whether the component has been initialized
  #initialized = false;

  connectedCallback() {
    // Only run the initialization logic once
    if (this.#initialized) {
      return;
    }
    this.#initialized = true;

    // Delay initialization until after the DOM for this element is fully parsed
    requestAnimationFrame(() => this.init());
  }

  async init() {
    const local = this.getAttribute('local') === 'true';
    connectToEmulators(local);
    const templateId = this.getAttribute('template-id');
    const chatId = this.getAttribute('chat-id');

    // Hide the <context> and <jsoncontext> tags
    const style = document.createElement('style');
    style.textContent = `
      context, jsoncontext, json-context {
        display: none;
      }
    `;
    this.appendChild(style);

    // Get <context> and <jsoncontext> after parsing is guaranteed complete
    const contextEl = this.querySelector('context');
    const jsonContextEl = this.querySelector('jsoncontext') || this.querySelector('json-context');

    console.log("Context element:", contextEl);
    console.log("JSON context element:", jsonContextEl);

    let context;
    if (contextEl) {
        const src = contextEl.getAttribute('src');
        if (src) {
            try {
                const response = await fetch(src);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                context = await response.text();
                contextEl.textContent = context;
            } catch (error) {
                console.error(`Failed to fetch context from ${src}, falling back to innerHTML.`, error);
                context = contextEl.innerHTML.trim();
            }
        } else {
            context = contextEl.innerHTML.trim();
        }
    }

    let jsonContext;
    if (jsonContextEl) {
      try {
        jsonContext = JSON.parse(jsonContextEl.textContent.trim());
      } catch (e) {
        console.error("Invalid JSON in jsoncontext:", e);
      }
    }

    const chatServiceInstance = chatService(templateId, chatId, { context, jsonContext });
    const styleAttr = this.getAttribute('style');
    const chatTitle = this.getAttribute('chat-title');

    // Create a mount point for React
    const mountPoint = document.createElement('div');
    this.appendChild(mountPoint);

    // React component
    const App = () => {
      const [user, setUser] = useState(null);

      useEffect(() => {
        const unsubscribe = onAuthStateChanged(setUser);
        return () => unsubscribe();
      }, []);

      if (!user) {
        return <Login />;
      }

      return <Chat chatService={chatServiceInstance} style={styleAttr} chatTitle={chatTitle} />;
    };

    render(<App />, mountPoint);
  }
}

customElements.define('chat-box', ChatBox);
