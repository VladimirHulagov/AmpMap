@@ .. @@
 import React, { useState } from 'react';
-import {
-  SearchOutlined,
-  UserOutlined,
-  WarningOutlined,
-  LockOutlined,
-  FileTextOutlined,
-  ToolOutlined,
-  BulbOutlined,
-  BarChartOutlined,
-  ThunderboltOutlined,
-  PoweroffOutlined,
-  SaveOutlined,
-  RocketOutlined
-} from "@ant-design/icons";
+import RestrictionIcons from './components/RestrictionIcons';
+import VersionControl from './components/VersionControl';
+import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
 
 const App = () => {
+  // Note state
+  const [note, setNote] = useState('');
+  const [noteEditedBy, setNoteEditedBy] = useState('');
+  const [isNoteConfirmed, setIsNoteConfirmed] = useState(false);
+
+  // Restrictions state
+  const [restrictions, setRestrictions] = useState({
+    achtung: false,
+    fixedCommodity: false,
+    lava: false,
+    maintenance: false,
+    identLED: false,
+    notifications: false,
+    ikvm: false,
+    healthStatus: true,
+    power: true,
+  });
+
+  // Version management state
+  const [versionUpdates, setVersionUpdates] = useState({
+    bmc: { isOpen: false, searchValue: '', selectedValue: '', showDropdown: false },
+    bios: { isOpen: false, searchValue: '', selectedValue: '', showDropdown: false }
+  });
+
+  const availableVersions = ['latest', 'master', '1.1.0', '2.0.0', '3.0'];
+
+  // Note handlers
+  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
+    const value = e.target.value;
+    setNote(value);
+    if (value && !noteEditedBy) {
+      setNoteEditedBy('demo');
+    }
+    if (!value) {
+      setNoteEditedBy('');
+      setIsNoteConfirmed(false);
+    }
+  };
+
+  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
+    if (e.key === 'Enter') {
+      setIsNoteConfirmed(true);
+      (e.target as HTMLInputElement).blur();
+    }
+  };
+
+  // Restrictions handlers
+  const handleRestrictionToggle = (key: string) => {
+    setRestrictions(prev => ({
+      ...prev,
+      [key]: !prev[key as keyof typeof prev]
+    }));
+  };
+
+  // Version handlers
+  const handleVersionChange = (type: 'bmc' | 'bios', updates: any) => {
+    setVersionUpdates(prev => ({
+      ...prev,
+      [type]: { ...prev[type], ...updates }
+    }));
+  };
+
+  const handleFlash = (type: 'bmc' | 'bios') => {
+    console.log(`Flashing ${type} with version:`, versionUpdates[type].selectedValue);
+    // Reset state after flash
+    setVersionUpdates(prev => ({
+      ...prev,
+      [type]: { isOpen: false, searchValue: '', selectedValue: '', showDropdown: false }
+    }));
+  };
+
+  const handleCancel = (type: 'bmc' | 'bios') => {
+    setVersionUpdates(prev => ({
+      ...prev,
+      [type]: { isOpen: false, searchValue: '', selectedValue: '', showDropdown: false }
+    }));
+  };
+
+  const isBiosDisabled = !!versionUpdates.bmc.selectedValue;
+
   return (
@@ .. @@
         <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
-            <SearchOutlined className="text-gray-600" />
+            <MagnifyingGlassIcon className="w-5 h-5 text-gray-600" />
             <span className="text-sm text-gray-600">Search for device</span>
           </div>
           <div className="flex items-center gap-2">
-            <UserOutlined className="text-gray-600" />
+            <UserIcon className="w-5 h-5 text-gray-600" />
             <span className="text-sm text-gray-600">demo</span>
           </div>
         </div>
@@ .. @@
           <div className="flex items-center gap-4">
             <span className="text-lg font-semibold text-gray-800">rpi4-01</span>
             <div className="flex gap-2">
-              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
-                <WarningOutlined />
-              </button>
-              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
-                <LockOutlined />
-              </button>
-              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
-                <FileTextOutlined />
-              </button>
-              <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors">
-                <ToolOutlined />
-              </button>
-              <button className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors">
-                <BulbOutlined />
-              </button>
-              <button className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors">
-                <BarChartOutlined />
-              </button>
-              <button className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors">
-                <ThunderboltOutlined />
-              </button>
+              <RestrictionIcons 
+                restrictions={restrictions} 
+                onToggle={handleRestrictionToggle} 
+              />
             </div>
           </div>
         </div>
@@ .. @@
         {/* Note Section */}
         <div className="bg-white rounded-lg border border-gray-200 p-6">
           <h3 className="text-lg font-semibold text-gray-800 mb-4">Note</h3>
-          <div className="space-y-2">
-            <input 
-              type="text" 
-              placeholder="Add a note..." 
-              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
+          <div className="space-y-3">
+            <input
+              type="text"
+              value={note}
+              onChange={handleNoteChange}
+              onKeyDown={handleNoteKeyDown}
+              placeholder="Add a note..."
+              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
+                isNoteConfirmed ? 'border-green-300 bg-green-50' : 'border-gray-300'
+              }`}
             />
+            {noteEditedBy && (
+              <div className="text-sm text-gray-500">
+                edited by {noteEditedBy}
+                {isNoteConfirmed && <span className="text-green-600 ml-2">✓ confirmed</span>}
+              </div>
+            )}
           </div>
         </div>
 
@@ .. @@
         <div className="bg-white rounded-lg border border-gray-200 p-6">
           <h3 className="text-lg font-semibold text-gray-800 mb-4">Version Management</h3>
           <div className="space-y-4">
-            <div className="flex items-center gap-3">
-              <span className="text-sm font-medium text-gray-700">BMC:</span>
-              <span className="text-sm font-mono text-gray-900">bmc-1.0.0</span>
-              <button className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
-                <SaveOutlined className="mr-1" />
-                Change
-              </button>
-            </div>
-            <div className="flex items-center gap-3">
-              <span className="text-sm font-medium text-gray-700">BIOS:</span>
-              <span className="text-sm font-mono text-gray-900">bios-2.1.0</span>
-              <button className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
-                <SaveOutlined className="mr-1" />
-                Change
-              </button>
-            </div>
+            <VersionControl
+              type="bmc"
+              currentVersion="bmc-1.0.0"
+              versionState={versionUpdates.bmc}
+              onVersionChange={handleVersionChange}
+              onFlash={handleFlash}
+              onCancel={handleCancel}
+              availableVersions={availableVersions}
+            />
+            <VersionControl
+              type="bios"
+              currentVersion="bios-2.1.0"
+              versionState={versionUpdates.bios}
+              onVersionChange={handleVersionChange}
+              onFlash={handleFlash}
+              onCancel={handleCancel}
+              isDisabled={isBiosDisabled}
+              disabledText="Synchronized from bundle. Click to change"
+              availableVersions={availableVersions}
+            />
           </div>
         </div>
 
@@ .. @@
           <div className="flex gap-3">
             <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
-              <PoweroffOutlined className="mr-2" />
               BOOT
             </button>
             <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium">
-              <RocketOutlined className="mr-2" />
               DEPLOY
             </button>
           </div>