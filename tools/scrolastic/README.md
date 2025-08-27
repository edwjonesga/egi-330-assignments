# Scrolastic Firebase Project

This directory contains the scripts and configuration for the Scrolastic Firebase project.

## Setup with Docker (Recommended)

This is the recommended way to set up the development environment. The only prerequisite is [Docker](https://www.docker.com/).

### 1. Build the container

Use the `build-container.sh` script to build the Docker image. This will install all the necessary dependencies, including Node.js and the Firebase CLI, inside the container.

```bash
./build-container.sh
```

### 2. Start the container

Use the `start-container.sh` script to start the Docker container. This will mount the current directory into the `/app` directory in the container, so any changes you make locally will be reflected inside the container.

```bash
./start-container.sh
```

### 3. Set up your API Key

Once inside the container, you need to set up your `GEMINI_API_KEY`.

1.  Navigate to the `functions-js` directory.
2.  Copy the `.env.example` file to a new file named `.env`.
    ```bash
    cp .env.example .env
    ```
3.  Open the `.env` file (e.g., using `nano` or `vi`) and replace `YOUR_API_KEY_HERE` with your actual Gemini API key.

### 4. Run the scripts

Now you can use the scripts to build, run, and deploy the application from within the container.

*   **To run the local emulators:** `./run.sh`
*   **To build the application:** `./build.sh`
*   **To deploy to Firebase:** `./deploy.sh`

The `deploy.sh` script will prompt you for the Firebase project to deploy to. The `GEMINI_API_KEY` from your `.env` file will be automatically loaded into the Cloud Function's runtime environment during deployment.

## Manual Local Setup (without Docker)

If you prefer not to use Docker, you can set up your local environment manually.

### Prerequisites

*   [Node.js](https://nodejs.org/)
*   [Firebase CLI](https://firebase.google.com/docs/cli)

### Usage

The setup and usage is similar to the Docker setup, but you will run the scripts directly on your machine.

1.  **Set up your API Key:** Follow the same steps as in the Docker setup to create a `functions-js/.env` file with your `GEMINI_API_KEY`.
2.  **Run the scripts:**
    *   To run the local emulators: `./run.sh`
    *   To build the application: `./build.sh`
    *   To deploy to Firebase: `./deploy.sh`
