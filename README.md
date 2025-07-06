# EasePM

> A comprehensive micro CRM, project and invoice management solution for very small companies

EasePM is a desktop application built with Electron and Vue.js that provides essential business management tools for
small businesses, freelancers, and solo entrepreneurs. Manage your customers, projects, tasks, time tracking, and
invoicing all in one place.

## ✨ Features

### 📋 Project Management

- **Project Creation & Management** - Create and organize projects with detailed information
- **Task Management** - Create, assign, and track tasks within projects
- **Kanban Board** - Visual project management with drag-and-drop task organization
- **Time Tracking** - Built-in time tracker for accurate project billing

### 👥 Customer Management

- **Customer Database** - Store customer information and contact details
- **Customer-Project Association** - Link customers to specific projects
- **Customer Analytics** - Track customer engagement and project history

### 📊 Analytics & Reports

- **Dashboard** - Overview of key metrics and project status
- **Time Sheets** - Generate detailed time reports for billing
- **Project Reports** - Track project progress and profitability
- **Custom Analytics** - Analyze business performance with charts

### 💰 Invoice Management

- **Invoice Generation** - Create professional invoices with PDF export
- **Invoice Templates** - Customizable invoice layouts and branding
- **Invoice Tracking** - Monitor invoice status and payments
- **Line Item Management** - Detailed billing with multiple line items

### 🔧 System Features

- **Cross-Platform** - Available for macOS, Windows, and Linux
- **Offline First** - Works without internet connection using SQLite
- **Data Export** - Export data to various formats (PDF, Excel)
- **Settings Management** - Customize application behavior and appearance

## 🛠️ Technology Stack

- **Frontend**: Vue.js 3 with TypeScript
- **UI Framework**: Quasar Framework
- **Desktop**: Electron 35+
- **Database**: SQLite with TypeORM
- **Charts**: Chart.js
- **PDF Generation**: PDFKit
- **Build Tool**: Vite

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/wolf-utz/EasePM.git
   cd EasePM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Production Build

```bash
npm run build
```

This will create a distributable application in the `release/` directory.

## 🚀 Usage

### Getting Started

1. Launch EasePM
2. Set up your personal information in Settings
3. Create your first customer
4. Start a new project and associate it with the customer
5. Begin tracking time and managing tasks

### Core Workflows

**Project Management**

- Navigate to Projects → New Project
- Fill in project details and select customer
- Use the Kanban board to manage tasks visually
- Track time directly on tasks

**Invoice Creation**

- Go to Invoices → New Invoice
- Select customer and project
- Add line items (manual or from tracked time)
- Generate PDF invoice

**Time Tracking**

- Use the built-in time tracker on tasks
- View detailed time reports in Reports section
- Export time sheets for billing or records

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Wolf-Peter Utz** - [wolf@utz.it](mailto:wolf@utz.it)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📋 Roadmap

- [ ] SQLite Database
- [ ] Cloud synchronization and local backups
- [ ] ZUGFeRD support
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Integration with popular accounting software

## 🐛 Issues

If you encounter any issues or have feature requests, please create an issue on the GitHub repository.
