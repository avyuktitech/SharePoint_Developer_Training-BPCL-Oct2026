# SharePoint Developer Training – BPCL | October 2026

**SharePoint Online | SPFx | React | TypeScript | PnPjs | Microsoft Graph | Power Automate | Azure Integration**

Welcome to the **5-Day SharePoint Developer Training Repository**.

This repository contains training materials, practical demonstrations, hands-on exercises, mini-projects, Microsoft Graph API queries, datasets and capstone project resources designed to provide practical experience in SharePoint Online development and enterprise application integration.

The training focuses on building modern SharePoint solutions using SharePoint Framework (SPFx), React, TypeScript, PnPjs, Microsoft Graph API, Power Automate, Azure Blob Storage, Azure SQL Database and Microsoft Entra ID.

---

## 1. Training Overview

| Particulars | Details |
|---|---|
| Training | SharePoint Developer Training |
| Duration | 5 Days |
| Platform | Microsoft 365 / SharePoint Online |
| Frontend | React, TypeScript, HTML, CSS |
| Development Framework | SharePoint Framework (SPFx) |
| SharePoint Integration | PnPjs |
| API Integration | Microsoft Graph REST API |
| Workflow Automation | Power Automate |
| Cloud Integration | Microsoft Azure |
| Authentication | Microsoft Entra ID |
| Database | SharePoint Lists, Azure SQL |
| Storage | SharePoint Document Libraries, Azure Blob Storage |

## 2. Repository Structure

```text
SharePoint_Developer_Training-BPCL-Oct2026/
│
├── README.md
│
├── TOC_SharePoint_Developer_Training_5_Days_.pdf
│
├── DAY1/
│   ├── DAY-1-SharePoint_Developer_Training___Day_1.pdf
│   └── README.md
│
├── DAY2/
│   ├── DAY-2_SharePoint_Developer_Training___Day_2.pdf
│   └── README.md
│
├── DAY3/
│   ├── DAY-3_Sharepoint-APIs & Microsoft Graph.pdf
│   └── README.md
│
├── DAY4/
│   ├── Day_4__Advanced_SharePoint_Development.pdf
│   └── README.md
│
├── DAY5/
│   ├── Day_5__Deployment__Security___Capstone_Project.pdf
│   └── README.md
│
├── Mini-Project1/
│   ├── README.md
│   │
│   ├── hello-spfx/
│   ├── banking-spfx/
│   ├── bpcl-web-pane/
│   ├── tech-company-spfx/
│   ├── medical-spfx/
│   ├── natural-gas-spfx/
│   ├── petroleum-retail-spfx/
│   │
│   ├── pnp-task-tracker/
│   ├── pnp-employee-directory/
│   ├── pnp-my-workday/
│   ├── pnp-leave-requests/
│   │
│   ├── spfx-approval-extension/
│   │
│   ├── azure-blob-spfx/
│   └── azure-sql-spfx/
│
├── CAPSTONE-Project-1/
│   └── Capstone-1_Employee Document & Request Management Portal.pdf
│
├── Cabs.csv
├── Drivers.csv
├── YellowTaxis_append.csv
├── companies.csv
├── GRAPH-API-Queries_List_of_Queri.txt
└── CodeShareURL.txt
```

## 3. Five-Day Training Curriculum

### Day 1 – SharePoint Online & Development Fundamentals

- Introduction to SharePoint Online architecture.
- SharePoint Online vs SharePoint Server.
- SharePoint Sites, Lists and Document Libraries.
- Site columns, content types and views.
- SharePoint permissions and security model.
- SharePoint REST API fundamentals.
- Developer tools and development environment setup.
- Hands-on: Create SharePoint sites, lists, libraries, columns and permissions.

**Learning Outcome:** Understand SharePoint Online architecture and create foundational SharePoint solutions.

### Day 2 – SharePoint Framework (SPFx) & React Development

- Introduction to SharePoint Framework.
- SPFx architecture and development lifecycle.
- Node.js, npm and development environment.
- Yeoman generator and SPFx project scaffolding.
- React components and TypeScript fundamentals.
- SPFx Web Parts development.
- SharePoint page integration.
- Styling using CSS and Fluent UI.
- Hands-on: Build and deploy a custom SharePoint Web Part.

**Learning Outcome:** Develop modern SharePoint applications using SPFx, React and TypeScript.

### Day 3 – SharePoint APIs & Microsoft Graph

- SharePoint REST API.
- Microsoft Graph API architecture.
- Microsoft Graph Explorer.
- Microsoft Entra ID application registration.
- OAuth 2.0 authentication fundamentals.
- Microsoft Graph users and groups.
- User profiles and manager information.
- SharePoint sites, lists and document libraries using Graph.
- Calendar and email API integration.
- PnPjs introduction and integration.
- Hands-on: Retrieve SharePoint and Microsoft 365 data using REST APIs, Graph API and PnPjs.

**Learning Outcome:** Integrate SharePoint applications with Microsoft 365 services using APIs.

### Day 4 – Advanced SharePoint Development

- Advanced SPFx development.
- PnPjs integration and SharePoint CRUD operations.
- Microsoft Graph integration with SPFx.
- SharePoint ListView Command Sets.
- SharePoint extensions.
- Power Automate integration.
- Approval workflows and business process automation.
- Azure Functions integration.
- Azure Blob Storage integration.
- Azure SQL Database integration.
- Microsoft Entra ID authentication and authorization.
- Hands-on: Build enterprise-ready SharePoint applications.

**Learning Outcome:** Build advanced SharePoint applications with workflow automation, cloud services and secure API integrations.

### Day 5 – Deployment, Security & Capstone Project

- SPFx solution packaging.
- Generate `.sppkg` deployment packages.
- SharePoint App Catalog.
- Deploy and configure SPFx solutions.
- API permission approval.
- Microsoft Entra ID authentication and security.
- Application lifecycle management.
- Troubleshooting and debugging.
- Enterprise development best practices.
- Capstone project implementation and demonstration.

**Learning Outcome:** Deploy, secure and demonstrate complete SharePoint development solutions.

---

## 4. Mini-Projects – Hands-on Development

The `Mini-Project1` folder contains **14 independent SPFx sample projects** built using SPFx 1.23.2.

### A. SPFx & React Application Development

| Project | Description |
|---|---|
| `hello-spfx` | Starter Hello World Web Part generated using the SPFx Yeoman generator. |
| `banking-spfx` | Responsive banking landing page for fictional Horizon Bank. |
| `bpcl-web-pane` | React-based BPCL-inspired operations dashboard with facility selection and sample metrics. |
| `tech-company-spfx` | Technology company homepage for fictional Northstar Digital. |
| `medical-spfx` | Hospital operations dashboard for fictional CarePoint Health. |
| `natural-gas-spfx` | Natural gas pipeline dashboard for fictional Meridian Gas Network. |
| `petroleum-retail-spfx` | Fuel station network dashboard for fictional Apex Fuels Retail. |

### B. PnPjs & Microsoft Graph Integration

| Project | Description |
|---|---|
| `pnp-task-tracker` | SharePoint List CRUD operations using `@pnp/sp` and Microsoft Graph people picker. |
| `pnp-employee-directory` | Employee search, profile photos and manager lookup using `@pnp/graph`. |
| `pnp-my-workday` | Personal dashboard integrating Graph calendar, unread emails, recent files and SharePoint libraries. |
| `pnp-leave-requests` | Leave request management using SharePoint Lists, Graph manager lookup, email notifications and calendar events. |

**Microsoft Graph API Permissions:**

The Graph-integrated projects may require administrator approval of requested API permissions.

After uploading the SPFx package, a SharePoint administrator must review and approve the requested permissions through:

**SharePoint Admin Center → Advanced → API access**

Review each project's README for its specific permission requirements and scopes.

### C. SharePoint Extensions & Power Automate

| Project | Description |
|---|---|
| `spfx-approval-extension` | SharePoint ListView Command Set that submits purchase requests to a Power Automate approval workflow. |

Key concepts:

- SPFx ListView Command Sets.
- SharePoint list integration.
- Power Automate cloud flows.
- Approval workflow configuration.
- Business process automation.

### D. Azure Cloud Integration

| Project | Description |
|---|---|
| `azure-blob-spfx` | Browse files, images and text stored in Azure Blob Storage using the signed-in user's Microsoft Entra ID token. |
| `azure-sql-spfx` | Browse Azure SQL Database tables, files and images through a secured Azure Functions API. |

Key concepts:

- Azure Blob Storage.
- Azure SQL Database.
- Azure Functions.
- REST API integration.
- Microsoft Entra ID authentication.
- Secure cloud resource access.

Both projects include built-in sample data and can be executed independently. Follow their individual README files to configure Azure resources and connect to live services.

---

## 5. Capstone Project

### Employee Document & Request Management Portal

**Project Folder:** `CAPSTONE-Project-1/`

**Reference Document:** `Capstone-1_Employee Document & Request Management Portal.pdf`

**Objective:**

Design and develop an enterprise Employee Document & Request Management Portal using SharePoint Online and SPFx.

Suggested functional areas:

1. Employee dashboard.
2. Employee document management.
3. Document upload and download.
4. Employee request submission.
5. Request status tracking.
6. Manager approval workflow.
7. SharePoint List integration.
8. Microsoft Graph API integration.
9. Power Automate approval notifications.
10. Role-based access and security.

**Expected Deliverables:**

- Functional SharePoint application.
- SPFx Web Parts.
- SharePoint Lists and Document Libraries.
- Power Automate workflow.
- Microsoft Graph integration.
- Deployment package.
- Project documentation and demonstration.

Refer to the capstone PDF for the detailed requirements and implementation guidelines.

---

## 6. Reference Files & Datasets

The repository includes supporting reference materials:

| File | Purpose |
|---|---|
| `TOC_SharePoint_Developer_Training_5_Days_.pdf` | Complete 5-day training table of contents. |
| `GRAPH-API-Queries_List_of_Queri.txt` | Microsoft Graph API query reference. |
| `CodeShareURL.txt` | Code-sharing and reference URLs. |
| `Cabs.csv` | Sample cab dataset. |
| `Drivers.csv` | Sample driver dataset. |
| `YellowTaxis_append.csv` | Sample yellow taxi dataset. |
| `companies.csv` | Sample company dataset. |

These datasets can be used for demonstrations, API exercises, data processing and application development.

---

## 7. Development Environment & Prerequisites

Recommended development tools:

- Node.js version compatible with SPFx 1.23.2.
- npm.
- Visual Studio Code.
- SharePoint Framework 1.23.2.
- TypeScript.
- React.
- SharePoint Online Developer Site.
- Microsoft 365 Developer / Training Tenant.
- Microsoft Graph Explorer.
- Microsoft Entra ID access.
- Azure subscription for Azure integration projects.

**Important:** Check each project's `package.json` and README for its exact runtime and dependency requirements. Do not assume that all projects use the same Node.js version.

---

## 8. How to Run Mini-Projects

Each mini-project is an independent SPFx application.

### Step 1 – Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

### Step 2 – Navigate to the Mini-Project Folder

Example:

```bash
cd SharePoint_Developer_Training-BPCL-Oct2026/Mini-Project1/hello-spfx
```

### Step 3 – Install Dependencies

```bash
npm install
```

### Step 4 – Run the Development Server

```bash
npm start
```

### Step 5 – Build the SPFx Solution

```bash
npm run build
```

### Step 6 – Package the SharePoint Solution

For projects configured with the standard SPFx packaging scripts:

```bash
gulp bundle --ship
gulp package-solution --ship
```

The generated SharePoint solution package is typically available under:

```text
sharepoint/solution/*.sppkg
```

**Note:** Follow the individual project README for any additional configuration, environment variables, Azure setup or deployment instructions.

---

## 9. Integration Architecture

The training demonstrates how different Microsoft technologies work together to build enterprise applications.

```text
                 END USERS
                     |
                     v
             SHAREPOINT ONLINE
                     |
                     v
           SHAREPOINT FRAMEWORK
                  (SPFx)
                     |
              REACT + TYPESCRIPT
                     |
          +----------+-----------+
          |          |           |
          v          v           v
       PnPjs     Microsoft    Power
                   Graph     Automate
          |          |           |
          |          v           |
          |     Microsoft       |
          |     Entra ID        |
          |          |           |
          +----------+-----------+
                     |
              AZURE INTEGRATION
                     |
          +----------+-----------+
          |          |           |
          v          v           v
        Azure     Azure SQL   REST APIs
        Blob      Database    & Functions
        Storage
```

This architecture illustrates the integration possibilities covered in the training. Individual projects implement selected components rather than necessarily implementing the entire architecture.

---

## 10. Learning Outcomes

By completing this training and hands-on exercises, participants will gain practical experience in:

- SharePoint Online architecture and administration fundamentals.
- Modern SharePoint application development using SPFx.
- React and TypeScript integration.
- SharePoint REST API and Microsoft Graph API.
- PnPjs-based SharePoint operations.
- Microsoft 365 integration.
- Power Automate workflow development.
- SharePoint extensions.
- Azure Functions and serverless API integration.
- Azure Blob Storage and Azure SQL Database.
- Microsoft Entra ID authentication and authorization.
- SPFx packaging, deployment and security.
- Enterprise application development and integration.

---

## 11. Important Notes

1. Each mini-project is independently maintained and can be executed from its respective folder.
2. Review the individual project README before running or deploying an application.
3. Microsoft Graph API integrations may require administrator consent.
4. Azure integration projects require appropriate Azure resource configuration for live connectivity.
5. Demonstration dashboards use sample data and are not connected to actual financial, medical or operational systems.
6. Never commit client secrets, passwords, access tokens, connection strings or other sensitive credentials to GitHub.
7. Use Microsoft Entra ID authentication and appropriate access controls when connecting to enterprise resources.

---

## 12. Repository Navigation

| Resource | Location |
|---|---|
| Training Curriculum | `DAY1/` to `DAY5/` |
| Training TOC | Root directory |
| SPFx Mini-Projects | `Mini-Project1/` |
| Capstone Project | `CAPSTONE-Project-1/` |
| Graph API Query Reference | `GRAPH-API-Queries_List_of_Queri.txt` |
| Sample Datasets | Root directory |
| Project Instructions | Individual project `README.md` files |

---

**Happy Learning & Happy Coding!**

*SharePoint Developer Training – BPCL | October 2026*

**Technologies:** Microsoft SharePoint Online | SPFx | React | TypeScript | PnPjs | Microsoft Graph | Power Automate | Azure | Microsoft Entra ID
