import React, { useState, useRef, useEffect } from 'react';

interface VersionState {
  isOpen: boolean;
  searchValue: string;
  selectedValue: string;
  showDropdown: boolean;
}

interface VersionControlProps {
  type: 'bmc' | 'bios';
  currentVersion: string;
  versionState: VersionState;
  onVersionChange: (type: 'bmc' | 'bios', updates: Partial<VersionState>) => void;
  onFlash: (type: 'bmc' | 'bios') => void;
  onCancel: (type: 'bmc' | 'bios') => void;
  isDisabled?: boolean;
  disabledText?: string;
  availableVersions: string[];
}

const VersionControl: React.FC<VersionControlProps> = ({
  type,
  currentVersion,
  versionState,
  onVersionChange,
  onFlash,
  onCancel,
  isDisabled = false,
  disabledText,
  availableVersions
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredVersions = availableVersions.filter(version =>
    version.toLowerCase().includes(versionState.searchValue.toLowerCase())
  );

  useEffect(() => {
    if (versionState.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [versionState.isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onVersionChange(type, { showDropdown: false });
      }
    };

    if (versionState.showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [versionState.showDropdown, type, onVersionChange]);

  const handleSearchChange = (value: string) => {
    onVersionChange(type, { 
      searchValue: value, 
      showDropdown: value.length > 0 && filteredVersions.length > 0 
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredVersions.length > 0) {
      const selectedVersion = filteredVersions[0];
      onVersionChange(type, {
        selectedValue: selectedVersion,
        searchValue: '',
        showDropdown: false,
        isOpen: false
      });
    }
  };

  const handleVersionSelect = (version: string) => {
    onVersionChange(type, {
      selectedValue: version,
      searchValue: '',
      showDropdown: false,
      isOpen: false
    });
  };

  const handleChangeClick = () => {
    if (isDisabled) return;
    onVersionChange(type, { isOpen: true, searchValue: '', showDropdown: false });
  };

  const displayVersion = versionState.selectedValue || currentVersion;
  const hasSelectedVersion = !!versionState.selectedValue;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 uppercase">
          {type}:
        </span>
        
        {versionState.isOpen ? (
          <div className="relative" ref={dropdownRef}>
            <input
              ref={inputRef}
              type="text"
              value={versionState.searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => onVersionChange(type, { showDropdown: versionState.searchValue.length > 0 && filteredVersions.length > 0 })}
              placeholder="Search versions..."
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {versionState.showDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {filteredVersions.map((version) => (
                  <button
                    key={version}
                    onClick={() => handleVersionSelect(version)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  >
                    {version}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className={`text-sm font-mono ${hasSelectedVersion ? 'text-blue-600' : 'text-gray-900'}`}>
            {displayVersion}
          </span>
        )}
      </div>

      {!versionState.isOpen && !hasSelectedVersion && (
        <button
          onClick={handleChangeClick}
          disabled={isDisabled}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            isDisabled
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title={isDisabled ? disabledText : undefined}
        >
          Change
        </button>
      )}

      {hasSelectedVersion && (
        <div className="flex gap-2">
          <button
            onClick={() => onFlash(type)}
            className="px-3 py-1 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Flash
          </button>
          <button
            onClick={() => onCancel(type)}
            className="px-3 py-1 text-sm font-medium bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default VersionControl;