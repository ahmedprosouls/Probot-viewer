import { getTestAsset } from '@/test/utils/playwright'
import test, { expect } from '@playwright/test'
import { createId } from '@paralleldrive/cuid2'
import { importprobotInDatabase } from '@typebot.io/lib/playwright/databaseActions'

test('should correctly be injected', async ({ page }) => {
  const probotId = createId()
  await importprobotInDatabase(
    getTestAsset('probots/predefinedVariables.json'),
    { id: probotId, publicId: `${probotId}-public` }
  )
  await page.goto(`/${probotId}-public`)
  await expect(page.locator('text="Your name is"')).toBeVisible()
  await page.goto(`/${probotId}-public?Name=Baptiste&Email=email@test.com`)
  await expect(page.locator('text="Your name is Baptiste"')).toBeVisible()
  await expect(page.getByPlaceholder('Type your email...')).toHaveValue(
    'email@test.com'
  )
})
