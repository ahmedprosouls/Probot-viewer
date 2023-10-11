import test, { expect } from '@playwright/test'
import { createId } from '@paralleldrive/cuid2'
import { createprobots } from '@typebot.io/lib/playwright/databaseActions'
import { parseDefaultGroupWithBlock } from '@typebot.io/lib/playwright/databaseHelpers'
import {
  defaultChatwootOptions,
  IntegrationBlockType,
} from '@typebot.io/schemas'

const probotId = createId()

const chatwootTestWebsiteToken = 'tueXiiqEmrWUCZ4NUyoR7nhE'

test('should work as expected', async ({ page }) => {
  await createprobots([
    {
      id: probotId,
      ...parseDefaultGroupWithBlock(
        {
          type: IntegrationBlockType.CHATWOOT,
          options: {
            ...defaultChatwootOptions,
            websiteToken: chatwootTestWebsiteToken,
          },
        },
        { withGoButton: true }
      ),
    },
  ])
  await page.goto(`/${probotId}-public`)
  await page.getByRole('button', { name: 'Go' }).click()
  await expect(page.locator('#chatwoot_live_chat_widget')).toBeVisible()
})
