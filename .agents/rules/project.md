# FamilieTools Project Rules

## Product Vision

FamilieTools is a modular family management CMS.

It provides one central platform for managing family-related information and services while allowing new modules to be added over time.

Expected modules may include:

- family calendar and appointments
- shopping and household lists
- photo albums and family media
- baby tracking
- food and nutrition tracking
- health-related tracking
- tasks and reminders
- documents and family information
- additional future family-management modules

The architecture must support future expansion without requiring major rewrites of existing modules.

## Core Architecture

- Use a modular architecture.
- Each feature domain should be implemented as an independent module where practical.
- Avoid tight coupling between unrelated modules.
- Shared functionality must live in clearly defined shared/core modules.
- Do not duplicate business logic across modules.
- Public interfaces between modules must be deliberate and minimal.
- Prefer composition over large tightly coupled systems.
- Avoid premature abstraction.
- Introduce abstractions when repeated patterns or architectural requirements justify them.

## Domain Separation

Examples of possible domains include:

- users
- families
- permissions
- calendar
- shopping
- photos
- baby
- health
- food
- notifications
- files

Domain-specific business logic should remain inside its owning module.

A module must not directly manipulate another module's internal implementation.

Use defined services, APIs or shared contracts for cross-module communication.

## Shared Core

Cross-cutting functionality should be centralized where appropriate, including:

- authentication
- authorization
- family membership
- permissions
- logging
- validation
- configuration
- notifications
- file handling
- audit logging

Do not implement separate authorization systems inside individual feature modules.

## Maintainability

- Keep files focused on a clear responsibility.
- Prefer descriptive names over abbreviations.
- Avoid unnecessarily large files.
- Prefer explicit and readable implementations.
- Document non-obvious architectural decisions.
- Do not add technologies or dependencies without a concrete benefit.
- Follow existing project conventions before introducing new patterns.

## Development

- Build functionality incrementally.
- Changes should remain reviewable.
- Add appropriate tests for new functionality.
- Breaking changes must be explicitly identified.
- Security and authorization requirements are part of feature design, not an afterthought.
