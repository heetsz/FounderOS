# FounderOS — Google Stitch Frontend Design Brief

## 1. What you are designing

Design a polished desktop-first web application called **FounderOS**.

FounderOS is a persistent-memory, multi-agent operating system for startup
founders. It gives founders one workspace where Research, Strategy, and
Execution agents share project knowledge through a visible knowledge graph.

The product should feel like a premium founder workspace: focused, calm,
intelligent, evidence-driven, and operational. It should not look like a
generic chatbot, a developer console, or a futuristic sci-fi dashboard.

Create the complete product experience and all major screens described in this
brief. Use realistic demo content and make the screens feel connected as one
application.

The visual design will later be implemented as a React frontend connected to a
FastAPI backend. For now, focus on the interface, information architecture,
interaction design, responsive layout, and visual system.

---

## 2. Core product promise

FounderOS helps a founder:

1. Research a market or customer problem with the Research Agent.
2. Preserve findings and source evidence in shared project memory.
3. Start a fresh session with the Strategy Agent.
4. Let Strategy reuse earlier research without pasting the old transcript.
5. Create an evidence-linked recommendation and draft decision.
6. Convert an approved decision into execution tasks.
7. Detect when new evidence contradicts an earlier decision.
8. Show the actual evidence path behind an answer.
9. Hand work between agents using a compact Context Passport.

The product must make shared memory and evidence visible. The founder should
always understand:

- Which agent is working.
- What the agent is doing now.
- Which project records were retrieved.
- Which sources support the answer.
- What is certain, uncertain, or only a recommendation.
- Which decisions and tasks may be affected by new evidence.

---

## 3. Important product concepts

### 3.1 Project

A startup or initiative containing:

- Name
- Description
- Goals
- Constraints
- Current status
- Conversations
- Findings
- Sources
- Decisions
- Tasks
- Alerts

Use the demo project:

**Parakh AI**

Demo description:

> An AI product helping early-stage teams understand customer behavior and
> improve repeat usage.

### 3.2 Agents

There are three agents:

#### Research Agent

Gathers and organizes evidence. It produces findings, sources, uncertainty,
contradictory evidence, and open questions. It should not make unsupported
business decisions.

Suggested accent: blue.

#### Strategy Agent

Synthesizes project evidence and recommends what the founder should do next.
It produces recommendations, alternatives, assumptions, risks, and draft
decisions that require founder approval.

Suggested accent: violet or purple.

#### Execution Agent

Converts an approved decision into clear, dependency-aware tasks. It does not
perform irreversible external actions.

Suggested accent: green.

### 3.3 Knowledge graph

The backend uses FalkorDB as the shared graph memory. The frontend should make
the graph understandable without requiring the user to know database
terminology.

Important record types:

- Project
- Conversation
- Message
- Agent Run
- Finding
- Source
- Decision
- Task
- Open Question
- Context Passport
- Drift Alert

Important visible relationships:

```text
Source → supports → Finding
Finding → informs → Decision
Decision → implements → Task
Finding → contradicts → Finding
Finding → affects → Decision
Decision → affects → Task
Agent Run → produced → Finding / Decision / Task
Agent Run → hands off to → Context Passport
Context Passport → cites → Finding / Source / Decision / Task
```

### 3.4 Evidence path

For every important recommendation, show a readable path such as:

```text
Customer interviews
  → Onboarding friction finding
  → Shorter onboarding decision
  → Three-step prototype task
```

Never present a decorative graph with unexplained lines. Every displayed
relationship should have a readable label or explanation.

### 3.5 Context Passport

A Context Passport is a compact handoff summary between agents. It contains
references to records rather than copying an entire conversation.

Example:

```text
From: Research Agent
To: Strategy Agent
Objective: Recommend the next repeat-usage experiment
Evidence: 3 findings, 2 sources
Current decisions: 1
Open questions: 2
Memory version: 18
```

The interface should show the passport as an inspectable panel or card.

### 3.6 Decision Drift Radar

When new evidence may weaken or contradict an existing decision, show an alert.

Example:

> New evidence may weaken “Test shorter onboarding”.

The alert should show:

- New evidence
- Earlier evidence or decision
- Why the relationship was detected
- Confidence or uncertainty
- Affected decisions
- Affected tasks
- Review action

The UI must clearly communicate that approved decisions are not silently
changed. The founder must review the alert.

---

## 4. Target user

Primary user: a startup founder or small founding team.

The user is busy, strategic, and not necessarily technical. They need to move
from evidence to decisions to execution quickly. The interface should be
information-rich but not overwhelming.

Tone:

- Clear
- Direct
- Trustworthy
- Calm
- Practical
- Evidence-oriented

Avoid:

- Excessive AI buzzwords
- Overly playful mascot-driven design
- Neon cyberpunk styling
- Dense developer tooling
- Unexplained confidence scores
- Chat-only interaction

---

## 5. Design direction

Create a premium dark desktop workspace with strong readability and a warm
founder-oriented feel.

### Recommended visual language

- Dark charcoal or deep navy application shell
- Warm off-white primary text
- Muted slate secondary text
- One warm accent such as amber/gold for important founder actions
- Blue, violet, and green accents for agent roles
- Red/orange used sparingly for Drift Radar alerts
- Subtle borders and elevated panels
- Soft rounded corners, approximately 10–14px
- Restrained shadows and glow
- Strong spacing and clear hierarchy
- Editorial typography for prominent headings
- Highly legible UI typography for data and controls

Suggested palette:

```text
App background:       #0B0F14
Sidebar background:    #10161E
Panel background:      #151C25
Elevated panel:        #1B2430
Primary text:          #F4F1EA
Secondary text:        #98A2B3
Muted text:            #667085
Border:                #273241
Warm accent:           #D9A441
Research blue:         #5EA7FF
Strategy violet:       #A78BFA
Execution green:       #5CCB91
Warning amber:         #F5B94C
Danger coral:          #F4776B
```

The design can use a light theme alternative if it remains consistent, but
the primary concept should be dark mode.

---

## 6. Global application shell

Design a persistent three-zone application shell.

### Left sidebar: navigation and project context

Width: approximately 250–280px.

Contents:

1. FounderOS logo and wordmark
2. Workspace or tenant name
3. Project switcher
   - Current project: Parakh AI
   - Project status indicator
   - Dropdown to switch projects
4. Main navigation
   - Overview
   - Conversations
   - Memory
   - Decisions
   - Tasks
   - Drift Radar
5. Small “Graph memory” status row
   - “Connected”
   - Number of records
   - Optional FalkorDB/graph icon
6. User profile area
   - Founder avatar
   - “Demo Founder”
   - Settings menu

Use simple line icons and clear active-state styling.

### Main content area

The main content area changes by route. It should support:

- Page header
- Breadcrumb or section label
- Primary action
- Main workspace
- Tables, cards, chat, timelines, or graph panels

### Right inspector

On relevant screens, show a collapsible inspector panel approximately 320–380px
wide. It should contain contextual information:

- Retrieved memory
- Sources
- Evidence path
- Context Passport
- Decision details
- Alert details

The inspector can collapse to maximize the workspace.

---

## 7. Required screens

Design all of the following screens and the interactions between them.

## Screen 1: Project Overview dashboard

Route concept: `/overview`

### Purpose

Give the founder a quick view of the current state of the startup project.

### Header

Title:

> Good morning, Founder

Subtitle:

> Here’s what changed in Parakh AI since your last session.

Actions:

- `New conversation`
- `Run an agent`

### Top metrics

Use four compact metric cards:

1. Active decisions
   - `4`
2. Open tasks
   - `8`
3. Memory records
   - `42`
4. Drift alerts
   - `2`

Each card should include a small trend or context label, not meaningless
charts.

### Main dashboard sections

#### Current focus card

Title:

> Validate repeat usage before scaling acquisition

Show:

- Decision status: Approved
- Evidence count
- Related task count
- Last updated time
- `View decision` action

#### Recent agent activity

Timeline items:

- Research Agent saved 3 findings
- Strategy Agent drafted a recommendation
- Execution Agent created 2 tasks
- New evidence triggered a Drift Radar alert

Each item includes agent icon, timestamp, status, and link.

#### Open Drift Radar alerts

Show 2 alert cards with severity, affected decision, and `Review` action.

#### Active task preview

Show a compact task list with status chips:

- Define repeat-usage success metric — In progress
- Build three-step onboarding prototype — To do
- Recruit five test users — Blocked

#### Memory pulse

Show a small visual summary:

- Findings
- Sources
- Decisions
- Tasks

Use a clean bar or segmented visualization instead of a complex chart.

---

## Screen 2: Chat and Agent Run workspace

Route concept: `/conversations/:id`

### Purpose

Let the founder ask an agent a question while making retrieval, evidence, and
workflow state visible.

### Layout

Three columns:

1. Conversation list
2. Main chat
3. Context inspector

### Conversation list

Header:

> Conversations

Items:

- Customer pain points research
- Next repeat-usage experiment
- Onboarding prototype planning

Each item shows:

- Title
- Agent type
- Last updated time
- Small status dot

Button:

- `+ New conversation`

### Chat header

Show:

- Conversation title
- Agent selector
- Current agent identity
- Provider/model label, e.g. `Gemini · Strategy`
- Run status

Agent selector options:

- Research Agent
- Strategy Agent
- Execution Agent

### Chat content

Include realistic conversation:

Founder:

> Use our previous customer research to recommend the next experiment for
> repeat usage.

Strategy Agent:

> Based on the onboarding friction finding and the recent customer interview
> evidence, I recommend running a focused three-step onboarding experiment
> before increasing acquisition spend.

The answer must visually separate:

- Recommendation
- Supporting evidence
- Assumptions
- Risks
- Open questions
- Proposed tasks

Do not show all of these as one large paragraph.

### Answer actions

Buttons:

- `Why this answer?`
- `Save as decision`
- `Create tasks`
- `Copy`
- `Ask follow-up`

The primary action should be `Why this answer?` or `Save as decision`,
depending on the answer state.

### Agent run status timeline

When an agent is working, show a compact status timeline:

```text
✓ Scope resolved
✓ Retrieved 6 memory records
✓ Built Context Passport
● Comparing evidence
○ Saving recommendation
```

Use accessible labels and do not rely on animation alone.

### Composer

Bottom input:

Placeholder:

> Ask an agent about this project...

Controls:

- Agent selector
- Attach/reference records
- Send button

Add helper text:

> Agents use shared project memory. Important recommendations show their
> evidence path.

---

## Screen 3: Memory Explorer

Route concept: `/memory`

### Purpose

Let the founder browse, search, filter, and inspect the project’s shared
knowledge.

### Header

Title:

> Shared memory

Subtitle:

> The facts, evidence, decisions, and work FounderOS has saved for this project.

Actions:

- `Search memory`
- `Export project context`

### Filter bar

Filters:

- All types
- Findings
- Sources
- Decisions
- Tasks
- Agent runs
- Recent activity
- Agent

Search placeholder:

> Search findings, decisions, sources, and tasks...

### Memory record list

Each record card/list row should show:

- Record type icon
- Title
- Short summary or claim
- Epistemic status:
  - Observed
  - Reported
  - Inferred
  - Hypothesis
- Confidence indicator, clearly labeled as confidence rather than truth
- Source count
- Related record count
- Agent that created it
- Timestamp

Example finding:

```text
Onboarding friction
Long onboarding may reduce repeat usage.
Reported · 72% confidence
Supported by 2 sources · Created by Research Agent
```

### Memory detail drawer

When a record is selected, open a right drawer showing:

- Full record title and content
- Type and status
- Source references
- Related findings
- Related decisions
- Related tasks
- Created by agent/run
- Version and updated timestamp
- `Open graph path`
- `Mark as incorrect`
- `Supersede`

---

## Screen 4: Knowledge Graph Explorer

Route concept: `/memory/graph`

### Purpose

Make relationships across project data visible.

### Layout

- Large graph canvas on the left
- Selected node inspector on the right
- Relationship legend
- Accessible relationship list below or as a toggle

### Graph behavior

Display a bounded graph, not an infinite canvas. Start with this demo path:

```text
Demo customer interviews
  → supports →
Onboarding friction
  → informs →
Test shorter onboarding
  → implements →
Build three-step onboarding prototype
```

Nodes should have different colors/icons by type:

- Source: blue document icon
- Finding: light blue insight icon
- Decision: amber compass/check icon
- Task: green checkbox icon
- Alert: coral warning icon
- Agent run: violet spark/icon

Edges should have labels on hover or selection.

### Graph controls

- Zoom in/out
- Fit to view
- Reset
- Expand one hop
- Focus on selected record
- `List view` alternative

### Graph side panel

When a node is selected show:

- Name
- Type
- Summary
- Why it is connected
- Related records
- `Open record`
- `Show path to answer`

---

## Screen 5: Decision details

Route concept: `/decisions/:id`

### Purpose

Show how a decision was formed and what work depends on it.

### Header

Title:

> Test shorter onboarding

Status:

- Approved

Actions:

- `Review evidence`
- `Edit proposal`
- `Supersede`

Do not show editing as if an approved decision can be silently changed.

### Main content

#### Decision summary

Rationale:

> Validate repeat usage before scaling acquisition.

#### Evidence section

Show source and finding cards with relationship labels:

- Supported by
- Informed by
- Contradicts

#### Assumptions and risks

Display as separate cards.

#### Affected tasks

Show task list with:

- Task name
- Status
- Owner
- Dependency indicator

#### Approval history

Timeline:

- Draft created by Strategy Agent
- Reviewed by Demo Founder
- Approved on October 17, 2026

#### Provenance path

Show:

```text
Source → Finding → Decision → Task
```

Use a visually clear horizontal chain or vertical timeline.

---

## Screen 6: Task Board

Route concept: `/tasks`

### Purpose

Turn approved decisions into visible execution.

### Kanban columns

- To do
- In progress
- Blocked
- Done

### Task card

Show:

- Task title
- Short description
- Owner agent or person
- Parent decision
- Dependencies
- Acceptance criteria count
- Version indicator
- Last updated time

Example:

```text
Build a three-step onboarding prototype
Owner: Execution Agent
Implements: Test shorter onboarding
Acceptance criteria: 3
```

### Task actions

- Drag or status update
- Open details
- Claim task
- View dependencies
- Create handoff

Use clear warnings for blocked tasks and stale updates.

### Task detail drawer

Show:

- Description
- Acceptance criteria
- Dependencies
- Related decision
- Evidence path
- Handoff status
- Activity history

---

## Screen 7: Drift Radar inbox

Route concept: `/drift-radar`

### Purpose

Show evidence that may affect decisions or execution.

### Header

Title:

> Decision Drift Radar

Subtitle:

> New evidence that may weaken, contradict, or update existing decisions.

Use a short explanation:

> FounderOS never silently changes an approved decision. Review each alert and
> decide what should happen next.

### Alert list

Each alert card shows:

- Severity
- Open/reviewed status
- New evidence
- Affected decision
- Affected tasks count
- Explanation
- Confidence
- Created time

Example:

```text
Medium · Review needed
New evidence may weaken “Test shorter onboarding”

New finding:
Users who completed the shorter flow still did not return during week two.

Potential impact:
1 decision · 2 tasks

Why this was flagged:
The new finding conflicts with the assumption that shorter onboarding alone
will improve repeat usage.
```

Actions:

- `Review`
- `Dismiss`
- `Propose revised decision`
- `Open evidence path`

### Alert review modal/drawer

Show the old and new evidence side by side or in a comparison timeline.

The review action must be explicit:

- Mark reviewed
- Dismiss as unrelated
- Convert to a revised decision proposal

---

## Screen 8: Context Passport panel

This can be a standalone screen or a modal opened from an agent run.

### Purpose

Make agent handoffs transparent.

### Content

Header:

> Context Passport

Fields:

- Passport ID
- From agent
- To agent
- Objective
- Memory version
- Created time

Referenced records:

- Findings
- Sources
- Decisions
- Open questions
- Next task

Actions:

- `Open graph context`
- `Open source records`
- `Continue with this agent`
- `Copy reference summary`

Include this explanation:

> This passport contains references to shared project memory. The receiving
> agent re-checks access to every record before using it.

---

## Screen 9: Project export flow

Design a modal or page for exporting project context.

Export options:

1. Complete project graph
2. Agent context bundle
3. Provenance paths
4. Audit history

Each option needs:

- Short description
- Estimated record count
- JSON format label
- Confirmation action

Example:

> Agent context bundle  
> Export the bounded findings, sources, decisions, and tasks needed for a
> future agent handoff.

Show a success state:

> Export prepared

Never expose API keys or secrets in exports.

---

## 8. First-run and empty states

Design helpful states for:

### No projects

Title:

> Start with a project

Description:

> Create a project so your agents have a shared place to research, decide, and
> execute.

Action:

- `Create project`

### No conversations

Title:

> Start your first research session

Action:

- `Ask Research Agent`

### No memory records

Title:

> Your shared memory is empty

Description:

> Research findings, sources, decisions, and tasks will appear here as your
> team works.

### No alerts

Title:

> No decision drift detected

Description:

> New evidence that may affect decisions will appear here.

### No tasks

Title:

> No execution tasks yet

Description:

> Approve a decision or ask the Execution Agent to create a plan.

---

## 9. Loading, error, and permission states

Design explicit states for:

- Loading project dashboard
- Loading graph
- Loading agent response
- Agent provider timeout
- FalkorDB unavailable
- Failed to save a finding
- Failed to save a task because its version is stale
- Permission denied
- Empty search result
- Invalid or missing record
- Export failure

Example provider error:

> The Strategy Agent could not complete this run because the model provider
> timed out. Your saved project memory is safe.

Actions:

- `Retry`
- `View run details`
- `Continue without agent`

Example graph error:

> Graph memory is temporarily unavailable. Existing project data is not
> deleted. Try again in a moment.

Do not present errors as successful empty states.

---

## 10. Responsive behavior

Primary target: desktop at 1440px wide.

Also design responsive behavior for 1280px and tablet widths.

At narrower widths:

- Collapse the right inspector into a drawer
- Collapse the left sidebar into a navigation drawer
- Keep chat composer accessible
- Convert graph canvas to a list view when space is limited
- Convert kanban board to horizontally scrollable columns
- Keep important evidence and alert actions visible

The product should remain usable at approximately 1024px wide.

---

## 11. Accessibility requirements

- Use semantic headings and landmarks.
- Maintain strong color contrast.
- Never communicate status by color alone.
- Provide text labels for graph relationships.
- Provide a list alternative to the graph canvas.
- Make keyboard focus visible.
- Ensure all dialogs and drawers can be closed with Escape.
- Use accessible labels for icon-only controls.
- Make agent status understandable without animation.
- Do not use tiny text for evidence, confidence, or timestamps.

---

## 12. Important interaction rules

1. An approved decision must never look silently editable.
2. Confidence must be labeled as model or evidence confidence, not truth.
3. Findings must distinguish observed facts, reported claims, inferences, and
   hypotheses.
4. Every important recommendation should have a `Why this answer?` path.
5. Evidence paths must display actual relationships, not decorative arrows.
6. Alerts should explain uncertainty and avoid alarmist language.
7. Agent output should clearly show when it is a draft or requires approval.
8. Saved state should be confirmed only after persistence succeeds.
9. Do not expose provider API keys or infrastructure secrets.
10. The founder remains the decision owner.

---

## 13. Demo data to use in the design

Use these records throughout the screens so the prototype feels coherent.

### Project

```text
Name: Parakh AI
Goal: Validate repeat usage before scaling acquisition
Constraint: Small founding team
Status: Active
```

### Source

```text
Title: Demo customer interviews
Type: Customer interview notes
Excerpt: Customers describe setup as longer than expected and often postpone
returning to the product.
```

### Finding

```text
Title: Onboarding friction
Claim: Long onboarding may reduce repeat usage.
Status: Reported
Confidence: 72%
Supported by: Demo customer interviews
```

### Decision

```text
Title: Test shorter onboarding
Rationale: Validate repeat usage before scaling acquisition.
Status: Approved
```

### Tasks

```text
Build a three-step onboarding prototype — To do
Define repeat-usage success metric — In progress
Recruit five test users — Blocked
```

### Drift alert

```text
Title: New evidence may weaken “Test shorter onboarding”
New finding: Users who completed the shorter flow still did not return during
week two.
Affected decision: Test shorter onboarding
Affected tasks: 2
Status: Review needed
```

### Agent activity

```text
Research Agent saved 3 findings
Strategy Agent drafted a recommendation
Execution Agent created 2 tasks
System detected potential decision drift
```

---

## 14. Prototype navigation

Make these flows clickable in the generated design:

### Flow A: Research to memory

1. Open Parakh AI overview.
2. Click `New conversation`.
3. Select Research Agent.
4. Enter: “Investigate customer pain points around repeat usage.”
5. Show the agent run timeline.
6. Show saved findings and sources.
7. Open `Memory`.

### Flow B: Memory to strategy

1. Start a fresh conversation.
2. Select Strategy Agent.
3. Enter: “Use our previous customer research to recommend the next
   experiment.”
4. Show retrieved memory in the inspector.
5. Show the Context Passport.
6. Show the recommendation.
7. Click `Why this answer?`.
8. Show Source → Finding → Decision → Task.

### Flow C: Drift Radar

1. Open Drift Radar.
2. Select the alert about shorter onboarding.
3. Compare old and new evidence.
4. Open the affected decision.
5. Show affected tasks.
6. Review or dismiss the alert.
7. Make clear that the approved decision remains unchanged until the founder
   creates and approves a revision.

### Flow D: Execution handoff

1. Open the approved decision.
2. Click `Create tasks`.
3. Select Execution Agent.
4. Show Context Passport references.
5. Show generated tasks on the board.

---

## 15. Component inventory

Design a reusable component system containing:

- App shell
- Sidebar
- Project switcher
- Top bar
- Page header
- Metric card
- Agent badge
- Agent selector
- Run status timeline
- Chat message
- Evidence chip
- Source card
- Finding card
- Decision card
- Task card
- Alert card
- Context Passport card
- Provenance path
- Graph node
- Graph relationship
- Search and filter bar
- Status badge
- Confidence indicator
- Approval timeline
- Drawer
- Modal
- Toast
- Empty state
- Error state
- Loading skeleton

Keep spacing, border radius, typography, badges, and icon usage consistent
across all screens.

---

## 16. Visual quality bar

The final Stitch concept should communicate:

- This is a serious founder operating system.
- The agents are useful because they share memory.
- The graph is understandable and inspectable.
- Evidence is more important than confident-sounding text.
- Recommendations are connected to decisions and execution.
- The founder remains in control.

Prioritize a high-quality overview dashboard, chat workspace, memory explorer,
graph/provenance view, decision detail view, task board, and Drift Radar inbox.

Generate realistic connected screens rather than isolated mockups.

