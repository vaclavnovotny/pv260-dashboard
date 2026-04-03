# GitHub Actions Docker Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a GitHub Actions workflow that builds the pv260-dashboard Docker image for `linux/amd64` and `linux/arm64` and pushes it to Docker Hub on every push to `main`.

**Architecture:** A single workflow YAML file under `.github/workflows/` using Docker's official GitHub Actions suite (QEMU + Buildx + build-push-action). Tags pushed: `ganz02/pv260:latest` and `ganz02/pv260:<short-sha>`. Layer caching via GitHub Actions cache (`type=gha`).

**Tech Stack:** GitHub Actions, Docker Buildx, QEMU, docker/build-push-action v6

---

### Task 1: Create the GitHub Actions workflow file

**Files:**
- Create: `.github/workflows/docker-publish.yml`

- [ ] **Step 1: Create the workflows directory and write the workflow file**

Create `.github/workflows/docker-publish.yml` with this exact content:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          platforms: linux/amd64,linux/arm64
          tags: |
            ganz02/pv260:latest
            ganz02/pv260:${{ github.sha && 'sha' || '' }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Wait — the short SHA needs to be extracted. Replace the tags block with a `docker/metadata-action` step to generate tags properly.

Updated plan (use `docker/metadata-action` for clean tagging):

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ganz02/pv260
          tags: |
            type=raw,value=latest
            type=sha,format=short

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          platforms: linux/amd64,linux/arm64
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/docker-publish.yml
git commit -m "ci: add GitHub Actions workflow to build and push Docker image"
```

- [ ] **Step 3: Push to GitHub and verify**

```bash
git push origin main
```

Then go to GitHub → Actions tab and confirm the `Build and Push Docker Image` workflow starts running. After it completes (~5-10 min for multi-platform), verify on Docker Hub that `ganz02/pv260:latest` and `ganz02/pv260:sha-<abc1234>` both exist.
