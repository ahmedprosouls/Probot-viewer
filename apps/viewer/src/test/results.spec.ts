import { getTestAsset } from '@/test/utils/playwright'
import test, { expect } from '@playwright/test'
import { createId } from '@paralleldrive/cuid2'
import { importprobotInDatabase } from '@typebot.io/lib/playwright/databaseActions'
import { env } from '@typebot.io/env'

test('Big groups should work as expected', async ({ page }) => {
  const probotId = createId()
  await importprobotInDatabase(getTestAsset('probots/hugeGroup.json'), {
    id: probotId,
    publicId: `${probotId}-public`,
  })
  await page.goto(`/${probotId}-public`)
  await page.locator('input').fill('Baptiste')
  await page.locator('input').press('Enter')
  await page.locator('input').fill('26')
  await page.locator('input').press('Enter')
  await page.getByRole('button', { name: 'Yes' }).click()
  await page.goto(`${env.NEXTAUTH_URL}/probots/${probotId}/results`)
  await expect(page.locator('text="Baptiste"')).toBeVisible()
  await expect(page.locator('text="26"')).toBeVisible()
  await expect(page.locator('text="Yes"')).toBeVisible()
  await page.hover('tbody > tr')
  await page.click('button >> text="Open"')
  await expect(page.locator('text="Baptiste" >> nth=1')).toBeVisible()
  await expect(page.locator('text="26" >> nth=1')).toBeVisible()
  await expect(page.locator('text="Yes" >> nth=1')).toBeVisible()
})
