-----

# Google Apps Script Development Environment (Docker)

This repository provides a self-contained Dockerfile to create a consistent and portable development environment for Google Apps Script projects. It comes pre-installed with **Node.js**, **npm**, **CLASP** (Command Line Apps Script Project), and **Git**, allowing you to manage your Apps Script code locally, leverage Git for version control, and sync seamlessly with Google's Apps Script platform.

-----

## 🔥 Quick Start Cheat Sheet 🔥

Here are the essential commands to get you up and running quickly:

**1. Build the Docker Image (first time only):**

```bash
cd ~/my-app-script-dev # Or your chosen directory
docker build -t app-script-dev-env .
```

**2. Run the Docker Container (to enter the dev environment):**

```bash
cd ~/my-app-script-dev # Or your chosen directory
docker run -it --rm \
           --name app-script-container \
           -v "$(pwd):/app-script-projects" \
           -v "$HOME/.clasprc.json:/root/.clasprc.json" \
           app-script-dev-env
```

**3. Inside the Container (First-time CLASP login, if needed):**

```bash
clasp login --no-localhost
# Follow browser prompts, then paste code back into terminal.
```

**4. Inside the Container (Initialize or Clone a Project):**

```bash
init_project.sh
# Follow interactive prompts to clone/create and set up Git.
```

**5. After Project Init/Clone (Develop on your Host Machine):**

```bash
exit # Exit the Docker container
cd ~/my-app-script-dev/<your-project-name> # Go to your project directory
# Open this directory in your favorite IDE (VS Code, etc.) and make changes.
```

**6. Inside the Container (Sync with Apps Script & Git):**

```bash
# First, run the `docker run` command from Step 2 again to re-enter.
cd <your-project-name> # Navigate to your project inside the container

# Apps Script commands:
clasp push       # Upload local changes to Apps Script
clasp pull       # Download changes from Apps Script (if you edited online)
clasp open       # Open project in Apps Script editor

# Git commands:
git add .        # Stage changes
git commit -m "Your commit message" # Commit changes
git push origin main # Push to GitHub (adjust branch if needed)
git pull origin main # Pull from GitHub (adjust branch if needed)
```

-----

## Why Use This?

  * **Consistency:** Every developer uses the exact same environment, reducing "it works on my machine" issues.
  * **Portability:** Take your entire Apps Script development setup with you, anywhere Docker runs.
  * **Isolation:** Keep your host machine clean from Node.js, npm, or CLASP installations and their dependencies.
  * **Version Control:** Easily integrate your Apps Script projects with **GitHub** (or any Git host) for robust version tracking, collaboration, and history.
  * **Streamlined Workflow:** A built-in script helps you quickly clone existing Apps Script projects or create new ones, and set up Git.

-----

## Getting Started: Detailed Instructions

Follow these detailed steps to set up and use your Apps Script development environment.

### 1\. Enable Apps Script API

Before you begin, ensure the Google Apps Script API is enabled for your Google account. This is crucial for CLASP to interact with your Apps Script projects.

  * Go to: [Google Apps Script Settings](https://script.google.com/home/usersettings)
  * Toggle "Google Apps Script API" to **On**.

### 2\. Prepare Your Local Machine

1.  **Install Docker Desktop:** If you don't have Docker installed, download and install [Docker Desktop](https://www.docker.com/products/docker-desktop) for your operating system.
2.  **Create Your Projects Directory:** Create a dedicated, empty directory on your local machine where you'd like to store all your Google Apps Script projects. This directory will be "mounted" into the Docker container.
    ```bash
    mkdir ~/my-app-script-dev
    cd ~/my-app-script-dev
    ```
    (You can choose any name and location you prefer for this directory.)
3.  **Place the `Dockerfile`:** Save the entire `Dockerfile` content into a file named `Dockerfile` (no extension) inside your `~/my-app-script-dev` directory. **You only need this one file.**

### 3\. Build the Docker Image

From within your `~/my-app-script-dev` directory (where your `Dockerfile` is located), run the following command to build the Docker image:

```bash
docker build -t app-script-dev-env .
```

This process might take a few minutes the first time as Docker downloads the base image and installs all necessary tools and embeds the scripts.

### 4\. Run the Docker Container

Once the image is built, you can start your development environment container. Make sure you are still in your `~/my-app-script-dev` directory on your host machine.

```bash
docker run -it --rm \
           --name app-script-container \
           -v "$(pwd):/app-script-projects" \
           -v "$HOME/.clasprc.json:/root/.clasprc.json" \
           app-script-dev-env
```

**Explanation of the `docker run` command:**

  * `docker run -it --rm`: Runs the container in interactive mode (`-it`) and automatically removes it when you exit (`--rm`), keeping your Docker environment clean.
  * `--name app-script-container`: Assigns a convenient name to your running container.
  * `-v "$(pwd):/app-script-projects"`: **This is critical\!** It mounts your *current local directory* (`~/my-app-script-dev`) to `/app-script-projects` inside the container. All your Apps Script projects will reside here and persist even after the container stops.
  * `-v "$HOME/.clasprc.json:/root/.clasprc.json"`: **This is crucial for CLASP authentication persistence.** It mounts your host machine's CLASP credentials file (`.clasprc.json`) into the container. Since the container runs as root, CLASP's credentials will be stored in `/root/.clasprc.json`.
  * `app-script-dev-env`: The name of the Docker image you built.

-----

## Using the Development Environment: Step-by-Step

After running the `docker run` command, you'll be dropped into a bash shell *inside* the Docker container.

### 1\. CLASP Login (First Time Only)

The first time you run the container (or if your CLASP credentials aren't yet mounted), you'll see a message indicating that CLASP isn't authenticated.

To log in, run:

```bash
clasp login --no-localhost
```

Follow the prompts:

1.  A URL will appear in the terminal. Copy it and paste it into your web browser.
2.  Authorize CLASP with your Google account.
3.  You'll be given a verification code. Copy this code and paste it back into your terminal inside the Docker container.

Your CLASP credentials (`.clasprc.json`) will be saved in your host's home directory and persistently mounted into the container.

### 2\. Initialize or Clone an Apps Script Project

Once CLASP is authenticated, you can use the built-in helper script to set up your Apps Script project:

```bash
init_project.sh
```

Follow the interactive prompts:

  * **Clone an existing project:** Provide the Google Apps Script Project ID. The script will attempt to suggest a local directory name based on the project's name.
  * **Create a new project:** Provide a name and choose the project type (e.g., `standalone`, `sheets`, `docs`, `webapp`).

This script will:

  * Create a new sub-directory for your project within `/app-script-projects` (which is mapped to your `~/my-app-script-dev` directory on your host).
  * Download your project files (for cloning) or create initial files (for new projects).
  * Offer to initialize a Git repository within your project directory. If you choose yes, it will also guide you on how to link it to GitHub.
  * Create a `.env` file within your project directory containing the `APPS_SCRIPT_PROJECT_NAME` and `APPS_SCRIPT_SCRIPT_ID` for easy reference.
  * Add `.env` and `.clasp.json` to your project's `.gitignore` file.

### 3\. Develop Your Code (On Your Host Machine)

1.  **Exit the Docker container:** Type `exit` or press `Ctrl+D`.
2.  **Navigate to your project:** On your host machine, `cd` into the newly created project directory (e.g., `~/my-app-script-dev/my-new-script`).
3.  **Open in your IDE:** Open this project folder in your favorite local IDE (like VS Code, Sublime Text, etc.).
4.  Make your code changes as usual. Since your host directory is mounted, any changes you save will instantly be available inside the container.

### 4\. Sync with Apps Script and GitHub (Using the Container)

Whenever you want to push/pull code to Google Apps Script or manage your Git repository, you'll re-enter the Docker container.

1.  **Start the container again:** From your host's `~/my-app-script-dev` directory, run the same `docker run` command from Step 4 in "Getting Started" above.

2.  **Navigate to your project:** Once inside the container, `cd` into your specific project directory:

    ```bash
    cd <your-project-name>
    ```

    (e.g., `cd my-spreadsheet-automation`)

3.  **Use CLASP and Git commands:**

      * **Upload local changes to Apps Script:**
        ```bash
        clasp push
        ```
      * **Download changes from Apps Script (if you edited online):**
        ```bash
        clasp pull
        ```
      * **Open the project in the Apps Script editor:**
        ```bash
        clasp open
        ```
      * **Stage changes for Git commit:**
        ```bash
        git add .
        ```
      * **Commit changes to your local Git repository:**
        ```bash
        git commit -m "Descriptive message about your changes"
        ```
      * **Push changes to your GitHub repository:**
        ```bash
        git push origin main # Or 'master' if that's your branch name
        ```
      * **Pull changes from your GitHub repository:**
        ```bash
        git pull origin main
        ```

-----

## Contributing & Customization

If you'd like to customize this environment (e.g., add more tools, change Node.js version), you can modify the `Dockerfile` and rebuild the image.

-----