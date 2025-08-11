import React from 'react';
import {
  SearchOutlined,
  UserOutlined,
  WarningOutlined,
  LockOutlined,
  FileTextOutlined,
  ToolOutlined,
  BulbOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  PoweroffOutlined,
  SaveOutlined,
  RocketOutlined
} from "@ant-design/icons";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Device Interface</h1>
            <div className="flex items-center space-x-2">
              <SearchOutlined className="text-gray-500" />
              <span className="text-sm text-gray-600">Search device</span>
            </div>
          </div>
          <div className="flex items-center">
            <UserOutlined className="text-gray-500 text-lg" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <button className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <WarningOutlined className="text-2xl text-orange-500 mb-2" />
              <span className="text-sm text-gray-700">Warning</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <LockOutlined className="text-2xl text-red-500 mb-2" />
              <span className="text-sm text-gray-700">Lock</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <FileTextOutlined className="text-2xl text-blue-500 mb-2" />
              <span className="text-sm text-gray-700">Notes</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ToolOutlined className="text-2xl text-gray-500 mb-2" />
              <span className="text-sm text-gray-700">Tools</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <BulbOutlined className="text-2xl text-yellow-500 mb-2" />
              <span className="text-sm text-gray-700">Ideas</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-500 rounded-lg text-white hover:bg-green-600 transition-colors">
              <BarChartOutlined className="text-2xl mb-2" />
              <span className="text-sm">Statistics</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-500 rounded-lg text-white hover:bg-green-600 transition-colors">
              <ThunderboltOutlined className="text-2xl mb-2" />
              <span className="text-sm">Lightning</span>
            </button>
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Control Panel</h2>
            
            <div className="grid grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Auto</option>
                    <option>Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                  <SaveOutlined className="mr-2" />
                  CHANGE
                </button>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Level 1</option>
                    <option>Level 2</option>
                    <option>Level 3</option>
                  </select>
                </div>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
                  <PoweroffOutlined className="mr-2" />
                  BOOT
                </button>
              </div>

              {/* Column 3 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Config</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Default</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>v1.0</option>
                    <option>v2.0</option>
                  </select>
                </div>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                  <RocketOutlined className="mr-2" />
                  DEPLOY
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;