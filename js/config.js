/**
 * CHIKO ENTERPRISES & HOLDINGS - GLOBAL ERP INTEGRATION CONFIGURATION
 * Centralized endpoint mapping, environment detection, and role-based deep linking.
 */

(function (window) {
  'use strict';

  const ERP_CONFIG = {
    // Environment auto-detection (localhost/127.0.0.1 or production)
    get isLocal() {
      return (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '' ||
        window.location.protocol === 'file:'
      );
    },

    // Current environment label
    get environment() {
      return this.isLocal ? 'Development (Local Apache/XAMPP)' : 'Production Enterprise Cloud';
    },

    // ERP Subsystems Configuration
    endpoints: {
      pharmacy: {
        id: 'pharmacy',
        name: 'Chiko Pharmacy ERP',
        shortName: 'Pharmacy ERP',
        badge: 'Clinical Node v4.2',
        localBase: '/CHIKO/public',
        prodBase: 'https://pharmacy.chikoenterprises.company',
        color: '#0284c7',
        accentColor: '#06b6d4',
        routes: {
          root: '',
          login: '/login',
          dashboard: '/dashboard',
          pos: '/pos',
          inventory: '/inventory',
          sales: '/sales',
          reports: '/reports',
          compliance: '/compliance'
        },
        roles: [
          {
            name: 'Chief Pharmacist',
            desc: 'Formulary Sign-off & Clinical Protocol Audit',
            targetRoute: '/dashboard',
            badge: 'Exec Level'
          },
          {
            name: 'Dispensing Technician',
            desc: 'Prescription POS, Dispensary & Barcodes',
            targetRoute: '/pos',
            badge: 'POS Terminal'
          },
          {
            name: 'Clinical Store Manager',
            desc: 'FEFO Batch Tracking, Quarantines & Orders',
            targetRoute: '/inventory',
            badge: 'Warehouse'
          },
          {
            name: 'Regulatory & Audit Officer',
            desc: 'Schedule IV Registry & Ministry Reports',
            targetRoute: '/reports',
            badge: 'Audit & GL'
          }
        ]
      },

      agrovet: {
        id: 'agrovet',
        name: 'Chiko Agrovet ERP',
        shortName: 'Agrovet ERP',
        badge: 'Agri-Hub Node v3.8',
        localBase: '/AGROVET',
        prodBase: 'https://agrovet.chikoenterprises.company',
        color: '#16a34a',
        accentColor: '#22c55e',
        routes: {
          root: '',
          login: '/auth/login.php',
          dashboard: '/modules/dashboard/index.php',
          inventory: '/modules/inventory/index.php',
          sales: '/modules/sales/index.php',
          customers: '/modules/customers/index.php',
          purchases: '/modules/purchases/index.php',
          branches: '/modules/branches/index.php'
        },
        roles: [
          {
            name: 'Senior Veterinary Surgeon',
            desc: 'Livestock Care, Vaccines & Prescriptions',
            targetRoute: '/modules/dashboard/index.php',
            badge: 'Clinical Vet'
          },
          {
            name: 'Agronomy Field Officer',
            desc: 'Crop Chemicals, Advisory & Field Counter',
            targetRoute: '/modules/sales/index.php',
            badge: 'Field Sales'
          },
          {
            name: 'Regional Depot Manager',
            desc: 'Bulk Feeds, Fertilizer & Seeds Depot',
            targetRoute: '/modules/inventory/index.php',
            badge: 'Depot Stock'
          },
          {
            name: 'Farmer Cooperative Liaison',
            desc: 'Farmer Credit Accounts & Bulk Waybills',
            targetRoute: '/modules/customers/index.php',
            badge: 'Coop Accounts'
          }
        ]
      }
    },

    /**
     * Resolves the full URL for an ERP system and target path
     * @param {string} system 'pharmacy' | 'agrovet'
     * @param {string} path Target sub-path or route key
     * @returns {string} Fully qualified or relative URL
     */
    getUrl(system, path = '') {
      const sys = this.endpoints[system];
      if (!sys) return '#';

      const base = this.isLocal ? sys.localBase : sys.prodBase;
      if (!path) return base;

      // Check if path is a recognized route key
      const resolvedPath = sys.routes[path] || path;
      const cleanPath = resolvedPath.startsWith('/') ? resolvedPath : '/' + resolvedPath;
      return base + cleanPath;
    },

    /**
     * Directly navigates to or opens the ERP system
     * @param {string} system 'pharmacy' | 'agrovet'
     * @param {string} path Target sub-path or route key
     * @param {boolean} openInNewTab Default true
     * @returns {string} URL launched
     */
    launch(system, path = '', openInNewTab = true) {
      const url = this.getUrl(system, path);
      if (openInNewTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
      return url;
    }
  };

  // Expose globally
  window.ERP_CONFIG = ERP_CONFIG;
})(window);
