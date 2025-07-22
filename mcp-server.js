#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

class PlaywrightMCPServer {
  constructor() {
    this.tools = [
      {
        name: 'run_tests',
        description: 'Run Playwright tests for the diamond lattice app',
        inputSchema: {
          type: 'object',
          properties: {
            headed: {
              type: 'boolean',
              description: 'Run tests in headed mode (visible browser)',
              default: false
            },
            debug: {
              type: 'boolean', 
              description: 'Run tests in debug mode',
              default: false
            },
            ui: {
              type: 'boolean',
              description: 'Run tests with UI mode',
              default: false
            },
            grep: {
              type: 'string',
              description: 'Filter tests by name pattern'
            }
          }
        }
      },
      {
        name: 'test_status',
        description: 'Get the status of the test setup',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'dev_server_status',
        description: 'Check if development server is running',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async handleRequest(request) {
    const { method, params } = request;

    switch (method) {
      case 'tools/list':
        return { tools: this.tools };
        
      case 'tools/call':
        return await this.handleToolCall(params);
        
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  async handleToolCall(params) {
    const { name, arguments: args } = params;

    switch (name) {
      case 'run_tests':
        return await this.runTests(args);
        
      case 'test_status':
        return await this.getTestStatus();
        
      case 'dev_server_status':
        return await this.getDevServerStatus();
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async runTests(args = {}) {
    const { headed = false, debug = false, ui = false, grep } = args;
    
    let command = 'npm run test';
    
    if (headed) command = 'npm run test:headed';
    if (debug) command = 'npm run test:debug';
    if (ui) command = 'npm run test:ui';
    
    if (grep) {
      command += ` -- --grep "${grep}"`;
    }

    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          content: [{
            type: 'text',
            text: `Test execution completed with exit code: ${code}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`
          }]
        });
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run tests: ${error.message}`));
      });
    });
  }

  async getTestStatus() {
    const configExists = existsSync(join(process.cwd(), 'playwright.config.js'));
    const testsDir = existsSync(join(process.cwd(), 'tests'));
    const packageJson = existsSync(join(process.cwd(), 'package.json'));
    
    let testScripts = '';
    if (packageJson) {
      try {
        const pkg = JSON.parse(require('fs').readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
        testScripts = Object.keys(pkg.scripts || {}).filter(s => s.startsWith('test')).join(', ');
      } catch (e) {
        testScripts = 'Error reading package.json';
      }
    }

    return {
      content: [{
        type: 'text',
        text: `Playwright Test Setup Status:
- Config file (playwright.config.js): ${configExists ? '✅ EXISTS' : '❌ MISSING'}
- Tests directory: ${testsDir ? '✅ EXISTS' : '❌ MISSING'}
- Package.json: ${packageJson ? '✅ EXISTS' : '❌ MISSING'}
- Test scripts: ${testScripts || 'None found'}

Available test commands:
- npm run test (headless)
- npm run test:headed (visible browser)
- npm run test:ui (interactive UI)
- npm run test:debug (debug mode)`
      }]
    };
  }

  async getDevServerStatus() {
    return new Promise((resolve) => {
      const child = spawn('curl', ['-s', 'http://localhost:3000'], {
        stdio: 'pipe'
      });

      let isRunning = false;
      
      child.on('close', (code) => {
        isRunning = code === 0;
        resolve({
          content: [{
            type: 'text',
            text: `Development Server Status:
- URL: http://localhost:3000
- Status: ${isRunning ? '✅ RUNNING' : '❌ NOT RUNNING'}
- Curl exit code: ${code}

${isRunning ? 'Server is ready for testing!' : 'Please start the server with: npm run dev'}`
          }]
        });
      });
    });
  }
}

// MCP Server Protocol Implementation
const server = new PlaywrightMCPServer();

process.stdin.on('data', async (data) => {
  try {
    const request = JSON.parse(data.toString());
    const response = await server.handleRequest(request);
    
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      result: response
    }));
  } catch (error) {
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id || null,
      error: {
        code: -32603,
        message: error.message
      }
    }));
  }
});

process.on('SIGINT', () => {
  process.exit(0);
});

console.error('Playwright MCP Server started');