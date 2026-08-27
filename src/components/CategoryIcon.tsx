/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  Heart,
  Package,
  Coffee,
  Home,
  Plane,
  Music,
  Smartphone,
  PiggyBank,
  Gift,
  Briefcase,
  Key,
  BookOpen,
  Sparkles,
  TrendingUp,
  Activity,
  Film,
  Camera,
  Shirt,
  Scissors
} from 'lucide-react';

// Export the catalog for selection list
export const ICON_CATALOG = [
  { name: 'Utensils', component: Utensils },
  { name: 'Car', component: Car },
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'Receipt', component: Receipt },
  { name: 'Gamepad2', component: Gamepad2 },
  { name: 'Heart', component: Heart },
  { name: 'Package', component: Package },
  { name: 'Coffee', component: Coffee },
  { name: 'Home', component: Home },
  { name: 'Plane', component: Plane },
  { name: 'Music', component: Music },
  { name: 'Smartphone', component: Smartphone },
  { name: 'PiggyBank', component: PiggyBank },
  { name: 'Gift', component: Gift },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Key', component: Key },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Sparkles', component: Sparkles },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Activity', component: Activity },
  { name: 'Film', component: Film },
  { name: 'Camera', component: Camera },
  { name: 'Shirt', component: Shirt },
  { name: 'Scissors', component: Scissors }
];

interface CategoryIconProps {
  categoryName: string;
  className?: string;
  iconName?: string; // Optional custom selected icon name from catalog
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ categoryName, className = "h-4 w-4", iconName }) => {
  // Check if iconName is directly specified and is in our catalog
  if (iconName) {
    const matched = ICON_CATALOG.find(i => i.name === iconName);
    if (matched) {
      const Component = matched.component;
      return <Component className={className} />;
    }
  }

  // Fallbacks for standard categories
  switch (categoryName) {
    case 'Food':
      return <Utensils className={className} />;
    case 'Transport':
      return <Car className={className} />;
    case 'Shopping':
      return <ShoppingBag className={className} />;
    case 'Bills':
      return <Receipt className={className} />;
    case 'Entertainment':
      return <Gamepad2 className={className} />;
    case 'Health':
      return <Heart className={className} />;
    case 'Savings':
      return <PiggyBank className={className} />;
    case 'Other':
      return <Package className={className} />;
    default: {
      // If we saved an icon name direct in the database for a custom category
      const CatalogMatch = ICON_CATALOG.find(item => item.name === categoryName);
      if (CatalogMatch) {
         const Component = CatalogMatch.component;
         return <Component className={className} />;
      }
      return <Package className={className} />;
    }
  }
};
