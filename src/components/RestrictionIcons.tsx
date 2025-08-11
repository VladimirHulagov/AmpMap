import React from 'react';
import {
  ExclamationTriangleIcon,
  MapPinIcon,
  FireIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  BellIcon,
  ComputerDesktopIcon,
  HeartIcon,
  PowerIcon
} from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon as ExclamationTriangleSolid,
  MapPinIcon as MapPinSolid,
  FireIcon as FireSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverSolid,
  LightBulbIcon as LightBulbSolid,
  BellIcon as BellSolid,
  ComputerDesktopIcon as ComputerDesktopSolid,
  HeartIcon as HeartSolid,
  PowerIcon as PowerSolid
} from '@heroicons/react/24/solid';

interface RestrictionIconsProps {
  restrictions: {
    achtung: boolean;
    fixedCommodity: boolean;
    lava: boolean;
    maintenance: boolean;
    identLED: boolean;
    notifications: boolean;
    ikvm: boolean;
    healthStatus: boolean;
    power: boolean;
  };
  onToggle: (key: string) => void;
}

const RestrictionIcons: React.FC<RestrictionIconsProps> = ({ restrictions, onToggle }) => {
  const iconConfig = [
    { key: 'achtung', OutlineIcon: ExclamationTriangleIcon, SolidIcon: ExclamationTriangleSolid, title: 'Alert' },
    { key: 'fixedCommodity', OutlineIcon: MapPinIcon, SolidIcon: MapPinSolid, title: 'Fixed Commodity' },
    { key: 'lava', OutlineIcon: FireIcon, SolidIcon: FireSolid, title: 'LAVA' },
    { key: 'maintenance', OutlineIcon: WrenchScrewdriverIcon, SolidIcon: WrenchScrewdriverSolid, title: 'Maintenance' },
    { key: 'identLED', OutlineIcon: LightBulbIcon, SolidIcon: LightBulbSolid, title: 'Ident LED' },
    { key: 'notifications', OutlineIcon: BellIcon, SolidIcon: BellSolid, title: 'Subscribe to notifications' },
    { key: 'ikvm', OutlineIcon: ComputerDesktopIcon, SolidIcon: ComputerDesktopSolid, title: 'Launch iKVM' },
    { key: 'healthStatus', OutlineIcon: HeartIcon, SolidIcon: HeartSolid, title: 'Health Status' },
    { key: 'power', OutlineIcon: PowerIcon, SolidIcon: PowerSolid, title: 'Power Status' }
  ];

  const getIconColor = (key: string, isActive: boolean) => {
    if (!isActive) return 'text-gray-400';
    if (key === 'healthStatus' || key === 'power') return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <div className="flex gap-2">
      {iconConfig.map(({ key, OutlineIcon, SolidIcon, title }) => {
        const isActive = restrictions[key as keyof typeof restrictions];
        const IconComponent = isActive ? SolidIcon : OutlineIcon;
        
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`p-2 rounded-md transition-all duration-200 hover:bg-gray-100 ${getIconColor(key, isActive)}`}
            title={title}
          >
            <IconComponent className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
};

export default RestrictionIcons;