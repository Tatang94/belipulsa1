# Overview

This is a full-stack web application for digital payment services, built with a React frontend and Express.js backend. The application allows users to purchase various digital products like mobile credit (pulsa), data packages, electricity tokens (PLN), and game vouchers. It features a category-based product selection system, transaction management, and an admin panel for monitoring transactions.

# User Preferences

Preferred communication style: Simple, everyday language.
Preferred language: Indonesian for communication and documentation.
Product Display: Show product codes prominently on all UI components for easy identification.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **File Uploads**: Multer middleware for handling payment proof images
- **API Design**: RESTful API with JSON responses and proper error handling

## Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon Database (for transactions only)
- **ORM**: Drizzle ORM with schema-first approach and migration support
- **Schema Design**: Transaction storage only - categories and products from external API
- **External API**: All product and category data sourced from Indotel API
- **File Storage**: Local file system for uploaded payment proofs (configurable for cloud storage)

## Authentication and Authorization
- **Session-based Authentication**: Uses Express sessions stored in PostgreSQL
- **File Upload Security**: Image-only file filtering with size limits (5MB)
- **Admin Access**: Simple admin panel for transaction monitoring without complex role-based access

## Core Features
- **Real Data Integration**: Menggunakan data real dari kredensial Indotel C71283 tanpa fallback data demo
- **Product Categories**: Operator real (Telkomsel, Indosat, XL, Three, Smartfren, PLN, PDAM, BPJS, Game)
- **Product Code Display**: Kode produk ditampilkan pada semua UI components dengan badge styling
- **Transaction Flow**: Direct API integration untuk prabayar (TOPUP) dan pascabayar (CHECK BILL + PAY BILL)
- **Real Pricing**: Harga pasar actual berdasarkan data kredensial yang valid
- **Error Handling**: Proper error messages saat API tidak tersedia dengan saran troubleshooting
- **Product Identification**: Setiap produk menampilkan kode unik (T5, I10, X25, PLN50, dll)
- **API Authentication**: Menggunakan environment variables INDOTEL_MMID, INDOTEL_PASSWORD, INDOTEL_URL

## Design Patterns
- **Component Composition**: Reusable UI components with consistent design system
- **Custom Hooks**: Abstracted business logic in custom React hooks
- **Repository Pattern**: Storage interface abstraction for easy database switching
- **Middleware Pattern**: Express middleware for logging, error handling, and file uploads

# External Dependencies

## Third-party Services
- **Neon Database**: PostgreSQL hosting service for production database  
- **Indotel API**: External payment processing service (https://apiindotel.mesinr1.com/V1/)
  - **POST TOPUP**: Pembelian pulsa/data prabayar  
  - **POST STATUS**: Cek status transaksi
  - **POST CEK TAGIHAN / CHECK BILL**: Cek tagihan pascabayar
  - **POST BAYAR TAGIHAN / PAY BILL**: Pembayaran tagihan pascabayar
  - **POST PRODUCT CATEGORY**: Daftar kategori produk
  - **POST LIST PRODUCT**: Daftar produk berdasarkan kategori
  - **POST CEK HARGA**: Cek harga produk
  - **POST HISTORY**: Riwayat transaksi
  - **POST CEK SALDO / CHECK BALANCE**: Cek saldo akun
  - **POST CALLBACK**: Webhook untuk update status transaksi
  - Authentication: MMID + Password/PIN via 'rqid' header
  - Status: Terintegrasi penuh dengan fallback data jika API tidak tersedia

## Key Libraries
- **UI Framework**: React with shadcn/ui components and Radix UI primitives
- **Database**: Drizzle ORM with PostgreSQL adapter from @neondatabase/serverless
- **Validation**: Zod for runtime type checking and form validation
- **File Handling**: Multer for multipart/form-data processing
- **Date Handling**: date-fns for date manipulation and formatting
- **Development Tools**: Vite with TypeScript support and ESBuild for production builds

## Development Environment
- **Replit Integration**: Configured for Replit development environment with runtime error overlay
- **Build Tools**: Vite for frontend bundling and ESBuild for backend compilation
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas