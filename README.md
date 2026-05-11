# slateai-ui-automation
This repo will be used to UI test automation using Cypress.

## Prerequisites

Before running this project, ensure you have the following software installed:

### Required Software

1. **Node.js** (v14 or higher recommended)
   - Download from: https://nodejs.org/
   - Includes npm (Node Package Manager)
   - Verify installation: `node --version` and `npm --version`

2. **Google Chrome Browser**
   - Required for running Cypress tests
   - Download from: https://www.google.com/chrome/

3. **Git**
   - For cloning and version control
   - Download from: https://git-scm.com/downloads
   - Verify installation: `git --version`

### Optional Software

4. **Docker** (for running tests in containers)
   - Download from: https://www.docker.com/products/docker-desktop
   - Verify installation: `docker --version`

5. **Bash Shell** (for running shell scripts)
   - **Windows users**: Use Git Bash (comes with Git) or Windows Subsystem for Linux (WSL)
   - **Mac/Linux users**: Bash is pre-installed

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd slateai-ui-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify Cypress installation**
   ```bash
   npx cypress verify
   ```

## Running Tests

### Run in UI mode locally
```bash
npm run cy-testUI
```

### Run in CLI mode locally
```bash
./run.sh
```
*Note: On Windows, use Git Bash or WSL to run shell scripts*

### Run in Docker locally
```bash
docker build -t testimage:tagnumber .
docker run -it testimage:tagnumber
```

## Project Structure

- `cypress/e2e/` - Test specifications
- `cypress/fixtures/` - Test data files
- `cypress/support/` - Custom commands and page objects
- `cypressDev.config.js` - Development environment configuration
- `cypressQE.config.js` - QE environment configuration

