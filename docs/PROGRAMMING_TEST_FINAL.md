# Senior Fullstack Engineer — Intelligent Order Processing System (AI-Native Evolution)

## Context

beecrowd, in partnership with Winter, is expanding its e-commerce operations to modern ecosystems based on AI-native architectures. We currently have a legacy microservice for processing and managing customer orders. With the growth of the user base, it became critical to evolve this system to the distributed cloud environment and to couple an artificial intelligence agent capable of triage, answer contextual questions, and make transactional decisions based on the company's policies.

As a senior engineer, you will be provided with the specification of this basic ecosystem and must implement the core flows of the backend integrating advanced features of LLMs (such as RAG and Function Calling). You will operate in a scenario where the use of AI code assistants (Cursor AI, Copilot, Claude) is encouraged, and you must audit the generated responses and justify your technical choices through a structured technical document.

---

## Functional Requirements

- **FR-001 — Order Creation and Listing:** Allow the creation of an order composed of multiple items (each item containing product ID, quantity and unit price). The system must provide the general listing of these records with the option to filter by status.

- **FR-002 — Details Retrieval:** Provide detailed consultation of an order through its unique identifier (Order ID).

- **FR-003 — Automatic Transition of Status (Background Job):** Implement a background routine that automatically selects and updates all orders with `PENDING` status to the `PROCESSING` state every 5 minutes.

- **FR-004 — Transactional Cancellation Rule:** Allow manual cancellation of orders by the customer, as long as the registration status is strictly equal to `PENDING`. If the order is in any other state (`PROCESSING`, `SHIPPED`, `DELIVERED`), the requisition must be rejected by the business logic.

- **FR-005 — Intelligent Support Agent (Conversational Interface):** Develop a natural language-based chat endpoint. The AI must process user input, contextualize the call by injecting the corporate policies contained in `knowledge_base.json`, cross-reference the information with the actual status of the customer's order, and autonomously decide whether:
  - Performs the automatic cancellation of the order in the bank via structured function call (Tool Calling), if the user requests it and the business rules allow it.
  - Generates an AI-based explanatory response denying the action if organizational locks are breached or if it is just a general question (RAG).

---

## Non Functional Requirements

- **Concurrency in Distributed Environments:** The state-changing background job must be resilient and immune to race conditions, assuming that the microservice will be scaled across multiple instances within a Kubernetes cluster.

- **Prompt Injection Security and Mitigation:** The support agent pipeline should have conceptual and logical guardrails to avoid Prompt Injection scenarios where the customer manipulates textual input to circumvent status rules.

- **LLM Observability:** The console or application log files should record the metadata of the AI transactions (token consumption per call, model response time, and intents detected).

- **Technological Isolation:** The entire ecosystem (database, messaging cache, jobs, and APIs) must boot locally in an agnostic way to operating systems via Docker Compose.

---

## Technical Requirements

The candidate must mandatorily select **one** of the following languages and ecosystems to implement their solution:

- **Python:** FastAPI + SQLAlchemy / Tortoise ORM + Bibliotecas de IA (SDK Nativo da OpenAI/Anthropic, LangChain ou LlamaIndex).
- **Java:** Spring Boot + Spring Data JPA + Spring AI ou LangChain4j.
- **TypeScript:** Next.js (App Router / API Routes) + Prisma ORM + Vercel AI SDK.

### Required Infrastructure

- Docker e Docker Compose.
- Relational database (PostgreSQL/MySQL) or NoSQL configured via local containers.

---

## Input Assets

| Asset | Description |
|-------|-------------|
| `swagger.json` | Structured contract describing the REST routes for creation, querying, and the AI agent chat endpoint. |
| `knowledge_base.json` | JSON file with the corporate cancellation policies, deadlines, and compliance rules for the RAG pipeline. |

### Example of `knowledge_base.json`

```json
[
  {
    "context": "Order Cancellations",
    "rule": "Order cancellation is a consumer right applicable only as long as the internal status of the order is listed as PENDING in the database. If the order has progressed to PROCESSING, SHIPPED or DELIVERED, the automated support is strictly forbidden to carry out the operation."
  },
  {
    "context": "Update Window",
    "rule": "New orders enter the PENDING state and wait for payment validation. A background process transitions orders to PROCESSING rigidly every 5 minutes."
  }
]
```

---

## Deliveries

### Schedule

- **GitHub repository:** Repository link containing all development history through clean and organized commits.
- **Complete Source Code:** Functional implementation of the Backend API, the Background Job and the Artificial Intelligence orchestration layer in the stack of choice.
- **Containerized Environment:** A `docker-compose.yml` file containing the database and microservice orchestration for unified execution.
- **Automated Testing:** Unit or integration test suite covering order status transition validations and AI pipeline tool calling flows.
- **Software Design Document (SDD) & GenAI Report:** Document `README.md` in the repository describing the architectural choices of the database, distributed concurrency and a dedicated section mapping the use of generative AIs in development (tools used, prompts generated, technical failures and hallucinations of the assisted models and how the engineer performed the correction).

---

## Evaluation Criteria

| Criteria | Weight |
|----------|--------|
| Software Architecture and Backend Resiliency (Code Quality, Distributed Job Concurrency and Dockerization) | 30 |
| AI Engineering and Responsible AI (Prompt Structuring, RAG/Contextualization, Secure Tool Calling and logs) | 30 |
| Automated Testing Strategy (Quality assurance in business-critical transactions and error scenarios) | 20 |
| Technical Maturity and GenAI Report (Technical depth in writing SDD and critical thinking when guiding code wizards) | 20 |
| **Total** | **100** |

---

## What We Care About

- **Operational Autonomy:** The project should go up with simplified commands (`docker compose up`) depending solely on environment variables configured in an `.env` file.
- **Determinism Principle in the Backend:** Clear understanding that AI supports support, but transactional security validations and locks need to be performed rigidly in traditional deterministic code.
- **Competition Management Distribution:** How the candidate solves the activation of scheduled competing routines without generating duplication of states.

## What We Don't Care About

- **Complex Graphical Interface:** The test evaluates backend and applied AI engineering competencies. Complex screens or CSS polishing will not be scored; functional route documentations (Swagger) or clean JSON returns via chat do the job.
- **Active Cloud Provider:** It is not necessary to perform actual deployment on commercial cloud platforms (AWS/Azure/GCP). All simulated infrastructure in local Docker containers meets the goals of the test.
