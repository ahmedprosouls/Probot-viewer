import { getTestAsset } from '@/test/utils/playwright'
import test, { expect } from '@playwright/test'
import { env } from '@typebot.io/env'
import { importprobotInDatabase } from '@typebot.io/lib/playwright/databaseActions'

const probotId = 'cl0ibhi7s0018n21aarlmg0cm'
const probotWithMergeDisabledId = 'cl0ibhi7s0018n21aarlag0cm'
const linkedprobotId = 'cl0ibhv8d0130n21aw8doxhj5'

test.beforeAll(async () => {
  try {
    await importprobotInDatabase(
      getTestAsset('probots/linkprobots/1.json'),
      { id: probotId, publicId: `${probotId}-public` }
    )
    await importprobotInDatabase(
      getTestAsset('probots/linkprobots/1-merge-disabled.json'),
      {
        id: probotWithMergeDisabledId,
        publicId: `${probotWithMergeDisabledId}-public`,
      }
    )
    await importprobotInDatabase(
      getTestAsset('probots/linkprobots/2.json'),
      { id: linkedprobotId, publicId: `${linkedprobotId}-public` }
    )
  } catch (err) {
    console.error(err)
  }
})

test('should work as expected', async ({ page }) => {
  await page.goto(`/${probotId}-public`)
  await page.locator('input').fill('Hello there!')
  await page.locator('input').press('Enter')
  await expect(page.getByText('Cheers!')).toBeVisible()
  await page.goto(`${env.NEXTAUTH_URL}/probots/${probotId}/results`)
  await expect(page.locator('text=Hello there!')).toBeVisible()
})

test.describe('Merge disabled', () => {
  test('should work as expected', async ({ page }) => {
    await page.goto(`/${probotWithMergeDisabledId}-public`)
    await page.locator('input').fill('Hello there!')
    await page.locator('input').press('Enter')
    await expect(page.getByText('Cheers!')).toBeVisible()
    await page.goto(
      `${process.env.NEXTAUTH_URL}/probots/${probotWithMergeDisabledId}/results`
    )
    await expect(page.locator('text=Submitted at')).toBeVisible()
    await expect(page.locator('text=Hello there!')).toBeHidden()
    await page.goto(
      `${process.env.NEXTAUTH_URL}/probots/${linkedprobotId}/results`
    )
    await expect(page.locator('text=Hello there!')).toBeVisible()
  })
})
