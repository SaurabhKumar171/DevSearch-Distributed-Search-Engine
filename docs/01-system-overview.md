# 🌐 DevSearch: Key Architecture Components
This document explains the major architectural components of **DevSearch** and the reasoning behind some of the design decisions. It reflects the current implementation after completing **Phase 2**, including the improvements made around scalability, scheduling, and crawler reliability.

---

# 01. System Overview
DevSearch is a distributed web crawler built to crawl developer documentation at scale.

The primary goal of the system is not just to crawl pages quickly, but to do it efficiently while respecting website politeness policies and remaining horizontally scalable. The crawler is completely self-hosted and is designed to run without relying on managed cloud services, keeping the overall infrastructure cost at **$0**.

Instead of building everything as a single application, the crawler is split into multiple independent components. Each component is responsible for one part of the pipeline, making it easier to scale individual stages without affecting the rest of the system.

At a high level, the pipeline consists of:
- URL ingestion
- URL deduplication
- Queue management
- Distributed crawling
- Content storage

One important design decision was separating the **ingestion pipeline** from the **crawler workers**. The ingestion layer is responsible for accepting newly discovered URLs, normalizing them, removing duplicates, and pushing valid URLs into the fetch queue.

The **crawler layer** is responsible for consuming URLs from the queue, applying domain politeness rules, downloading pages, extracting new links, and storing the raw HTML.

Since these two parts have very different workloads, separating them allows each layer to scale independently. Most coordination between these services happens through Redis.

Redis acts as the shared state for the distributed crawler by managing:
- Global fetch queues
- Deduplication state
- Domain rate limiting
- Worker coordination

Because Redis operations are atomic, multiple crawler workers can safely run in parallel without conflicting with one another.

This architecture also makes horizontal scaling straightforward. New crawler workers can simply be started, and they immediately begin consuming work from the shared queues without requiring any changes to the rest of the system.

By keeping the system loosely coupled and queue-driven, DevSearch avoids single-process bottlenecks while maintaining high throughput and ensuring that target websites are crawled politely.