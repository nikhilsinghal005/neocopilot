# VS Code Extension Architecture

This document outlines the proposed production-grade architecture for the Neo Copilot VS Code extension. The goal is to create a more modular, scalable, and maintainable codebase.

## Project Structure

The new project structure will be organized as follows:

```
.
├── src/
│   ├── core/
│   │   ├── auth/
│   │   ├── commands/
│   │   ├── config/
│   │   ├── di/
│   │   ├── events/
│   │   ├── logging/
│   │   ├── notifications/
│   │   ├── socket/
│   │   ├── storage/
│   │   ├── webview/
│   │   └── workspace/
│   ├── features/
│   │   ├── chat/
│   │   ├── code-completion/
│   │   └── inline-edit/
│   ├── services/
│   ├── shared/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── enums/
│   ├── container.ts
│   └── extension.ts
├── assets/
├── __tests__/
├── scripts/
├── webview-chat/
└── package.json
```

## Core Concepts

### Dependency Injection (DI)

We will use a simple DI container to manage the lifecycle of our services. This will decouple our modules and make them easier to test. The `container.ts` file will be responsible for creating and wiring up all the services.

### Core Services

The `core/` directory will contain all the cross-cutting concerns of the application. These services will be shared across all features.

-   **AuthService**: Manages authentication and user identity.
-   **CommandManager**: Registers and executes VS Code commands.
-   **ConfigService**: Manages extension settings.
-   **EventBus**: A simple event bus for communication between modules.
-   **LoggerService**: Handles logging.
-   **NotificationService**: Displays notifications to the user.
-   **SocketService**: Manages the Socket.IO connection.
-   **StorageService**: Manages workspace and global state.
-   **WebviewManager**: A generic service for creating and managing webviews.
-   **WorkspaceService**: Provides utilities for interacting with the VS Code workspace.

### Services

The `services/` directory will contain services that encapsulate third-party API integrations or complex business logic that doesn't fit neatly into a single feature.

### Shared Modules

The `shared/` directory will contain modules that are shared across the entire application.

-   **constants**: Application-wide constants.
-   **enums**: Application-wide enumerations.
-   **types**: TypeScript types and interfaces.
-   **utils**: Utility functions.

### Feature Modules

Each feature of the extension will be a self-contained module in the `features/` directory. Each feature module will have a `Controller`, a `Service`, and any other necessary components.

-   **Controller**: The entry point for the feature. It will be responsible for registering commands, views, and event listeners.
-   **Service**: Contains the business logic for the feature.

### Testing

The `__tests__/` directory will contain all the tests for the extension. We will use a modern testing framework like Jest or Vitest.

### Scripts

The `scripts/` directory will contain any build, deployment, or utility scripts.

### Assets

The `assets/` directory will contain all the static assets for the extension, such as icons, images, and fonts.

## Webview

The `webview-chat/` directory will remain a standalone project, but it will communicate with the extension through the `WebviewManager` and the `EventBus`. This will ensure a clean separation between the webview and the extension logic.

## Next Steps

1.  Create the new folder structure.
2.  Refactor the `core` modules.
3.  Refactor the `features`.
4.  Refactor the webview.
5.  Finalize and clean up.
