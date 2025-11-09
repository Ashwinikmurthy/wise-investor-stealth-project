# Wise Investor - Part 4: Frontend Implementation
## React Application Architecture

**Version**: 1.0.0  
**Last Updated**: November 2025

---

## Table of Contents

1. [Frontend Architecture Overview](#1-frontend-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [Core Components](#3-core-components)
4. [Custom Hooks](#4-custom-hooks)
5. [State Management](#5-state-management)
6. [Routing & Navigation](#6-routing--navigation)
7. [API Integration](#7-api-integration)
8. [Forms & Validation](#8-forms--validation)
9. [Data Visualization](#9-data-visualization)
10. [Styling & Theming](#10-styling--theming)

---

## 1. Frontend Architecture Overview

### 1.1 Technology Stack

- **Framework**: React 18.2+
- **Build Tool**: Vite 5.0+
- **Routing**: React Router 6.20+
- **HTTP Client**: Axios 1.6+
- **Charts**: Recharts 2.10+ / Chart.js 4.4+
- **Styling**: Tailwind CSS 3.4+
- **Forms**: React Hook Form 7.49+
- **State**: Context API + Custom Hooks
- **Date Handling**: date-fns 3.0+

### 1.2 Architecture Principles

**Component-Based**: Everything is a reusable component
**Composition Over Inheritance**: Build complex UIs from simple components
**Single Responsibility**: Each component has one clear purpose
**Presentational vs Container**: Separate UI from logic
**Custom Hooks**: Extract and reuse stateful logic

### 1.3 Design Patterns

- **Container/Presentational Pattern**: Separate data fetching from display
- **Compound Components**: Related components that work together
- **Render Props**: Share code between components
- **Higher-Order Components**: Enhance components with additional functionality
- **Custom Hooks**: Reuse stateful logic across components

---

## 2. Project Structure

### 2.1 Directory Organization

```
wise-investor-frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       ├── images/
│       └── icons/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── ...
│   │   ├── layout/           # Layout components
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Breadcrumbs.jsx
│   │   ├── dashboard/        # Dashboard components
│   │   │   ├── ExecutiveDashboard.jsx
│   │   │   ├── FundraisingVitals.jsx
│   │   │   ├── MetricsCard.jsx
│   │   │   ├── RevenueChart.jsx
│   │   │   └── ...
│   │   ├── donors/           # Donor management
│   │   │   ├── DonorList.jsx
│   │   │   ├── DonorCard.jsx
│   │   │   ├── DonorDetails.jsx
│   │   │   ├── DonorForm.jsx
│   │   │   ├── DonorTimeline.jsx
│   │   │   └── ...
│   │   ├── campaigns/        # Campaign management
│   │   │   ├── CampaignList.jsx
│   │   │   ├── CampaignCard.jsx
│   │   │   ├── CampaignDetails.jsx
│   │   │   ├── CampaignForm.jsx
│   │   │   └── ...
│   │   ├── donations/        # Donation management
│   │   ├── analytics/        # Analytics views
│   │   └── forms/            # Form components
│   ├── pages/                # Route pages
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Donors.jsx
│   │   ├── DonorDetail.jsx
│   │   ├── Campaigns.jsx
│   │   ├── Donations.jsx
│   │   ├── Analytics.jsx
│   │   ├── Settings.jsx
│   │   └── NotFound.jsx
│   ├── services/             # API services
│   │   ├── api.js           # Axios instance
│   │   ├── auth.service.js
│   │   ├── donor.service.js
│   │   ├── campaign.service.js
│   │   ├── donation.service.js
│   │   └── analytics.service.js
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useDonors.js
│   │   ├── useCampaigns.js
│   │   ├── usePagination.js
│   │   ├── useDebounce.js
│   │   ├── useLocalStorage.js
│   │   └── ...
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── NotificationContext.jsx
│   ├── utils/                # Utility functions
│   │   ├── formatters.js    # Data formatting
│   │   ├── validators.js    # Validation rules
│   │   ├── helpers.js       # Helper functions
│   │   └── constants.js     # Constants
│   ├── styles/               # Global styles
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   └── variables.css
│   ├── routes/               # Route configuration
│   │   ├── index.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── routes.config.js
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── vite-env.d.ts
├── .env.development
├── .env.production
├── .eslintrc.js
├── .prettierrc
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## 3. Core Components

### 3.1 Common Components

#### Button Component

```jsx
// src/components/common/Button.jsx
import React from 'react';
import { Spinner } from './Spinner';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 disabled:border-primary-300 disabled:text-primary-300',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="mr-2 h-5 w-5" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="ml-2 h-5 w-5" />
      )}
    </button>
  );
};

export default Button;
```

#### Input Component

```jsx
// src/components/common/Input.jsx
import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'block w-full rounded-lg border px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500';
  
  const stateClasses = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500'
    : 'border-gray-300 focus:border-primary-500';
  
  const disabledClasses = disabled ? 'bg-gray-50 cursor-not-allowed' : '';
  
  const iconClasses = Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={`${baseClasses} ${stateClasses} ${disabledClasses} ${iconClasses}`}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
```

#### Modal Component

```jsx
// src/components/common/Modal.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl',
  };
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };
  
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white shadow-xl transition-all`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
              {title}
            </h3>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>
          
          {/* Body */}
          <div className="px-6 py-4">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
```

#### Table Component

```jsx
// src/components/common/Table.jsx
import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortColumn,
  sortDirection,
  onRowClick,
  rowKey = 'id',
}) => {
  const handleSort = (column) => {
    if (column.sortable && onSort) {
      onSort(column.accessor);
    }
  };
  
  const getSortIcon = (accessor) => {
    if (sortColumn !== accessor) return null;
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 ml-1" />
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && getSortIcon(column.accessor)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr
              key={row[rowKey]}
              className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <td key={column.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.cell ? column.cell(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
```

### 3.2 Layout Components

#### MainLayout Component

```jsx
// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumbs />
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
```

#### Header Component

```jsx
// src/components/layout/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo.svg" alt="Wise Investor" className="h-8 w-auto" />
          <span className="ml-3 text-xl font-bold text-gray-900">
            Wise Investor
          </span>
        </Link>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <input
            type="search"
            placeholder="Search donors, campaigns..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
              <UserCircleIcon className="h-8 w-8" />
              <span className="text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </span>
            </button>
            {/* Dropdown menu would go here */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
```

### 3.3 Dashboard Components

#### ExecutiveDashboard Component

```jsx
// src/components/dashboard/ExecutiveDashboard.jsx
import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analytics.service';
import MetricsCard from './MetricsCard';
import RevenueChart from './RevenueChart';
import DonorBreakdown from './DonorBreakdown';
import CampaignProgress from './CampaignProgress';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  TrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const ExecutiveDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const data = await analyticsService.getExecutiveDashboard();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Revenue (YTD)"
          value={`$${metrics.total_revenue_ytd.toLocaleString()}`}
          change={metrics.revenue_growth}
          trend="up"
          icon={CurrencyDollarIcon}
          color="blue"
        />
        
        <MetricsCard
          title="Active Donors"
          value={metrics.active_donors.toLocaleString()}
          change={metrics.donor_growth}
          trend="up"
          icon={UserGroupIcon}
          color="green"
        />
        
        <MetricsCard
          title="Average Gift"
          value={`$${metrics.average_gift.toLocaleString()}`}
          change={metrics.avg_gift_change}
          trend={metrics.avg_gift_change > 0 ? 'up' : 'down'}
          icon={TrendingUpIcon}
          color="purple"
        />
        
        <MetricsCard
          title="Active Campaigns"
          value={metrics.active_campaigns}
          subtitle={`${metrics.campaigns_on_track} on track`}
          icon={ChartBarIcon}
          color="orange"
        />
      </div>
      
      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue Trends
        </h3>
        <RevenueChart data={metrics.revenue_trends} />
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donor Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Donor Lifecycle
          </h3>
          <DonorBreakdown data={metrics.donor_lifecycle} />
        </div>
        
        {/* Campaign Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Campaign Performance
          </h3>
          <CampaignProgress campaigns={metrics.campaigns} />
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
```

#### MetricsCard Component

```jsx
// src/components/dashboard/MetricsCard.jsx
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const MetricsCard = ({
  title,
  value,
  subtitle,
  change,
  trend,
  icon: Icon,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };
  
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          
          {change !== undefined && (
            <div className={`mt-2 flex items-center text-sm ${trendColor}`}>
              <TrendIcon className="h-4 w-4 mr-1" />
              <span>{Math.abs(change)}%</span>
              <span className="ml-1 text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;
```
