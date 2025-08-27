# Use Node.js LTS as base
FROM node:lts-slim

LABEL maintainer="Your Name <your.email@example.com>"
LABEL description="Google Apps Script Development Environment with CLASP and Git (Self-Contained)"

# Environment variables
ENV HOME_DIR="/root"
ENV PROJECTS_DIR="${HOME_DIR}/app-script-projects"
ENV CLASPRC_FILE="${HOME_DIR}/.clasprc.json"

# Install tools: git, curl, jq, rsync
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git openssh-client curl ca-certificates rsync && \
    curl -sL https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 -o /usr/local/bin/jq && \
    chmod +x /usr/local/bin/jq && \
    rm -rf /var/lib/apt/lists/*

# Install clasp globally
RUN npm install -g @google/clasp

# Create projects directory
RUN mkdir -p ${PROJECTS_DIR}

WORKDIR ${PROJECTS_DIR}

# --- Create docker-entrypoint.sh ---
RUN echo '#!/bin/bash' > /usr/local/bin/docker-entrypoint.sh && \
    echo 'CLASPRC_FILE="/root/.clasprc.json"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "-----------------------------------------------------"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo " Google Apps Script Dev Environment Ready!"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "-----------------------------------------------------"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'if [ ! -f "$CLASPRC_FILE" ]; then' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '  echo "🚨 CLASP not authenticated! Run: clasp login --no-localhost"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'else' >> /usr/local/bin/docker-entrypoint.sh && \
    echo '  echo "✅ CLASP authenticated."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'fi' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo ""' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "Use init_project.sh to create/clone Apps Script projects."' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "CLASP: clasp push | clasp pull | clasp open"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'echo "Git: git add . | git commit -m \\"... \\" | git push"' >> /usr/local/bin/docker-entrypoint.sh && \
    echo 'exec "$@"' >> /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# --- Create init_project.sh ---
RUN echo '#!/bin/bash' > /usr/local/bin/init_project.sh && \
    echo 'echo "--- Apps Script Project Setup ---"' >> /usr/local/bin/init_project.sh && \
    echo 'echo "1. Clone existing Apps Script project"' >> /usr/local/bin/init_project.sh && \
    echo 'echo "2. Create new Apps Script project"' >> /usr/local/bin/init_project.sh && \
    echo 'read -p "Enter choice (1 or 2): " choice' >> /usr/local/bin/init_project.sh && \
    echo 'if [ "$choice" == "1" ]; then' >> /usr/local/bin/init_project.sh && \
    echo '  read -p "Enter Script ID: " SCRIPT_ID' >> /usr/local/bin/init_project.sh && \
    echo '  read -p "Enter local directory name: " PROJECT_NAME' >> /usr/local/bin/init_project.sh && \
    echo '  mkdir -p "$PROJECT_NAME" && cd "$PROJECT_NAME" && clasp clone "$SCRIPT_ID"' >> /usr/local/bin/init_project.sh && \
    echo 'elif [ "$choice" == "2" ]; then' >> /usr/local/bin/init_project.sh && \
    echo '  read -p "Enter project name: " PROJECT_NAME' >> /usr/local/bin/init_project.sh && \
    echo '  read -p "Enter type [standalone]: " PROJECT_TYPE' >> /usr/local/bin/init_project.sh && \
    echo '  PROJECT_TYPE=${PROJECT_TYPE:-standalone}' >> /usr/local/bin/init_project.sh && \
    echo '  mkdir -p "$PROJECT_NAME" && cd "$PROJECT_NAME" && clasp create --title "$PROJECT_NAME" --type "$PROJECT_TYPE"' >> /usr/local/bin/init_project.sh && \
    echo 'else echo "Invalid choice"; exit 1; fi' >> /usr/local/bin/init_project.sh && \
    echo '' >> /usr/local/bin/init_project.sh && \
    echo 'if [ ! -d ".git" ]; then' >> /usr/local/bin/init_project.sh && \
    echo '  read -p "Initialize Git here? (y/N): " init_git' >> /usr/local/bin/init_project.sh && \
    echo '  if [[ "$init_git" =~ ^[Yy]$ ]]; then' >> /usr/local/bin/init_project.sh && \
    echo '    git init && git add . && git commit -m "Initial commit"' >> /usr/local/bin/init_project.sh && \
    echo '    echo "Git repo initialized. Add remote and push manually."' >> /usr/local/bin/init_project.sh && \
    echo '  fi' >> /usr/local/bin/init_project.sh && \
    echo 'fi' >> /usr/local/bin/init_project.sh && \
    chmod +x /usr/local/bin/init_project.sh

# --- Create add-to-parent.sh ---
COPY add-to-parent.sh /usr/local/bin/add-to-parent.sh
RUN chmod +x /usr/local/bin/add-to-parent.sh

# Volumes for persistence
#VOLUME ${PROJECTS_DIR}
#VOLUME ${CLASPRC_FILE}

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bash"]
