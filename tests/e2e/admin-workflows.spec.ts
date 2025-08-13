import { test, expect } from '@playwright/test'
import {
  generateTestUser,
  signInUser,
  setAuthState,
  navigateToAdminDashboard,
  waitForToast,
  mockAPIResponse,
  mockArticles
} from '../utils/test-helpers'

test.describe('Admin Workflows - Complete E2E Testing', () => {
  // Set up admin user for all tests
  test.beforeEach(async ({ page, context }) => {
    await setAuthState(context, {
      accessToken: 'admin-token',
      refreshToken: 'admin-refresh-token',
      expiresIn: 3600
    })
    
    // Mock admin user data
    await mockAPIResponse(page, '**/auth/v1/user', {
      id: 'admin-user-id',
      email: 'admin@mydub.ai',
      user_metadata: {
        full_name: 'Admin User',
        role: 'admin'
      }
    })
  })
  
  test.describe('Dashboard Access and Navigation', () => {
    test('should access admin dashboard with proper authorization', async ({ page }) => {
      await navigateToAdminDashboard(page)
      
      // Verify dashboard elements
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
      await expect(page.getByText('Welcome back, Admin User')).toBeVisible()
      
      // Check all admin menu items
      const menuItems = [
        'Dashboard Overview',
        'Content Management',
        'User Management',
        'Analytics',
        'Categories',
        'AI Configuration',
        'System Settings',
        'Audit Logs'
      ]
      
      for (const item of menuItems) {
        await expect(page.getByRole('link', { name: item })).toBeVisible()
      }
    })
    
    test('should show real-time stats on dashboard', async ({ page }) => {
      // Mock dashboard stats
      await mockAPIResponse(page, '**/api/admin/stats', {
        totalUsers: 15420,
        activeUsers: 3567,
        totalArticles: 2341,
        pendingApproval: 23,
        todayVisits: 8934,
        aiQueries: 1256
      })
      
      await navigateToAdminDashboard(page)
      
      // Verify stats cards
      await expect(page.getByText('15,420').first()).toBeVisible() // Total Users
      await expect(page.getByText('3,567')).toBeVisible() // Active Users
      await expect(page.getByText('2,341')).toBeVisible() // Total Articles
      await expect(page.getByText('23')).toBeVisible() // Pending Approval
      
      // Check real-time updates
      await page.waitForTimeout(5000)
      // Stats should auto-refresh
      await expect(page.getByText('15,421')).toBeVisible() // Updated user count
    })
    
    test('should handle admin role verification', async ({ page, context }) => {
      // Test with non-admin user
      await context.clearCookies()
      await setAuthState(context, {
        accessToken: 'user-token',
        refreshToken: 'user-refresh-token',
        expiresIn: 3600
      })
      
      await mockAPIResponse(page, '**/auth/v1/user', {
        id: 'regular-user-id',
        email: 'user@example.com',
        user_metadata: {
          full_name: 'Regular User',
          role: 'user'
        }
      })
      
      await page.goto('/admin')
      
      // Should redirect to home with error
      await expect(page).toHaveURL('/')
      await expect(page.getByText('Unauthorized access')).toBeVisible()
    })
  })
  
  test.describe('Content Management Workflow', () => {
    test('should manage article lifecycle from draft to published', async ({ page }) => {
      await navigateToAdminDashboard(page)
      await page.getByRole('link', { name: 'Content Management' }).click()
      
      // 1. Create new article
      await page.getByRole('button', { name: 'Create Article' }).click()
      await expect(page).toHaveURL('/admin/content/new')
      
      // 2. Fill article form
      await page.getByLabel('Title').fill('New Dubai Metro Extension Opens')
      await page.getByLabel('Category').selectOption('news')
      await page.getByLabel('Author').fill('Admin User')
      
      // 3. Rich text editor
      const editor = page.locator('[contenteditable="true"]')
      await editor.fill('The new Dubai Metro extension connecting...')
      
      // 4. Add images
      await page.getByRole('button', { name: 'Add Image' }).click()
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'metro.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })
      
      // 5. SEO settings
      await page.getByRole('tab', { name: 'SEO' }).click()
      await page.getByLabel('Meta Title').fill('Dubai Metro Extension | Latest News')
      await page.getByLabel('Meta Description').fill('Learn about the new Dubai Metro extension...')
      await page.getByLabel('Keywords').fill('dubai metro, public transport, news')
      
      // 6. Save as draft
      await page.getByRole('button', { name: 'Save Draft' }).click()
      await waitForToast(page, 'Article saved as draft')
      
      // 7. Preview article
      await page.getByRole('button', { name: 'Preview' }).click()
      const previewPage = await page.waitForEvent('popup')
      await expect(previewPage.getByRole('heading', { level: 1 })).toContainText('New Dubai Metro Extension')
      await previewPage.close()
      
      // 8. Submit for review
      await page.getByRole('button', { name: 'Submit for Review' }).click()
      await page.getByLabel('Review Notes').fill('Ready for editorial review')
      await page.getByRole('button', { name: 'Submit' }).click()
      await waitForToast(page, 'Submitted for review')
      
      // 9. Switch to editor view
      await page.goto('/admin/content/review')
      await expect(page.getByText('Pending Review (1)')).toBeVisible()
      
      // 10. Review article
      const articleRow = page.locator('tr').filter({ hasText: 'New Dubai Metro Extension' })
      await articleRow.getByRole('button', { name: 'Review' }).click()
      
      // 11. Add editorial comments
      await page.getByRole('button', { name: 'Add Comment' }).click()
      await page.getByLabel('Comment').fill('Please add more details about the stations')
      await page.getByRole('button', { name: 'Post Comment' }).click()
      
      // 12. Approve with changes
      await page.getByRole('button', { name: 'Approve with Changes' }).click()
      await waitForToast(page, 'Article approved with requested changes')
      
      // 13. Make requested changes
      await page.goto('/admin/content/edit/1')
      await editor.fill(await editor.textContent() + ' The extension includes 7 new stations...')
      await page.getByRole('button', { name: 'Update Article' }).click()
      
      // 14. Schedule publication
      await page.getByRole('button', { name: 'Schedule' }).click()
      await page.getByLabel('Publish Date').fill('2024-01-15')
      await page.getByLabel('Publish Time').fill('09:00')
      await page.getByRole('button', { name: 'Schedule Publication' }).click()
      await waitForToast(page, 'Article scheduled for publication')
      
      // 15. Verify in content list
      await page.goto('/admin/content')
      await expect(articleRow.getByText('Scheduled')).toBeVisible()
      await expect(articleRow.getByText('Jan 15, 2024 09:00')).toBeVisible()
    })
    
    test('should bulk manage articles', async ({ page }) => {
      // Mock articles list
      await mockAPIResponse(page, '**/api/admin/articles**', {
        articles: mockArticles,
        total: 150,
        page: 1,
        perPage: 20
      })
      
      await navigateToAdminDashboard(page)
      await page.getByRole('link', { name: 'Content Management' }).click()
      
      // 1. Select multiple articles
      await page.getByRole('checkbox', { name: 'Select all' }).check()
      await expect(page.getByText('3 items selected')).toBeVisible()
      
      // 2. Bulk actions dropdown
      await page.getByRole('button', { name: 'Bulk Actions' }).click()
      await page.getByRole('menuitem', { name: 'Change Category' }).click()
      
      // 3. Bulk update modal
      await expect(page.getByRole('dialog', { name: 'Change Category' })).toBeVisible()
      await page.getByLabel('New Category').selectOption('tourism')
      await page.getByRole('button', { name: 'Update 3 Articles' }).click()
      
      await waitForToast(page, '3 articles updated')
      
      // 4. Bulk delete
      await page.getByRole('checkbox', { name: 'Select all' }).check()
      await page.getByRole('button', { name: 'Bulk Actions' }).click()
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      
      // 5. Confirm deletion
      await expect(page.getByRole('dialog', { name: 'Confirm Deletion' })).toBeVisible()
      await expect(page.getByText('Are you sure you want to delete 3 articles?')).toBeVisible()
      await page.getByRole('button', { name: 'Delete' }).click()
      
      await waitForToast(page, '3 articles deleted')
    })
    
    test('should manage article versions and history', async ({ page }) => {
      await navigateToAdminDashboard(page)
      await page.goto('/admin/content/edit/1')
      
      // 1. View version history
      await page.getByRole('tab', { name: 'History' }).click()
      await expect(page.getByText('Version History')).toBeVisible()
      
      // Check versions
      const versions = page.locator('.version-item')
      await expect(versions).toHaveCount(5)
      await expect(versions.first()).toContainText('Current Version')
      
      // 2. Compare versions
      await versions.nth(1).getByRole('button', { name: 'Compare' }).click()
      await expect(page.getByText('Changes from Version 4')).toBeVisible()
      await expect(page.locator('.diff-added')).toBeVisible()
      await expect(page.locator('.diff-removed')).toBeVisible()
      
      // 3. Restore previous version
      await versions.nth(2).getByRole('button', { name: 'Restore' }).click()
      await expect(page.getByText('Restore Version 3?')).toBeVisible()
      await page.getByRole('button', { name: 'Restore' }).click()
      await waitForToast(page, 'Version restored')
      
      // 4. Check audit trail
      await page.getByRole('tab', { name: 'Audit' }).click()
      await expect(page.getByText('Article restored to version 3')).toBeVisible()
      await expect(page.getByText('by Admin User')).toBeVisible()
    })
  })
  
  test.describe('User Management Workflow', () => {
    test('should manage user accounts and roles', async ({ page }) => {
      // Mock users data
      await mockAPIResponse(page, '**/api/admin/users**', {
        users: [
          {
            id: '1',
            email: 'john@example.com',
            full_name: 'John Doe',
            role: 'user',
            status: 'active',
            created_at: '2024-01-01',
            last_login: '2024-01-10'
          },
          {
            id: '2',
            email: 'jane@example.com',
            full_name: 'Jane Smith',
            role: 'curator',
            status: 'active',
            created_at: '2024-01-02',
            last_login: '2024-01-09'
          }
        ],
        total: 1543
      })
      
      await navigateToAdminDashboard(page)
      await page.getByRole('link', { name: 'User Management' }).click()
      
      // 1. Search and filter users
      await page.getByPlaceholder('Search users...').fill('john')
      await page.keyboard.press('Enter')
      await expect(page.locator('tr').filter({ hasText: 'John Doe' })).toBeVisible()
      
      // 2. Filter by role
      await page.getByLabel('Filter by role').selectOption('curator')
      await expect(page.locator('tr').filter({ hasText: 'Jane Smith' })).toBeVisible()
      
      // 3. Edit user
      const userRow = page.locator('tr').filter({ hasText: 'John Doe' })
      await userRow.getByRole('button', { name: 'Edit' }).click()
      
      // 4. Update user details
      await expect(page.getByRole('dialog', { name: 'Edit User' })).toBeVisible()
      await page.getByLabel('Role').selectOption('editor')
      await page.getByLabel('Status').selectOption('suspended')
      await page.getByLabel('Suspension Reason').fill('Policy violation')
      await page.getByRole('button', { name: 'Save Changes' }).click()
      
      await waitForToast(page, 'User updated successfully')
      
      // 5. Send notification
      await userRow.getByRole('button', { name: 'Actions' }).click()
      await page.getByRole('menuitem', { name: 'Send Notification' }).click()
      await page.getByLabel('Subject').fill('Account Status Update')
      await page.getByLabel('Message').fill('Your account has been suspended...')
      await page.getByRole('button', { name: 'Send' }).click()
      
      await waitForToast(page, 'Notification sent')
      
      // 6. View user activity
      await userRow.getByRole('button', { name: 'View Activity' }).click()
      await expect(page).toHaveURL('/admin/users/1/activity')
      await expect(page.getByText('User Activity Log')).toBeVisible()
      await expect(page.getByText('Login from 192.168.1.1')).toBeVisible()
      
      // 7. Export users
      await page.goto('/admin/users')
      await page.getByRole('button', { name: 'Export' }).click()
      await page.getByLabel('Export Format').selectOption('csv')
      await page.getByLabel('Include').check()
      
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Download Export' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toBe('users-export.csv')
    })
    
    test('should manage user permissions granularly', async ({ page }) => {
      await navigateToAdminDashboard(page)
      await page.goto('/admin/users/1/permissions')
      
      // 1. View current permissions
      await expect(page.getByRole('heading', { name: 'User Permissions' })).toBeVisible()
      
      // 2. Toggle permissions
      const permissions = [
        'content.create',
        'content.edit',
        'content.delete',
        'content.publish',
        'users.view',
        'analytics.view'
      ]
      
      for (const perm of permissions) {
        const toggle = page.getByLabel(perm)
        const isChecked = await toggle.isChecked()
        await toggle.setChecked(!isChecked)
      }
      
      // 3. Add custom permission
      await page.getByRole('button', { name: 'Add Custom Permission' }).click()
      await page.getByLabel('Permission Key').fill('api.special_access')
      await page.getByLabel('Description').fill('Access to special API endpoints')
      await page.getByRole('button', { name: 'Add' }).click()
      
      // 4. Save permissions
      await page.getByRole('button', { name: 'Save Permissions' }).click()
      await waitForToast(page, 'Permissions updated')
      
      // 5. Test permission inheritance
      await page.getByRole('tab', { name: 'Role Permissions' }).click()
      await expect(page.getByText('Inherited from: Editor')).toBeVisible()
      await expect(page.getByText('Additional permissions: 1')).toBeVisible()
    })
  })
  
  test.describe('Analytics and Reporting', () => {
    test('should view and interact with analytics dashboards', async ({ page }) => {
      await navigateToAdminDashboard(page)
      await page.getByRole('link', { name: 'Analytics' }).click()
      
      // 1. Overview metrics
      await expect(page.getByRole('heading', { name: 'Analytics Overview' })).toBeVisible()
      await expect(page.locator('canvas#visitors-chart')).toBeVisible()
      await expect(page.locator('canvas#engagement-chart')).toBeVisible()
      
      // 2. Date range selection
      await page.getByRole('button', { name: 'Last 7 days' }).click()
      await page.getByRole('menuitem', { name: 'Last 30 days' }).click()
      await page.waitForLoadState('networkidle')
      
      // 3. Detailed reports
      await page.getByRole('tab', { name: 'Content Performance' }).click()
      await expect(page.getByText('Top Performing Articles')).toBeVisible()
      await expect(page.locator('table.performance-table')).toBeVisible()
      
      // 4. Export report
      await page.getByRole('button', { name: 'Export Report' }).click()
      await page.getByLabel('Report Type').selectOption('detailed')
      await page.getByLabel('Include Charts').check()
      
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Generate PDF' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('analytics-report')
      
      // 5. Real-time analytics
      await page.getByRole('tab', { name: 'Real-Time' }).click()
      await expect(page.getByText('Active Users Now')).toBeVisible()
      await expect(page.locator('.realtime-counter')).toBeVisible()
      
      // Check live updates
      const initialCount = await page.locator('.realtime-counter').textContent()
      await page.waitForTimeout(5000)
      const updatedCount = await page.locator('.realtime-counter').textContent()
      expect(updatedCount).not.toBe(initialCount)
      
      // 6. Custom reports
      await page.getByRole('button', { name: 'Create Custom Report' }).click()
      await page.getByLabel('Report Name').fill('Weekly User Engagement')
      await page.getByLabel('Metrics').selectOption(['pageviews', 'users', 'sessions'])
      await page.getByLabel('Dimensions').selectOption(['date', 'source'])
      await page.getByRole('button', { name: 'Create Report' }).click()
      
      await waitForToast(page, 'Custom report created')
    })
  })
  
  test.describe('System Configuration', () => {
    test('should manage AI configuration', async ({ page }) => {
      await navigateToAdminDashboard(page)
      await page.getByRole('link', { name: 'AI Configuration' }).click()
      
      // 1. Configure AI models
      await expect(page.getByRole('heading', { name: 'AI Model Configuration' })).toBeVisible()
      
      // 2. Update OpenAI settings
      await page.getByRole('tab', { name: 'OpenAI' }).click()
      await page.getByLabel('Model').selectOption('gpt-4-turbo-preview')
      await page.getByLabel('Temperature').fill('0.7')
      await page.getByLabel('Max Tokens').fill('2000')
      await page.getByLabel('System Prompt').fill('You are a helpful Dubai tourism assistant...')
      await page.getByRole('button', { name: 'Save OpenAI Config' }).click()
      
      // 3. Test configuration
      await page.getByRole('button', { name: 'Test Configuration' }).click()
      await page.getByLabel('Test Query').fill('What is the weather in Dubai?')
      await page.getByRole('button', { name: 'Run Test' }).click()
      
      await expect(page.getByText('Test successful')).toBeVisible()
      await expect(page.locator('.test-response')).toContainText('weather')
      
      // 4. Configure Claude
      await page.getByRole('tab', { name: 'Claude' }).click()
      await page.getByLabel('Model').selectOption('claude-3-opus')
      await page.getByLabel('Enable').check()
      await page.getByRole('button', { name: 'Save Claude Config' }).click()
      
      // 5. Set up fallback
      await page.getByRole('tab', { name: 'Fallback Strategy' }).click()
      await page.getByLabel('Primary Model').selectOption('openai')
      await page.getByLabel('Fallback Model').selectOption('claude')
      await page.getByLabel('Fallback Trigger').selectOption('error')
      await page.getByRole('button', { name: 'Save Strategy' }).click()
      
      await waitForToast(page, 'AI configuration updated')
    })
    
    test('should manage system settings', async ({ page }) => {
      await navigateToAdminDashboard(page)
      await page.getByRole('link', { name: 'System Settings' }).click()
      
      // 1. General settings
      await page.getByRole('tab', { name: 'General' }).click()
      await page.getByLabel('Site Title').clear()
      await page.getByLabel('Site Title').fill('MyDub.AI - Your Dubai Guide')
      await page.getByLabel('Maintenance Mode').check()
      await page.getByLabel('Maintenance Message').fill('System upgrade in progress...')
      
      // 2. Email settings
      await page.getByRole('tab', { name: 'Email' }).click()
      await page.getByLabel('SMTP Host').fill('smtp.sendgrid.net')
      await page.getByLabel('SMTP Port').fill('587')
      await page.getByLabel('From Email').fill('noreply@mydub.ai')
      await page.getByRole('button', { name: 'Test Email Config' }).click()
      await waitForToast(page, 'Test email sent')
      
      // 3. Security settings
      await page.getByRole('tab', { name: 'Security' }).click()
      await page.getByLabel('Password Min Length').fill('10')
      await page.getByLabel('Session Timeout').fill('30')
      await page.getByLabel('2FA Required for Admin').check()
      await page.getByLabel('IP Whitelist').fill('192.168.1.0/24\n10.0.0.0/8')
      
      // 4. Save all settings
      await page.getByRole('button', { name: 'Save All Settings' }).click()
      await waitForToast(page, 'System settings updated')
      
      // 5. Clear cache
      await page.getByRole('tab', { name: 'Cache' }).click()
      await page.getByRole('button', { name: 'Clear All Cache' }).click()
      await expect(page.getByText('Are you sure?')).toBeVisible()
      await page.getByRole('button', { name: 'Confirm' }).click()
      await waitForToast(page, 'Cache cleared successfully')
    })
  })
  
  test.describe('Audit and Monitoring', () => {
    test('should view and filter audit logs', async ({ page }) => {
      await navigateToAdminDashboard(page)
      await page.getByRole('link', { name: 'Audit Logs' }).click()
      
      // 1. View audit logs
      await expect(page.getByRole('heading', { name: 'System Audit Logs' })).toBeVisible()
      await expect(page.locator('table.audit-logs')).toBeVisible()
      
      // 2. Filter by action
      await page.getByLabel('Action Type').selectOption('user.login')
      await page.getByRole('button', { name: 'Apply Filters' }).click()
      await expect(page.locator('tr').filter({ hasText: 'User Login' })).toHaveCount(10)
      
      // 3. Filter by date range
      await page.getByLabel('Start Date').fill('2024-01-01')
      await page.getByLabel('End Date').fill('2024-01-31')
      await page.getByRole('button', { name: 'Apply Filters' }).click()
      
      // 4. View detailed log
      await page.locator('tr').first().click()
      await expect(page.getByRole('dialog', { name: 'Log Details' })).toBeVisible()
      await expect(page.getByText('IP Address:')).toBeVisible()
      await expect(page.getByText('User Agent:')).toBeVisible()
      await expect(page.getByText('Request ID:')).toBeVisible()
      
      // 5. Export logs
      await page.getByRole('button', { name: 'Close' }).click()
      await page.getByRole('button', { name: 'Export Logs' }).click()
      await page.getByLabel('Export Format').selectOption('json')
      
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Download' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('audit-logs')
    })
    
    test('should monitor system health', async ({ page }) => {
      await navigateToAdminDashboard(page)
      await page.goto('/admin/system/health')
      
      // 1. View health metrics
      await expect(page.getByRole('heading', { name: 'System Health' })).toBeVisible()
      
      // 2. Check service status
      const services = ['Database', 'Redis Cache', 'AI Services', 'Storage', 'Email Service']
      for (const service of services) {
        const status = page.locator('.service-card').filter({ hasText: service })
        await expect(status).toBeVisible()
        await expect(status.locator('.status-indicator')).toHaveClass(/status-(green|yellow|red)/)
      }
      
      // 3. View performance metrics
      await page.getByRole('tab', { name: 'Performance' }).click()
      await expect(page.locator('#cpu-usage-chart')).toBeVisible()
      await expect(page.locator('#memory-usage-chart')).toBeVisible()
      await expect(page.locator('#response-time-chart')).toBeVisible()
      
      // 4. Set up alerts
      await page.getByRole('button', { name: 'Configure Alerts' }).click()
      await page.getByLabel('CPU Usage Alert').fill('80')
      await page.getByLabel('Memory Usage Alert').fill('90')
      await page.getByLabel('Response Time Alert').fill('1000')
      await page.getByLabel('Alert Email').fill('alerts@mydub.ai')
      await page.getByRole('button', { name: 'Save Alert Config' }).click()
      
      await waitForToast(page, 'Alert configuration saved')
    })
  })
})