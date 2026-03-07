import React from 'react';

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.6',
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const DashboardIcon = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="5" rx="2" />
    <rect x="13" y="10" width="8" height="11" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
  </svg>
);

const CategoriesIcon = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M4 7h7l1 2h8v9H4z" />
    <path d="M4 7l3-3h6l1 3" />
  </svg>
);

const ProductsIcon = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
  </svg>
);

const OrdersIcon = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M8 3h8l2 4v13H6V7l2-4z" />
    <path d="M9 11h6" />
    <path d="M9 15h6" />
  </svg>
);

const UsersIcon = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx="8" cy="9" r="3" />
    <circle cx="16" cy="9" r="3" />
    <path d="M2.5 20c1.2-3.2 4-5 7.5-5" />
    <path d="M14 15c3.4 0 6.3 1.8 7.5 5" />
  </svg>
);

const PagesIcon = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5" />
    <path d="M10 13h6" />
    <path d="M10 17h6" />
  </svg>
);

const RecordsIcon = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M12 7v5l3 2" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const AttributesIcon = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="11" cy="18" r="2" />
  </svg>
);

const StoresIcon = (props) => (
  <svg {...baseProps} {...props}>
    <path d="M4 7h16l-1.5-4h-13z" />
    <path d="M5 7v12h14V7" />
    <path d="M9 19v-6h6v6" />
    <path d="M4 10h16" />
  </svg>
);

const CartsIcon = (props) => (
  <svg {...baseProps} {...props}>
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="18" cy="20" r="1.6" />
    <path d="M2.5 4h2l2.2 10h11l2-7H7.2" />
  </svg>
);

const PaymentsIcon = (props) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 15h3" />
  </svg>
);

const iconMap = {
  dashboard: DashboardIcon,
  categories: CategoriesIcon,
  main_categories: CategoriesIcon,
  subcategories: CategoriesIcon,
  products: ProductsIcon,
  orders: OrdersIcon,
  users: UsersIcon,
  home_banners: PagesIcon,
  pages: PagesIcon,
  records: RecordsIcon,
  attributes: AttributesIcon,
  stores: StoresIcon,
  carts: CartsIcon,
  payments: PaymentsIcon
};

export const Icon = ({ name, className }) => {
  const Svg = iconMap[name];
  if (!Svg) return null;
  return <Svg className={className} aria-hidden="true" />;
};

export default iconMap;
