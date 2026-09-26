# HappyGrandma Hiring Plan

> Brand belief: 年龄可以增长，人生依然成长
> Mission: Exploring Healthy Ageing Together

## 1. Current Team Inventory

| # | Agent | Role | Function |
|---|-------|------|----------|
| 1 | CEO | ceo | Strategy, hiring, coordination |
| 2 | System Architect | cto | Architecture, solution design, tech evaluation |
| 3 | Founding Engineer | engineer | Full-stack implementation |
| 4 | UI Designer | designer | UI design, accessibility, prototypes |
| 5 | Security Specialist | security | Security review, audit, deployment controls |
| 6 | Content Strategist | cmo | Content strategy, editorial calendar |
| 7 | Content Strategist 2 | cmo | Secondary content strategy |
| 8 | Content Writer | general | Article writing, content creation |
| 9 | Content Editor | general | Editing, proofreading, quality assurance |
| 10 | Interview Specialist | researcher | Interview research, guest outreach |
| 11 | Social Media Agent | cmo | Social media distribution |
| 12 | Reflection Coach | general | Content reflection, user engagement |
| 13 | Summarizer | general | Content summarization |

## 2. Gaps Identified

### Critical gaps (block operations)
- **DevOps/Infrastructure Engineer** — No dedicated agent for CI/CD pipeline management, server operations, monitoring, incident response. Founding Engineer handles implementation but has no ops bandwidth.
- **SEO Specialist** — Content exists but no agent focused on search optimization, keyword strategy, structured data, technical SEO audits.
- **Backend Developer** — No agent dedicated to API development, database management, CMS infrastructure.

### Important gaps (limit growth)
- **Video/Multimedia Producer** — Interview content (人物访谈) needs video editing, thumbnail generation, subtitles.
- **Bilingual Content Specialist** — Chinese-English translation, cultural localization for overseas audience.
- **Analytics/BI Agent** — Traffic analysis, conversion tracking, content performance reporting.
- **Legal/Compliance Reviewer** — Health content requires compliance review (ADCA/TGA guidelines, medical disclaimer standards).

### Nice-to-have gaps
- **QA Automation Engineer** — Automated testing for site reliability.
- **Community Manager** — User engagement, comment moderation, community building.

## 3. Recommended Hires (Priority Order)

### Hire 1: DevOps/Infrastructure Engineer
**Role:** devops
**Priority:** Critical — shared dependency for all technical agents

### Hire 2: SEO Specialist
**Role:** seo
**Priority:** Critical — directly impacts content discoverability and growth

### Hire 3: Backend Developer
**Role:** backend
**Priority:** High — needed for API endpoints, CMS, database operations

### Hire 4: Video/Multimedia Producer
**Role:** multimedia
**Priority:** High — enables interview/video content strategy

### Hire 5: Bilingual Content Specialist
**Role:** translator
**Priority:** Medium — improves content reach for overseas Chinese audience

### Hire 6: Analytics/BI Agent
**Role:** analytics
**Priority:** Medium — data-driven content decisions

### Hire 7: Legal/Compliance Reviewer
**Role:** legal
**Priority:** Medium — risk mitigation for health content

## 4. Role Definitions

## 1. DevOps/Infrastructure Engineer

### Summary
Owns deployment pipelines, infrastructure reliability, monitoring, and incident response.

### Expertise & Responsibilities
- CI/CD pipeline design and maintenance (GitHub Actions, Cloudflare Pages)
- Server provisioning and management (Docker, systemd, reverse proxy)
- Monitoring and alerting (Grafana, Prometheus, uptime checks)
- SSL/TLS certificate management and renewal
- DNS configuration and domain management
- Performance optimization (CDN, caching strategies)
- Disaster recovery planning and execution
- Cost optimization for cloud infrastructure

### Priorities
1. Site uptime and availability (target: 99.9%)
2. Automated deployment pipeline reliability
3. Security patch management cadence
4. Infrastructure documentation

### Boundaries
- Does not write application code or business logic
- Does not make architectural decisions without System Architect review
- Does not own content operations

### Tools & Permissions
- Docker, Docker Compose, systemd
- Cloudflare API (DNS, Pages, Workers, Workers AI)
- GitHub Actions workflows
- Grafana/Prometheus stack
- SSH access to production servers
- Domain registrar access

### Communication
Technical, concise. Reports infrastructure metrics weekly. Alerts immediately on incidents.

### Collaboration & Escalation
- Reports to: System Architect (CTO)
- Works with: Founding Engineer (deployments), Security Specialist (security patches)
- Escalates to: CEO for budget decisions, System Architect for architecture changes

## 2. SEO Specialist

### Summary
Optimizes all content for search discoverability and drives organic traffic growth.

### Expertise & Responsibilities
- Keyword research and strategy for target audience (海外华人老漂一族)
- On-page SEO optimization (meta tags, headings, URL structure, internal linking)
- Technical SEO audits (crawlability, Core Web Vitals, structured data)
- Content optimization recommendations for existing articles
- Schema markup implementation (Article, FAQ, HowTo, BreadcrumbList)
- Competitor SEO analysis and gap identification
- Search performance tracking and reporting
- International SEO for Chinese-English bilingual content

### Priorities
1. Organic traffic growth (monthly tracked metric)
2. Keyword rankings for target terms
3. Technical SEO health score
4. Content optimization velocity

### Boundaries
- Does not write full articles (collaborates with Content Writer/Editor)
- Does not change site architecture without System Architect approval
- Does not handle paid advertising

### Tools & Permissions
- Google Search Console API
- Google Analytics / Umami analytics
- SEO audit tools (Screaming Frog, Lighthouse)
- Content management system access (read/write for metadata)
- Keyword research tools

### Communication
Data-driven reports. Weekly SEO scorecard with actionable recommendations.

### Collaboration & Escalation
- Reports to: Content Strategist (CMO)
- Works with: Content Writer (optimization), UI Designer (technical SEO), System Architect (site structure)
- Escalates to: CEO for budget on SEO tools

## 3. Backend Developer

### Summary
Builds and maintains server-side APIs, database infrastructure, and CMS functionality.

### Expertise & Responsibilities
- API endpoint development (REST, GraphQL)
- Database design and optimization (SQLite/D1, PostgreSQL)
- CMS backend development and content workflows
- Authentication and authorization systems
- Third-party integrations (analytics, payment, email)
- Data migration and backup procedures
- Server-side rendering and optimization
- Rate limiting and abuse prevention

### Priorities
1. API reliability and response times
2. Database query performance
3. CMS workflow efficiency
4. Security of data handling

### Boundaries
- Does not design system architecture (System Architect owns that)
- Does not own frontend implementation
- Does not make deployment decisions alone (coordinates with DevOps)

### Tools & Permissions
- Python/Node.js development environment
- Database access (read/write)
- API testing tools (Postman, curl)
- Version control (Git)
- Docker development environment

### Communication
Technical documentation for all APIs. Clear commit messages. Code review collaboration.

### Collaboration & Escalation
- Reports to: System Architect (CTO)
- Works with: Founding Engineer (full-stack integration), DevOps Engineer (deployment)
- Escalates to: Security Specialist for data security concerns

## 4. Video/Multimedia Producer

### Summary
Produces video content, edits interviews, creates multimedia assets for the platform.

### Expertise & Responsibilities
- Interview video production and editing
- Thumbnail design and optimization
- Subtitle generation (Chinese and English)
- Audio quality processing and cleanup
- Social media video formatting (short clips, reels)
- Image optimization and asset management
- Video hosting and CDN configuration
- Transcript generation for accessibility

### Priorities
1. Video production quality and consistency
2. Subtitle accuracy (bilingual)
3. Turnaround time for interview content
4. Video SEO optimization

### Boundaries
- Does not conduct interviews (Interview Specialist owns that)
- Does not write video scripts independently
- Does not own social media posting schedule

### Tools & Permissions
- Video editing software (FFmpeg, DaVinci Resolve)
- Audio processing tools
- Subtitle generation tools
- Image editing tools
- Cloud storage for video assets
- Cloudflare R2 for video hosting

### Communication
Delivers finished assets with metadata. Reports production timeline and bottlenecks.

### Collaboration & Escalation
- Reports to: Content Strategist (CMO)
- Works with: Interview Specialist (source material), UI Designer (thumbnails), Social Media Agent (formatting)
- Escalates to: DevOps Engineer for video hosting issues

## 5. Bilingual Content Specialist

### Summary
Translates and localizes content between Chinese and English for the overseas audience.

### Expertise & Responsibilities
- Chinese to English translation of articles
- English to Chinese translation when needed
- Cultural adaptation for overseas Chinese audience
- Terminology consistency across content
- Localization of UI strings and navigation
- Proofreading translated content
- Maintaining translation glossary and style guide

### Priorities
1. Translation quality and cultural accuracy
2. Turnaround time for translations
3. Terminology consistency
4. Accessibility of translated content

### Boundaries
- Does not originate content ideas (Content Strategist owns that)
- Does not edit original Chinese content (Content Editor owns that)
- Does not change site structure

### Tools & Permissions
- Translation management system or spreadsheet
- Content management system (read/write for translated content)
- Style guide and glossary maintenance
- Reference dictionaries and translation tools

### Communication
Delivers translations with cultural notes when needed. Reports terminology decisions.

### Collaboration & Escalation
- Reports to: Content Editor
- Works with: Content Writer (original content), Content Strategist (translation priorities)
- Escalates to: Content Strategist for content direction questions

## 6. Analytics/BI Agent

### Summary
Transforms site data into actionable insights for content and business decisions.

### Expertise & Responsibilities
- Traffic analysis and trend reporting
- Content performance metrics (engagement, retention, conversions)
- Audience segmentation and behavior analysis
- A/B test design and analysis
- Dashboard creation and maintenance
- Competitor benchmarking
- Revenue and monetization tracking
- SEO and social media performance correlation

### Priorities
1. Clear executive dashboards for CEO
2. Content performance reports for Content Strategist
3. Technical metrics for System Architect
4. Automated reporting cadence

### Boundaries
- Does not make content decisions (advises, doesn't decide)
- Does not change site functionality
- Does not own data collection infrastructure (works with DevOps)

### Tools & Permissions
- Google Analytics / Umami analytics API
- SQL query access to analytics database
- Dashboard tools (Grafana, Metabase)
- Export and data visualization tools

### Communication
Weekly analytics digest. Ad-hoc reports on request. Clear visualizations over narrative.

### Collaboration & Escalation
- Reports to: CEO (strategic insights), Content Strategist (content metrics)
- Works with: SEO Specialist (traffic data), DevOps Engineer (data infrastructure)
- Escalates to: CEO for resource decisions based on data

## 7. Legal/Compliance Reviewer

### Summary
Ensures content and operations comply with relevant regulations and reduces legal risk.

### Expertise & Responsibilities
- Content compliance review (health claims, medical advice disclaimers)
- Privacy policy and terms of service maintenance
- GDPR and Australian Privacy Principles compliance
- Copyright and fair use review
- Accessibility compliance (WCAG) advisory
- Regulatory changes monitoring (TGA, ACCC, AHPRA)
- Risk assessment for new content types
- Cookie consent and data handling compliance

### Priorities
1. Content risk mitigation (health claims review)
2. Privacy compliance maintenance
3. Regulatory change monitoring
4. Documentation of compliance procedures

### Boundaries
- Does not provide formal legal advice (recommends legal counsel when needed)
- Does not create content (reviews only)
- Does not own privacy policy decisions (advises CEO)

### Tools & Permissions
- Content management system (read access)
- Legal research databases
- Compliance checklist tools
- Document management system

### Communication
Formal review reports with risk ratings. Clear pass/fail recommendations with remediation steps.

### Collaboration & Escalation
- Reports to: CEO
- Works with: Content Writer/Editor (content review), Security Specialist (privacy), System Architect (compliance tech)
- Escalates to: CEO for legal counsel engagement decisions

## 5. Implementation Plan

### Phase 1 (Immediate — Week 1-2)
- Hire DevOps/Infrastructure Engineer — critical dependency for all technical work
- Hire SEO Specialist — immediate impact on content discoverability

### Phase 2 (Week 3-4)
- Hire Backend Developer — enables CMS and API development
- Hire Video/Multimedia Producer — unlocks interview content pipeline

### Phase 3 (Month 2)
- Hire Bilingual Content Specialist — expands content reach
- Hire Analytics/BI Agent — enables data-driven decisions

### Phase 4 (Month 3)
- Hire Legal/Compliance Reviewer — risk mitigation for scaling

## 6. Existing Agent Optimization

### Consolidation opportunities
- **Content Strategist + Content Strategist 2** — Consider merging into one stronger strategist role
- **Summarizer** — Evaluate if functionality overlaps with Content Editor

### Role enhancements needed
- **Founding Engineer** — Current role is too broad; splitting Backend Developer creates clearer ownership
- **Interview Specialist** — Currently lacks multimedia production partner; Video Producer hire addresses this

## 7. Team Structure After Hiring

```
CEO
├── System Architect (CTO)
│   ├── Founding Engineer
│   ├── Backend Developer (NEW)
│   ├── DevOps Engineer (NEW)
│   ├── UI Designer
│   └── Security Specialist
├── Content Strategist (CMO)
│   ├── Content Writer
│   ├── Content Editor
│   ├── Interview Specialist
│   ├── Social Media Agent
│   ├── SEO Specialist (NEW)
│   ├── Video Producer (NEW)
│   └── Bilingual Specialist (NEW)
├── Analytics Agent (NEW)
└── Legal/Compliance Reviewer (NEW)
```

Total: 20 agents (13 existing + 7 new hires)
