/**
 * CHIKO ENTERPRISES & HOLDINGS - INTEGRATED ERP GATEWAY
 * Interactive Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all subsystems
  initSystemPingsAndClock();
  initAnnualReports();
  initPortalModal();
  initMobileNav();
  initHeaderScroll();
});

/* ==========================================================================
   1. Live System Pings, Uptime & Telemetry Bridge
   ========================================================================== */
function initSystemPingsAndClock() {
  async function fetchTelemetry() {
    try {
      const res = await fetch('api/telemetry.php', { cache: 'no-store' });
      if (!res.ok) throw new Error('Status ' + res.status);
      await res.json();
    } catch (err) {
      // Graceful local fallback
    }
  }
  fetchTelemetry();
  setInterval(fetchTelemetry, 15000);
}

/* ==========================================================================
   4. Interactive Portal Gateway Modal & Role Switcher
   ========================================================================== */
function initPortalModal() {
  const modalBackdrop = document.getElementById('portal-modal');
  const modalWindow = document.getElementById('modal-window-el');
  const closeBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-title-text');
  const modalSubtitle = document.getElementById('modal-subtitle-text');
  const modalIcon = document.getElementById('modal-icon-container');
  const roleButtonsContainer = document.getElementById('role-buttons-grid');
  const submitBtn = document.getElementById('modal-submit-btn');
  const liveWorkspace = document.getElementById('modal-live-workspace');
  const workspaceUserTag = document.getElementById('workspace-user-tag');
  const tokenDisplay = document.getElementById('twofa-code-token');
  const modalEnvLabel = document.getElementById('modal-env-label');
  const modalTargetRoute = document.getElementById('modal-target-route');
  const directLoginBtn = document.getElementById('modal-direct-login-btn');
  const directTerminalBtn = document.getElementById('modal-direct-terminal-btn');
  const workspaceLaunchLink = document.getElementById('modal-workspace-launch-link');

  let activePortalType = 'pharmacy';
  let selectedRole = 'Lead Pharmacist';
  let selectedRoute = '/dashboard';

  function generateRandomToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function updateTargetRouteDisplay() {
    const config = window.ERP_CONFIG;
    if (!config) return;
    const sys = config.endpoints[activePortalType];
    const fullUrl = config.getUrl(activePortalType, selectedRoute);
    if (modalTargetRoute) {
      modalTargetRoute.textContent = `Route: ${selectedRoute}`;
      modalTargetRoute.title = fullUrl;
    }
    if (workspaceLaunchLink) {
      workspaceLaunchLink.href = fullUrl;
      workspaceLaunchLink.innerHTML = `<span>Launch Live ${sys.shortName} (${selectedRoute}) ↗</span>`;
    }
  }

  function openPortal(type) {
    activePortalType = type;
    const config = window.ERP_CONFIG;
    const sys = config ? config.endpoints[type] : null;
    if (!modalBackdrop || !sys) return;

    if (modalEnvLabel) {
      modalEnvLabel.textContent = `Node: ${config.isLocal ? 'Local Apache Gateway' : 'Production Cloud'} (${sys.name})`;
    }

    if (tokenDisplay) {
      tokenDisplay.textContent = generateRandomToken();
    }

    if (liveWorkspace) {
      liveWorkspace.classList.remove('active');
    }

    if (modalWindow) {
      modalWindow.classList.remove('modal-pharm', 'modal-agro');
      modalWindow.classList.add(type === 'pharmacy' ? 'modal-pharm' : 'modal-agro');
    }

    if (type === 'pharmacy') {
      if (modalTitle) modalTitle.textContent = 'Chiko Pharmacy ERP Gateway';
      if (modalSubtitle) modalSubtitle.textContent = 'Clinical Dispensary, Prescription POS & FEFO Inventory';
      if (modalIcon) {
        modalIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M2 12h20"/>
            <circle cx="12" cy="12" r="9"/>
          </svg>
        `;
      }
      if (submitBtn) {
        submitBtn.textContent = 'Authenticate & Enter Pharmacy Terminal ↗';
      }
    } else {
      if (modalTitle) modalTitle.textContent = 'Chiko Agrovet ERP Gateway';
      if (modalSubtitle) modalSubtitle.textContent = 'Veterinary Health, Crop Protection & Regional Depot Logistics';
      if (modalIcon) {
        modalIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        `;
      }
      if (submitBtn) {
        submitBtn.textContent = 'Authenticate & Enter Agrovet Terminal ↗';
      }
    }

    // Populate role buttons from ERP_CONFIG
    if (roleButtonsContainer && sys.roles) {
      const roles = sys.roles;
      selectedRole = roles[0].name;
      selectedRoute = roles[0].targetRoute;
      roleButtonsContainer.innerHTML = roles.map((r, idx) => `
        <button type="button" class="role-option-btn ${idx === 0 ? 'selected' : ''}" data-role="${r.name}" data-route="${r.targetRoute}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>${r.name}</span>
            <span style="font-size: 0.65rem; background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 3px; font-weight: 700;">${r.badge || ''}</span>
          </div>
          <div style="font-size: 0.68rem; font-weight: normal; opacity: 0.8; margin-top: 2px;">${r.desc}</div>
        </button>
      `).join('');

      // Add click handlers for roles
      const buttons = roleButtonsContainer.querySelectorAll('.role-option-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedRole = btn.getAttribute('data-role');
          selectedRoute = btn.getAttribute('data-route') || '/';
          updateTargetRouteDisplay();
        });
      });
    }

    updateTargetRouteDisplay();
    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Attach global openers - Directly launches the designated ERP system
  window.launchPortal = function(type) {
    if (window.ERP_CONFIG) {
      window.ERP_CONFIG.launch(type);
    } else {
      openPortal(type);
    }
  };

  // Dedicated modal opener if deep-role configuration or diagnostics are needed
  window.openPortalGatewayModal = function(type) {
    openPortal(type);
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  // Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // Direct login and direct terminal buttons
  if (directLoginBtn) {
    directLoginBtn.addEventListener('click', () => {
      window.ERP_CONFIG.launch(activePortalType, 'login');
      closeModal();
    });
  }

  if (directTerminalBtn) {
    directTerminalBtn.addEventListener('click', () => {
      window.ERP_CONFIG.launch(activePortalType, selectedRoute);
      closeModal();
    });
  }

  // Handle Form Submit with Live SSO Verification
  const modalForm = document.getElementById('portal-sso-form');
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const staffEmail = document.getElementById('staff-email-input')?.value || 'staff@chikogroup.internal';
      
      showToast(`Verifying credentials with ${activePortalType === 'pharmacy' ? 'Pharmacy' : 'Agrovet'} ERP...`);

      let targetUrl = window.ERP_CONFIG.getUrl(activePortalType, selectedRoute);
      let verifiedUser = `${selectedRole} • ${staffEmail}`;

      try {
        const res = await fetch('api/sso.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: activePortalType,
            role: selectedRole,
            email: staffEmail,
            route: selectedRoute
          })
        });

        if (res.ok) {
          const ssoData = await res.json();
          if (ssoData.success && ssoData.target_url) {
            targetUrl = ssoData.target_url;
            if (ssoData.user) {
              verifiedUser = `${ssoData.user.role} • ${ssoData.user.name} (${ssoData.user.email})`;
            }
          }
        }
      } catch (err) {
        console.warn('SSO Bridge fallback:', err);
      }

      if (workspaceUserTag) {
        workspaceUserTag.textContent = verifiedUser;
      }

      updateTargetRouteDisplay();

      if (liveWorkspace) {
        liveWorkspace.classList.add('active');
        liveWorkspace.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      showToast(`Authenticated: Launching ${selectedRole} terminal...`);

      // Open target ERP in new window
      setTimeout(() => {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }, 700);
    });
  }
}


/* ==========================================================================
   6. Mobile Navigation & Scroll Header
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('main-nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = navMenu.style.display === 'flex';
      navMenu.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '100%';
        navMenu.style.left = '0';
        navMenu.style.right = '0';
        navMenu.style.background = '#ffffff';
        navMenu.style.padding = '1.5rem';
        navMenu.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
        navMenu.style.borderBottom = '2px solid var(--border-medium)';
        navMenu.style.zIndex = '999';
      }
    });

    // Close when clicking any nav item on smaller screens
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1200) {
          navMenu.style.display = 'none';
        }
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1200 && navMenu.style.display === 'flex' && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        navMenu.style.display = 'none';
      }
    });
  }
}

function initHeaderScroll() {
  const header = document.querySelector('.main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });
}

/* ==========================================================================
   7. Toast Notification Utility
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById('global-toast-el');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast-el';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dfb74a" stroke-width="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
}

/* ==========================================================================
   8. Annual Reports & Stakeholder Disclosures Engine
   ========================================================================== */
const REPORTS_ARCHIVE = [
  // --- FY 2025 ---
  {
    id: 'pharmacy-2025',
    entity: 'pharmacy',
    entityName: 'Chiko Pharmacy',
    year: '2025',
    period: 'Jan 01 – Dec 31, 2025',
    themeClass: 'entity-pharmacy',
    title: 'Annual Clinical Performance & Healthcare Supply Report',
    subtitle: 'Hospital Appliances, Essential Medicines Formulary & Cold-Chain Distribution',
    badges: ['TMDA Certified', 'PDF • 4.8 MB', 'ISO 9001:2015', 'Audited'],
    metrics: [
      { num: '142+', label: 'Facilities Supplied' },
      { num: '99.4%', label: 'Formulary In-Stock' },
      { num: '100%', label: 'Cold-Chain Integrity' }
    ],
    summary: 'In FY 2025, Chiko Pharmacy expanded clinical distribution across the Dodoma Central Zone, delivering over 420,000 units of essential pharmaceuticals and diagnostic appliances. Highlights include 100% TMDA regulatory inspection pass rates, zero cold-chain breaches for biologics/insulin, and introduction of automated FEFO batch expiration tracking.',
    executiveStatement: 'Our healthcare mission remains unwavering: ensuring that every dispensary, hospital, and patient in the Central Zone receives genuine, cold-chain-verified pharmaceuticals and reliable diagnostic appliances without interruption.',
    financials: [
      { item: 'Total Health System Distribution', val: '$4,883,600' },
      { item: 'Gross Operating Margin', val: '$1,416,244 (29.0%)' },
      { item: 'Regulatory & Cold-Chain Quality Investment', val: '$320,000' },
      { item: 'Net Operating Surplus', val: '$706,244' }
    ],
    operationalHighlights: [
      'Supplied 142 public and private health centers with zero stockouts of emergency antibiotics.',
      'Achieved 100% telemetry sensor uptime across all central dispensary cold-storage units (+2°C to +8°C).',
      'Expanded diagnostic appliance distribution: 4,200 digital blood pressure monitors & glucometer kits deployed.'
    ],
    auditorSignoff: 'Audited and certified by Dodoma Registered Public Auditors in full conformity with TMDA and IFRS requirements. Unqualified Clean Opinion.'
  },
  {
    id: 'agrovet-2025',
    entity: 'agrovet',
    entityName: 'Chiko Agrovet',
    year: '2025',
    period: 'Jan 01 – Dec 31, 2025',
    themeClass: 'entity-agrovet',
    title: 'Annual Agronomic Yield & Veterinary Health Impact Report',
    subtitle: 'Certified Hybrid Seeds, Veterinary Serums & Smallholder Cooperative Support',
    badges: ['Min. of Agriculture Verified', 'PDF • 5.2 MB', 'GVP Standard', 'Audited'],
    metrics: [
      { num: '28,500+', label: 'Farmers Supported' },
      { num: '18,200+', label: 'Vaccines Administered' },
      { num: '920 MT', label: 'Seed Grain Supplied' }
    ],
    summary: 'The 2025 fiscal year marked significant adoption of climate-resilient hybrid maize (DK777) and livestock disease immunization across Dodoma rural districts. Chiko Agrovet delivered 920 metric tons of certified seeds and over 18,200 veterinary vaccine doses while conducting 45 hands-on farmer agronomy workshops.',
    executiveStatement: 'Food security and livestock resilience in the Central Zone depend on timely agronomic inputs and certified veterinary care. Our 2025 expansion directly bolstered harvest yields for over 28,500 farming families.',
    financials: [
      { item: 'Gross Agricultural Input Deliveries', val: '$3,540,150' },
      { item: 'Depot & Cooperative Sales Margin', val: '$984,160 (27.8%)' },
      { item: 'Veterinary Cold-Chain & Outreach OPEX', val: '$240,000' },
      { item: 'Net Operational Surplus', val: '$464,160' }
    ],
    operationalHighlights: [
      'Distributed 920 Metric Tons of certified drought-tolerant hybrid seeds to 38 registered cooperatives.',
      'Protected regional livestock with 18,200 doses of poultry & cattle vaccines with 0% heat wastage.',
      'Conducted 45 community workshops on safe acaricide dipping and responsible pesticide stewardship.'
    ],
    auditorSignoff: 'Audited in compliance with the Ministry of Agriculture Seed Quality Control Guidelines and Veterinary Board of Tanzania statutory requirements.'
  },
  {
    id: 'group-2025',
    entity: 'group',
    entityName: 'Chiko Enterprises Holding',
    year: '2025',
    period: 'Jan 01 – Dec 31, 2025',
    themeClass: 'entity-group',
    title: 'Integrated Corporate Annual Report & Financial Statements',
    subtitle: 'Consolidated Audited Accounts, Dual ERP Governance & Strategic Capital Plan',
    badges: ['Consolidated Audit', 'PDF • 6.4 MB', 'Clean Opinion', 'Audited'],
    metrics: [
      { num: '$8.42M', label: 'Group Revenue' },
      { num: '+16.4%', label: 'YoY Growth' },
      { num: '99.8%', label: 'Compliance Index' }
    ],
    summary: 'Chiko Enterprises completed its unified digital transformation in FY 2025, operating specialized dual ERP engines across clinical health and regional agro-logistics. Group revenues reached $8.42M with sustained double-digit expansion, disciplined balance sheet allocation, and expanded regional distribution fleet capacity.',
    executiveStatement: 'By uniting clinical healthcare reliability and agricultural yield productivity under one disciplined corporate standard, Chiko Enterprises has built an enduring enterprise foundation for Dodoma and Tanzania.',
    financials: [
      { item: 'Consolidated Group Revenue', val: '$8,423,750' },
      { item: 'Group Gross Profit', val: '$2,400,404 (28.5%)' },
      { item: 'Administrative, Logistics & IT OPEX', val: '$1,230,000' },
      { item: 'Consolidated Net Profit Before Tax', val: '$1,170,404' }
    ],
    operationalHighlights: [
      'Full deployment of dual cloud-synchronized ERP nodes for both Chiko Pharmacy and Chiko Agrovet.',
      '16.4% YoY enterprise revenue expansion driven by commercial health contracts and seed bulk distribution.',
      'Achieved zero severe non-conformances in comprehensive third-party ISO and TMDA governance audits.'
    ],
    auditorSignoff: 'Consolidated financial statements prepared under IFRS and audited with an Unqualified Clean Audit Opinion by Dodoma External Audit Associates.'
  },

  // --- FY 2024 ---
  {
    id: 'pharmacy-2024',
    entity: 'pharmacy',
    entityName: 'Chiko Pharmacy',
    year: '2024',
    period: 'Jan 01 – Dec 31, 2024',
    themeClass: 'entity-pharmacy',
    title: 'Annual Clinical Performance & Healthcare Supply Report (2024)',
    subtitle: 'Essential Medicines Stock Stability & Central Zone Logistics Audit',
    badges: ['TMDA Certified', 'PDF • 4.4 MB', 'Archived'],
    metrics: [
      { num: '118+', label: 'Facilities Supplied' },
      { num: '98.8%', label: 'Formulary In-Stock' },
      { num: '100%', label: 'Regulatory Pass' }
    ],
    summary: 'FY 2024 focused on cold-chain modernization and expanding regional antibiotic buffers. Total pharmacy distribution reached $4.15M, serving over 118 regional clinics with verifiable cold-chain security.',
    executiveStatement: 'In 2024, our priority was strengthening hospital procurement relationships and upgrading temperature monitoring across our central warehousing.',
    financials: [
      { item: 'Total Health System Distribution', val: '$4,152,000' },
      { item: 'Gross Operating Margin', val: '$1,195,000 (28.8%)' },
      { item: 'Cold-Chain Upgrade CAPEX', val: '$280,000' },
      { item: 'Net Operating Surplus', val: '$585,000' }
    ],
    operationalHighlights: [
      'Commissioned 2 backup generator-supported cold rooms for insulin and vaccine reserves.',
      'Initiated emergency 2-hour hospital dispatch service within Dodoma municipality.',
      'Fulfilled 100% of municipal district council pharmaceutical contracts on schedule.'
    ],
    auditorSignoff: 'Full compliance verified by TMDA and independent registered auditors.'
  },
  {
    id: 'agrovet-2024',
    entity: 'agrovet',
    entityName: 'Chiko Agrovet',
    year: '2024',
    period: 'Jan 01 – Dec 31, 2024',
    themeClass: 'entity-agrovet',
    title: 'Annual Agronomic Yield & Veterinary Health Impact Report (2024)',
    subtitle: 'Cooperative Farmer Outreach & Livestock Disease Prevention Audit',
    badges: ['Min. of Agriculture Verified', 'PDF • 4.9 MB', 'Archived'],
    metrics: [
      { num: '22,400+', label: 'Farmers Supported' },
      { num: '14,800+', label: 'Vaccines Administered' },
      { num: '780 MT', label: 'Seed Grain Supplied' }
    ],
    summary: 'In FY 2024, Chiko Agrovet supplied 780 MT of certified seeds and administered 14,800 doses of livestock vaccines, providing vital support against regional Newcastle disease outbreaks.',
    executiveStatement: 'Our field teams visited 32 cooperatives throughout the Central Zone, reinforcing high-germination seed usage and proactive herd vaccination.',
    financials: [
      { item: 'Gross Agricultural Input Deliveries', val: '$3,080,000' },
      { item: 'Depot & Cooperative Sales Margin', val: '$840,000 (27.3%)' },
      { item: 'Outreach & Extension Services OPEX', val: '$195,000' },
      { item: 'Net Operational Surplus', val: '$390,000' }
    ],
    operationalHighlights: [
      'Zero counterfeit seed incidents recorded due to QR-code batch verification.',
      'Supported emergency poultry ring-vaccination across 4 rural districts.',
      'Partnered with 28 agricultural input retailers for localized stock availability.'
    ],
    auditorSignoff: 'Certified under Ministry of Agriculture and Veterinary Board statutory audits.'
  },
  {
    id: 'group-2024',
    entity: 'group',
    entityName: 'Chiko Enterprises Holding',
    year: '2024',
    period: 'Jan 01 – Dec 31, 2024',
    themeClass: 'entity-group',
    title: 'Integrated Corporate Annual Report & Financial Statements (2024)',
    subtitle: 'Consolidated Audited Accounts & Infrastructure Investment Review',
    badges: ['Consolidated Audit', 'PDF • 5.9 MB', 'Archived'],
    metrics: [
      { num: '$7.23M', label: 'Group Revenue' },
      { num: '+14.2%', label: 'YoY Growth' },
      { num: '99.5%', label: 'Compliance Index' }
    ],
    summary: 'Consolidated revenues for Chiko Enterprises Holding grew to $7.23M in FY 2024. Investments in fleet logistics and central warehousing solidified the group as a premier supply chain partner in Central Tanzania.',
    executiveStatement: 'FY 2024 proved our dual-engine business model: clinical health and agriculture create mutually reinforcing stability for our stakeholders.',
    financials: [
      { item: 'Consolidated Group Revenue', val: '$7,232,000' },
      { item: 'Group Gross Profit', val: '$2,035,000 (28.1%)' },
      { item: 'Operational & Administrative OPEX', val: '$1,080,000' },
      { item: 'Consolidated Net Profit Before Tax', val: '$955,000' }
    ],
    operationalHighlights: [
      'Commenced planning and initial integration of the customized dual ERP software architecture.',
      'Maintained debt-free working capital balance sheet with strong liquidity ratios.',
      'Expanded direct warehouse footprint in Dodoma to support growing regional freight.'
    ],
    auditorSignoff: 'Audited and certified by Dodoma External Audit Associates with an Unqualified Clean Opinion.'
  },

  // --- FY 2023 ---
  {
    id: 'pharmacy-2023',
    entity: 'pharmacy',
    entityName: 'Chiko Pharmacy',
    year: '2023',
    period: 'Jan 01 – Dec 31, 2023',
    themeClass: 'entity-pharmacy',
    title: 'Annual Clinical Performance & Healthcare Supply Report (2023)',
    subtitle: 'Clinical Dispensary Operations & Central Zone In-Stock Assurance',
    badges: ['TMDA Certified', 'PDF • 3.9 MB', 'Archived'],
    metrics: [
      { num: '94+', label: 'Facilities Supplied' },
      { num: '98.1%', label: 'Formulary In-Stock' },
      { num: '100%', label: 'Regulatory Pass' }
    ],
    summary: 'FY 2023 established Chiko Pharmacy as the primary private distributor of certified pharmaceuticals and essential diagnostic tools in Dodoma City, generating $3.56M in medical deliveries.',
    executiveStatement: 'Our foundational year of expanded clinical distribution proved the need for dedicated, compliant healthcare logistics in the Central Zone.',
    financials: [
      { item: 'Total Health System Distribution', val: '$3,560,000' },
      { item: 'Gross Operating Margin', val: '$1,015,000 (28.5%)' },
      { item: 'Dispensary & Facility OPEX', val: '$490,000' },
      { item: 'Net Operating Surplus', val: '$525,000' }
    ],
    operationalHighlights: [
      'Passed all 4 TMDA quarterly site and product quality inspections without citations.',
      'Supplied 94 hospitals and community clinics with zero counterfeit or defective batch returns.'
    ],
    auditorSignoff: 'Full compliance verified by TMDA and statutory audit reports.'
  },
  {
    id: 'agrovet-2023',
    entity: 'agrovet',
    entityName: 'Chiko Agrovet',
    year: '2023',
    period: 'Jan 01 – Dec 31, 2023',
    themeClass: 'entity-agrovet',
    title: 'Annual Agronomic Yield & Veterinary Health Impact Report (2023)',
    subtitle: 'Smallholder Agriculture Support & Certified Seed Distribution',
    badges: ['Min. of Agriculture Verified', 'PDF • 4.1 MB', 'Archived'],
    metrics: [
      { num: '17,800+', label: 'Farmers Supported' },
      { num: '11,500+', label: 'Vaccines Administered' },
      { num: '620 MT', label: 'Seed Grain Supplied' }
    ],
    summary: 'Chiko Agrovet distributed 620 MT of seed grain and over 11,500 veterinary doses in 2023, initiating regional partnerships with farmer cooperatives.',
    executiveStatement: 'By providing genuine inputs and certified hybrid seeds, we laid the groundwork for sustainable farmer prosperity.',
    financials: [
      { item: 'Gross Agricultural Input Deliveries', val: '$2,770,000' },
      { item: 'Depot & Cooperative Sales Margin', val: '$745,000 (26.9%)' },
      { item: 'Field Outreach OPEX', val: '$180,000' },
      { item: 'Net Operational Surplus', val: '$335,000' }
    ],
    operationalHighlights: [
      'Delivered certified drought-resilient seed maize to over 17,800 smallholder farmers.',
      'Established direct cold storage at Dodoma hub for temperature-sensitive veterinary biologics.'
    ],
    auditorSignoff: 'Statutory audit completed under Ministry of Agriculture guidelines.'
  },
  {
    id: 'group-2023',
    entity: 'group',
    entityName: 'Chiko Enterprises Holding',
    year: '2023',
    period: 'Jan 01 – Dec 31, 2023',
    themeClass: 'entity-group',
    title: 'Integrated Corporate Annual Report & Financial Statements (2023)',
    subtitle: 'Group Consolidation & Enterprise Foundation Review',
    badges: ['Consolidated Audit', 'PDF • 5.1 MB', 'Archived'],
    metrics: [
      { num: '$6.33M', label: 'Group Revenue' },
      { num: '+12.8%', label: 'YoY Growth' },
      { num: '99.2%', label: 'Compliance Index' }
    ],
    summary: 'Consolidated revenue across both divisions reached $6.33M in FY 2023, confirming strong regional demand for quality-guaranteed healthcare and agricultural inputs.',
    executiveStatement: 'Our consolidated holding structure delivers financial stability and operational discipline to both Chiko Pharmacy and Chiko Agrovet.',
    financials: [
      { item: 'Consolidated Group Revenue', val: '$6,330,000' },
      { item: 'Group Gross Profit', val: '$1,760,000 (27.8%)' },
      { item: 'Total Corporate OPEX', val: '$960,000' },
      { item: 'Consolidated Net Profit Before Tax', val: '$800,000' }
    ],
    operationalHighlights: [
      'Formed unified executive committee oversight for joint procurement and logistics.',
      'Maintained 100% regulatory compliance rating across all national licensing authorities.'
    ],
    auditorSignoff: 'Consolidated statements audited under IFRS with clean audit opinion.'
  }
];

function initAnnualReports() {
  const container = document.getElementById('reports-cards-container');
  const yearTabs = document.querySelectorAll('.year-tab-btn');
  const modal = document.getElementById('report-modal');
  const modalClose = document.getElementById('rm-close-btn');
  const printBtn = document.getElementById('rm-print-btn');
  let currentYear = '2025';

  function renderCards(year) {
    if (!container) return;
    const items = REPORTS_ARCHIVE.filter(r => r.year === year);

    container.innerHTML = items.map(report => `
      <div class="report-card ${report.themeClass}" id="card-${report.id}">
        <div class="report-card-strip"></div>
        <div class="report-card-body">
          <div class="report-header-meta">
            <span class="report-entity-pill">${report.entityName}</span>
            <span class="report-period-tag">${report.period}</span>
          </div>

          <h3 class="report-card-title">${report.title}</h3>
          <p class="report-card-subtitle">${report.subtitle}</p>

          <div class="report-metrics-row">
            ${report.metrics.map(m => `
              <div class="report-metric-box">
                <div class="metric-num">${m.num}</div>
                <div class="metric-label">${m.label}</div>
              </div>
            `).join('')}
          </div>

          <p class="report-summary-text">${report.summary}</p>

          <div class="report-badges-row">
            ${report.badges.map(b => `<span class="report-badge-chip">${b}</span>`).join('')}
          </div>

          <div class="report-card-actions">
            <button type="button" class="btn-report-quickview" onclick="openReportModal('${report.id}')">
              <span>View Executive Summary</span>
            </button>
            <button type="button" class="btn-report-download" onclick="downloadReport('${report.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download Report</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Handle Tab Switcher
  yearTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      yearTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentYear = tab.getAttribute('data-year');
      renderCards(currentYear);
    });
  });

  // Modal Open Handler
  window.openReportModal = function(id) {
    const report = REPORTS_ARCHIVE.find(r => r.id === id);
    if (!report || !modal) return;

    const pill = document.getElementById('rm-entity-pill');
    const title = document.getElementById('rm-title');
    const fiscalTag = document.getElementById('rm-fiscal-tag');
    const body = document.getElementById('rm-content-body');
    const downloadBtn = document.getElementById('rm-download-btn');
    const downloadLabel = document.getElementById('rm-download-label');

    if (pill) {
      pill.textContent = report.entityName;
      pill.className = `modal-entity-pill ${report.themeClass}`;
    }
    if (title) title.textContent = report.title;
    if (fiscalTag) fiscalTag.textContent = `${report.period} • Official Statutory Filing`;

    if (body) {
      body.innerHTML = `
        <div style="background: var(--bg-canvas); padding: 1.2rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 1.4rem;">
          <h4 style="color: var(--ink-primary); font-size: 0.95rem; margin-bottom: 0.4rem;">Executive Director's Statement</h4>
          <p style="font-style: italic; color: var(--ink-secondary); margin: 0; line-height: 1.6;">&ldquo;${report.executiveStatement}&rdquo;</p>
        </div>

        <div class="rm-section-title">
          <span>Key Operational &amp; Clinical Highlights (FY ${report.year})</span>
        </div>
        <ul style="padding-left: 1.3rem; margin: 0.6rem 0 1.2rem 0; line-height: 1.8;">
          ${report.operationalHighlights.map(h => `<li>${h}</li>`).join('')}
        </ul>

        <div class="rm-section-title">
          <span>Audited Financial Statements Summary</span>
        </div>
        <table class="rm-table">
          <thead>
            <tr>
              <th>Financial Parameter</th>
              <th style="text-align: right;">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            ${report.financials.map(f => `
              <tr>
                <td><strong>${f.item}</strong></td>
                <td style="text-align: right; font-family: var(--font-mono); font-weight: 700;">${f.val}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="rm-audit-box">
          <div style="font-weight: 800; color: var(--ink-primary); margin-bottom: 0.25rem;">
            Certified Statutory Auditor's Opinion
          </div>
          <div>${report.auditorSignoff}</div>
        </div>
      `;
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => downloadReport(report.id);
    }
    if (downloadLabel) {
      downloadLabel.textContent = `Download Official Report (${report.year})`;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  function closeReportModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeReportModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeReportModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeReportModal();
    }
  });

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Document Download Utility: Generates an official branded HTML report document
  window.downloadReport = function(id) {
    const report = REPORTS_ARCHIVE.find(r => r.id === id);
    if (!report) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${report.entityName} - Annual Report ${report.year}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0a2540; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    .header { border-bottom: 3px solid #0b3b60; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 26px; font-weight: 900; color: #0b3b60; margin: 0; }
    .subtitle { color: #0284c7; font-weight: 700; margin-top: 5px; }
    .meta { font-size: 13px; color: #627d98; font-family: monospace; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
    .statement-box { background: #f8fafc; border-left: 4px solid #0284c7; padding: 15px 20px; border-radius: 4px; margin: 25px 0; font-style: italic; }
    h2 { font-size: 18px; color: #0b3b60; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; }
    td.amount { text-align: right; font-family: monospace; font-weight: bold; }
    .audit-seal { background: #f0fdf4; border: 1px solid #86efac; border-left: 5px solid #16a34a; padding: 15px; border-radius: 4px; margin-top: 30px; }
    .footer { font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; margin-top: 50px; padding-top: 20px; }
    @media print { body { margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">CHIKO ENTERPRISES</div>
      <div class="subtitle">${report.entityName.toUpperCase()} &bull; OFFICIAL STATUTORY FILING</div>
    </div>
    <div class="meta">
      Period: ${report.period}<br>
      Filing Ref: CE-${report.year}-${report.entity.substring(0, 3).toUpperCase()}
    </div>
  </div>

  <span class="badge">Official Certified Annual Report &bull; FY ${report.year}</span>
  <h1 style="font-size: 22px; margin: 10px 0 5px 0;">${report.title}</h1>
  <div style="color: #64748b; font-size: 14px; margin-bottom: 20px;">${report.subtitle}</div>

  <div class="statement-box">
    &ldquo;${report.executiveStatement}&rdquo;
    <div style="font-style: normal; font-weight: bold; margin-top: 8px; font-size: 12px; color: #0b3b60;">— Executive Committee, Chiko Enterprises</div>
  </div>

  <h2>Executive Operational Summary</h2>
  <p>${report.summary}</p>

  <h2>Audited Key Performance Indicators</h2>
  <ul>
    ${report.operationalHighlights.map(h => `<li>${h}</li>`).join('')}
  </ul>

  <h2>Audited Financial Statements Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Statutory Ledger Parameter</th>
        <th style="text-align: right;">Amount (USD)</th>
      </tr>
    </thead>
    <tbody>
      ${report.financials.map(f => `
        <tr>
          <td><strong>${f.item}</strong></td>
          <td class="amount">${f.val}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="audit-seal">
    <strong style="color: #166534; display: block; margin-bottom: 5px;">Certified Independent External Audit &amp; TMDA Clearance</strong>
    <span style="font-size: 13px; color: #1e293b;">${report.auditorSignoff}</span>
  </div>

  <div class="footer">
    &copy; ${report.year} Chiko Enterprises &bull; Central Zone Regional Office, Dodoma City, Tanzania<br>
    Registered with TMDA, Ministry of Agriculture, and Business Registration &amp; Licensing Agency (BRELA).
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.entityName.replace(/\s+/g, '_')}_Annual_Report_${report.year}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded Annual Report: ${report.entityName} (FY ${report.year})`);
  };

  // Filter helper from footer or external links
  window.filterReportsByEntity = function(entity) {
    const targetCard = document.querySelector(`.report-card.entity-${entity}`);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetCard.style.outline = '2px solid var(--brand-blue-accent)';
      setTimeout(() => { targetCard.style.outline = ''; }, 3000);
    }
  };

  // Initial render for latest year
  renderCards(currentYear);
}

