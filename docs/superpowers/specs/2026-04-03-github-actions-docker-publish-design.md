# GitHub Actions Docker Publish — Design Spec

**Date:** 2026-04-03  
**Status:** Approved

## Overview

Add a GitHub Actions workflow that automatically builds the pv260-dashboard Docker image and pushes it to Docker Hub on every push to `main`.

## Trigger

- `push` to `main` branch only

## Image Tags

Each successful build pushes two tags to `ganz02/pv260`:

| Tag | Example | Purpose |
|-----|---------|---------|
| `latest` | `ganz02/pv260:latest` | Always points to the most recent main build |
| `<short-sha>` | `ganz02/pv260:abc1234` | Immutable reference to a specific commit |

Short SHA is the first 7 characters of the git commit SHA (`github.sha`).

## Platforms

Builds for both:
- `linux/amd64` — standard servers, GitHub-hosted runners
- `linux/arm64` — Apple Silicon, Raspberry Pi

QEMU emulation handles cross-compilation on GitHub's amd64 runners.

## Workflow Steps

1. **Checkout** — `actions/checkout@v4`
2. **Set up QEMU** — `docker/setup-qemu-action@v3` (enables ARM emulation)
3. **Set up Buildx** — `docker/setup-buildx-action@v3` (multi-platform builder)
4. **Login to Docker Hub** — `docker/login-action@v3` using repo secrets
5. **Build and push** — `docker/build-push-action@v6`
   - Context: repo root (where `Dockerfile` lives)
   - Platforms: `linux/amd64,linux/arm64`
   - Tags: `ganz02/pv260:latest` + `ganz02/pv260:<short-sha>`
   - Layer cache: `type=gha` (GitHub Actions cache, speeds up repeat builds)

## File Location

`.github/workflows/docker-publish.yml`

## Required Secrets

Set in GitHub repo → Settings → Secrets and variables → Actions:

| Secret name | Value |
|-------------|-------|
| `DOCKERHUB_USERNAME` | Docker Hub username (e.g. `ganz02`) |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not password) |

A Docker Hub access token can be created at: Hub → Account Settings → Personal access tokens.

## Error Handling

- Workflow fails fast if login or build fails — no partial pushes
- Multi-platform build failure on one platform fails the whole job

## Out of Scope

- No PR builds (only `main` triggers)
- No version tagging from git tags (use commit SHA instead)
- No image vulnerability scanning
